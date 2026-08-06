// Package limits holds shared HTTP body / upload size constants (P-06).
//
// Global MaxBytesReader and all ParseMultipartForm memory caps must agree so
// clients never see "32MB allowed" then fail at 10MB with an opaque error.
package limits

// MaxRequestBodyBytes is the hard ceiling for every HTTP request body
// (http.MaxBytesReader in cmd/server). Upload handlers must not advertise more.
const MaxRequestBodyBytes int64 = 10 << 20 // 10 MiB

// Per-resource soft ceilings (must be ≤ MaxRequestBodyBytes).
const (
	MaxCSVUploadBytes      int64 = MaxRequestBodyBytes // batch CSV / bulk import
	MaxPassportDocBytes    int64 = MaxRequestBodyBytes // passport event documents
	MaxAIDatasheetBytes    int64 = MaxRequestBodyBytes
	MaxCMRTUploadBytes     int64 = MaxRequestBodyBytes
	MaxEvidenceUploadBytes int64 = MaxRequestBodyBytes
	MaxCertUploadBytes     int64 = 5 << 20 // EPR/BIS/PLI certificates
	MaxDGFTDocBytes        int64 = 5 << 20
	MaxSupplierDocBytes    int64 = 5 << 20
	MaxTelemetryCSVBytes   int64 = 5 << 20
	MaxLogoUploadBytes     int64 = 2 << 20
	MaxWebhookBodyBytes    int64 = 1 << 20
	MaxTallyImportBytes    int64 = MaxRequestBodyBytes
)

// MaxRequestBodyMB is for user-facing error strings.
const MaxRequestBodyMB = int(MaxRequestBodyBytes >> 20)
