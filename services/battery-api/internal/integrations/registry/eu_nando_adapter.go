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

// euNandoAdapter verifies EU notified body numbers against the NANDO database.
// Since NANDO does not publish a documented REST API, this adapter scrapes
// the public web database. The data is public and scraping is legal.
type euNandoAdapter struct {
	baseURL string
	client  *http.Client
	cb      *circuitBreaker
}

func newEUNANDOAdapter(baseURL string, client *http.Client) *euNandoAdapter {
	if baseURL == "" {
		baseURL = "https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies"
	}
	return &euNandoAdapter{
		baseURL: baseURL,
		client:  client,
		cb:      newCircuitBreaker("EU_NANDO"),
	}
}

func (a *euNandoAdapter) Name() string { return "EU NANDO" }
func (a *euNandoAdapter) Type() models.RegistryType { return models.RegistryTypeEUNANDO }
func (a *euNandoAdapter) IsConfigured() bool { return a.baseURL != "" }

func (a *euNandoAdapter) Verify(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error) {
	if !a.IsConfigured() {
		return selfDeclared(a.Name(), certificateNo), nil
	}

	// Determine notified body number
	bodyNo := certificateNo
	if bodyNo == "" {
		bodyNo = batchMetadata["ce_notified_body_number"]
	}
	if bodyNo == "" {
		return &VerifyResult{
			Status:    models.RegistryStatusNotFound,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message": "No EU notified body number provided.",
			},
		}, nil
	}

	if !isValidNANDONumber(bodyNo) {
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message":        "Invalid EU notified body number format. Expected 4-digit number.",
				"notified_body":  bodyNo,
			},
		}, nil
	}

	var result *VerifyResult
	err := a.cb.Call(func() error {
		var verifyErr error
		result, verifyErr = a.scrapeNANDO(ctx, bodyNo)
		return verifyErr
	})

	if err != nil {
		slog.Error("EU NANDO verification failed", "body", bodyNo, "error", err, "cb_state", a.cb.State())
		return &VerifyResult{
			Status:    models.RegistryStatusError,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message":         fmt.Sprintf("NANDO database unreachable: %v", err),
				"notified_body":   bodyNo,
				"circuit_breaker": a.cb.State(),
			},
			ErrorMessage: err.Error(),
		}, nil
	}

	return result, nil
}

func (a *euNandoAdapter) scrapeNANDO(ctx context.Context, bodyNo string) (*VerifyResult, error) {
	// NANDO search URL pattern (best-effort)
	searchURL := fmt.Sprintf("%s?search=%s", a.baseURL, bodyNo)

	req, err := registryRequest(http.MethodGet, searchURL)
	if err != nil {
		return nil, err
	}
	req = req.WithContext(ctx)

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("NANDO request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("NANDO returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("NANDO response read failed: %w", err)
	}

	html := string(body)

	// If the body number is not present in the response, it's not found
	if !strings.Contains(html, bodyNo) {
		return &VerifyResult{
			Status:    models.RegistryStatusNotFound,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message":       "Notified body number not found in NANDO database.",
				"notified_body": bodyNo,
				"search_url":    searchURL,
			},
		}, nil
	}

	name := extractNANDOField(html, `(?i)`+regexp.QuoteMeta(bodyNo)+`\s*[\-\–]\s*([^<\n]+)`)
	country := extractNANDOField(html, `(?i)country\s*[:\-]?\s*([^<\n]+)`)
	status := extractNANDOField(html, `(?i)status\s*[:\-]?\s*([^<\n]+)`)

	trustTier := models.TrustTierRegistry
	regStatus := models.RegistryStatusVerified
	if strings.Contains(strings.ToLower(status), "withdrawn") || strings.Contains(strings.ToLower(status), "suspended") {
		trustTier = models.TrustTierSelfDeclared
		regStatus = models.RegistryStatusFailed
	}

	return &VerifyResult{
		Status:    regStatus,
		TrustTier: trustTier,
		VerifiedData: map[string]interface{}{
			"notified_body": bodyNo,
			"body_name":     strings.TrimSpace(name),
			"country":       strings.TrimSpace(country),
			"status":        strings.TrimSpace(status),
			"source":        "NANDO database scrape",
			"scraped_at":    time.Now().UTC().Format(time.RFC3339),
		},
	}, nil
}

func isValidNANDONumber(s string) bool {
	if s == "" {
		return false
	}
	// NANDO numbers are 4 digits, sometimes prefixed with NB
	s = strings.TrimPrefix(strings.ToUpper(strings.TrimSpace(s)), "NB")
	s = strings.TrimSpace(s)
	matched, _ := regexp.MatchString(`^\d{4}$`, s)
	return matched
}

func extractNANDOField(html, pattern string) string {
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(html)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return ""
}
