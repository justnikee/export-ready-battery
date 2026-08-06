package limits

import "testing"

func TestUploadCeilingsWithinGlobalBodyLimit(t *testing.T) {
	checks := []struct {
		name string
		n    int64
	}{
		{"csv", MaxCSVUploadBytes},
		{"passport", MaxPassportDocBytes},
		{"ai", MaxAIDatasheetBytes},
		{"cmrt", MaxCMRTUploadBytes},
		{"evidence", MaxEvidenceUploadBytes},
		{"cert", MaxCertUploadBytes},
		{"dgft", MaxDGFTDocBytes},
		{"supplier", MaxSupplierDocBytes},
		{"telemetry", MaxTelemetryCSVBytes},
		{"logo", MaxLogoUploadBytes},
		{"webhook", MaxWebhookBodyBytes},
		{"tally", MaxTallyImportBytes},
	}
	for _, c := range checks {
		if c.n > MaxRequestBodyBytes {
			t.Errorf("%s=%d exceeds MaxRequestBodyBytes=%d (P-06)", c.name, c.n, MaxRequestBodyBytes)
		}
		if c.n <= 0 {
			t.Errorf("%s must be positive", c.name)
		}
	}
	if MaxRequestBodyMB != 10 {
		t.Fatalf("MaxRequestBodyMB=%d want 10", MaxRequestBodyMB)
	}
}
