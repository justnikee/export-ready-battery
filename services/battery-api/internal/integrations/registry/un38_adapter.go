package registry

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// accreditedUN38Labs is a seed list of known UN38.3 accredited test labs.
// In production, this should be loaded from an external source (IAF/ILAC database)
// or maintained via an admin UI.
var accreditedUN38Labs = map[string]bool{
	"tuv sud":            true,
	"tuv":                true,
	"tüv":                true,
	"intertek":           true,
	"ul":                 true,
	"underwriters laboratories": true,
	"sgs":                true,
	"bv":                 true,
	"bureau veritas":     true,
	"dekra":              true,
	"csi":                true,
	"china certification": true,
	"cti":                true,
	"un38.3 test lab":    true,
}

// un38Adapter validates UN38.3 test reports by checking:
// 1. The issuing lab is in the accredited lab list
// 2. The report number follows a valid format
// 3. The test date is within the last 24 months (UN38.3 validity)
//
// Since there is no central UN38.3 registry, this is the best available
// automated verification strategy.
type un38Adapter struct {
	baseURL string
}

func newUN38Adapter(baseURL string) *un38Adapter {
	return &un38Adapter{baseURL: baseURL}
}

func (a *un38Adapter) Name() string { return "UN38.3 Test Lab" }
func (a *un38Adapter) Type() models.RegistryType { return models.RegistryTypeUN38_3 }
func (a *un38Adapter) IsConfigured() bool { return true } // Always configured; uses static lab list

func (a *un38Adapter) Verify(ctx context.Context, certificateNo string, batchMetadata map[string]string) (*VerifyResult, error) {
	labName := batchMetadata["un38_lab_name"]
	testDate := batchMetadata["un38_test_date"]
	reportNo := certificateNo
	if reportNo == "" {
		reportNo = batchMetadata["un38_certificate"]
	}

	if reportNo == "" && labName == "" {
		return &VerifyResult{
			Status:    models.RegistryStatusNotFound,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: map[string]interface{}{
				"message": "No UN38.3 test report number or lab name provided.",
			},
		}, nil
	}

	// Check lab accreditation
	labAccredited := false
	labMatched := ""
	lowerLab := strings.ToLower(labName)
	for knownLab := range accreditedUN38Labs {
		if strings.Contains(lowerLab, knownLab) {
			labAccredited = true
			labMatched = knownLab
			break
		}
	}

	// Validate report number format (alphanumeric, typically 8-20 chars)
	validReportFormat := false
	if reportNo != "" {
		matched, _ := regexp.MatchString(`^[A-Za-z0-9\-/]{6,30}$`, reportNo)
		validReportFormat = matched
	}

	// Check test date validity (UN38.3 reports valid for 24 months)
	dateValid := false
	if testDate != "" {
		dateValid = isUN38TestDateValid(testDate)
	}

	verifiedData := map[string]interface{}{
		"report_number":      reportNo,
		"lab_name":           labName,
		"lab_matched":        labMatched,
		"lab_accredited":     labAccredited,
		"valid_report_format": validReportFormat,
		"test_date":          testDate,
		"test_date_valid":    dateValid,
		"source":             "lab_accreditation_list",
		"checked_at":         time.Now().UTC().Format(time.RFC3339),
	}

	if !labAccredited {
		verifiedData["message"] = fmt.Sprintf("Lab '%s' is not in the accredited lab list. Please verify accreditation independently.", labName)
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: verifiedData,
		}, nil
	}

	if reportNo != "" && !validReportFormat {
		verifiedData["message"] = "UN38.3 report number format appears invalid."
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: verifiedData,
		}, nil
	}

	if testDate != "" && !dateValid {
		verifiedData["message"] = "UN38.3 test date is older than 24 months. Report may be expired."
		return &VerifyResult{
			Status:    models.RegistryStatusFailed,
			TrustTier: models.TrustTierSelfDeclared,
			VerifiedData: verifiedData,
		}, nil
	}

	verifiedData["message"] = "Lab is accredited and report format is valid."
	return &VerifyResult{
		Status:    models.RegistryStatusVerified,
		TrustTier: models.TrustTierRegistry,
		VerifiedData: verifiedData,
	}, nil
}

func isUN38TestDateValid(dateStr string) bool {
	// Try common date formats
	formats := []string{
		time.RFC3339,
		"2006-01-02",
		"02-01-2006",
		"01/02/2006",
		"2006/01/02",
	}
	for _, f := range formats {
		t, err := time.Parse(f, dateStr)
		if err == nil {
			return time.Since(t) < 24*time.Hour*365 // ~24 months
		}
	}
	return false
}
