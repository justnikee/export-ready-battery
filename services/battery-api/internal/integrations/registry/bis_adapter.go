package registry

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// bisAdapter verifies BIS CRS registration numbers via the BIS portal.
// Since BIS does not expose a public REST API, this adapter uses HTTP
// scraping of the public search portal. If the portal structure changes,
// the adapter gracefully falls back to self_declared.
type bisAdapter struct {
	baseURL string
	client  *http.Client
	cb      *circuitBreaker
}

func newBISAdapter(baseURL string, client *http.Client) *bisAdapter {
	if baseURL == "" {
		baseURL = "https://www.bis.gov.in"
	}
	return &bisAdapter{
		baseURL: baseURL,
		client:  client,
		cb:      newCircuitBreaker("BIS"),
	}
}

func (a *bisAdapter) Name() string { return "BIS CRS" }
func (a *bisAdapter) Type() models.RegistryType { return models.RegistryTypeBIS }
func (a *bisAdapter) IsConfigured() bool { return a.baseURL != "" }

func (a *bisAdapter) Verify(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error) {
	if !a.IsConfigured() {
		return selfDeclared(a.Name(), certificateNo), nil
	}

	// Validate R-Number format: R- followed by digits
	if !isValidBISRNumber(certificateNo) {
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message": "Invalid BIS R-Number format. Expected R-XXXXXXXX.",
				"certificate_no": certificateNo,
			},
		}, nil
	}

	var result *VerifyResult
	err := a.cb.Call(func() error {
		var verifyErr error
		result, verifyErr = a.scrapeBISPortal(ctx, certificateNo, batchMetadata)
		return verifyErr
	})

	if err != nil {
		slog.Error("BIS verification failed", "certificate", certificateNo, "error", err, "cb_state", a.cb.State())
		return &VerifyResult{
			Status:    models.RegistryStatusError,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message": fmt.Sprintf("BIS portal unreachable: %v", err),
				"certificate_no": certificateNo,
				"circuit_breaker": a.cb.State(),
			},
			ErrorMessage: err.Error(),
		}, nil
	}

	return result, nil
}

func (a *bisAdapter) scrapeBISPortal(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error) {
	// The exact BIS portal search URL may vary; this is a best-effort endpoint.
	// If BIS changes their portal, this request will fail and the adapter
	// falls back to self_declared.
	searchURL := fmt.Sprintf("%s/crs/lmis_product/search?searchText=%s", a.baseURL, certificateNo)

	req, err := registryRequest(http.MethodGet, searchURL)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("BIS request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("BIS returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20)) // 1MB limit
	if err != nil {
		return nil, fmt.Errorf("BIS response read failed: %w", err)
	}

	html := string(body)

	// Attempt to parse the HTML for registration details.
	// BIS portal search results typically contain:
	// - Registration Number
	// - Manufacturer Name
	// - Product Name
	// - IS Standard
	// - Status (Active/Expired)
	// - Validity Period
	//
	// Since the exact DOM structure is not stable, we use regex heuristics.
	// If we cannot find the R-Number in the response, we treat it as not_found.

	if !strings.Contains(html, certificateNo) {
		return &VerifyResult{
			Status:    models.RegistryStatusNotFound,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message":        "BIS R-Number not found in portal search results.",
				"certificate_no": certificateNo,
				"search_url":     searchURL,
			},
		}, nil
	}

	// Extract fields with safe regex patterns
	manufacturer := extractBISField(html, `(?i)manufacturer\s*[:\-]?\s*([^<\n]+)`)
	productName := extractBISField(html, `(?i)product\s*name\s*[:\-]?\s*([^<\n]+)`)
	isStandard := extractBISField(html, `(?i)IS\s*Standard\s*[:\-]?\s*([^<\n]+)`)
	status := extractBISField(html, `(?i)status\s*[:\-]?\s*([^<\n]+)`)
	validity := extractBISField(html, `(?i)validity\s*[:\-]?\s*([^<\n]+)`)

	// Determine trust tier and status based on extracted data
	trustTier := models.TrustTierRegistry
	regStatus := models.RegistryStatusVerified
	if strings.Contains(strings.ToLower(status), "expired") {
		regStatus = models.RegistryStatusFailed
		trustTier = models.TrustTierSelfDeclared
	}

	return &VerifyResult{
		Status:    regStatus,
		TrustTier: trustTier,
		VerifiedData: map[string]interface{}{
			"certificate_no":  certificateNo,
			"manufacturer":    strings.TrimSpace(manufacturer),
			"product_name":    strings.TrimSpace(productName),
			"is_standard":     strings.TrimSpace(isStandard),
			"status":          strings.TrimSpace(status),
			"validity_period": strings.TrimSpace(validity),
			"source":          "BIS portal scrape",
			"scraped_at":      time.Now().UTC().Format(time.RFC3339),
		},
	}, nil
}

func isValidBISRNumber(s string) bool {
	if s == "" {
		return false
	}
	// Accept formats like R-12345678, R12345678, or just numeric
	matched, _ := regexp.MatchString(`^[Rr]-?\d+$`, s)
	return matched
}

func extractBISField(html, pattern string) string {
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return ""
}
