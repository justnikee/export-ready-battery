package models

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

// Evidence represents structured, action-specific proof fields.
type Evidence map[string]string

// GeoPoint captures a GPS fix from a field device.
// Coordinates are WGS-84. AccuracyMeters is the horizontal accuracy radius
// reported by the browser Geolocation API (or device GPS).
// Per GDPR Art. 4(1) these coordinates constitute personal data when stored
// alongside an actor identity — access is scoped to Regulator-tier only.
type GeoPoint struct {
	Lat            float64 `json:"lat"`
	Lng            float64 `json:"lng"`
	AccuracyMeters float64 `json:"accuracy_meters"`
}

var (
	ErrInvalidEvidence = errors.New("invalid evidence")
)

const (
	EvidenceShipmentReference    = "shipment_reference"
	EvidenceShipmentDate         = "shipment_date"
	EvidenceInstallationDate     = "installation_date"
	EvidenceInstallerID          = "installer_id"
	EvidenceRecyclerEprID        = "recycler_epr_id"
	EvidenceRecyclingDate        = "recycling_date"
	EvidenceCertificateReference = "certificate_reference"
	EvidenceRecallReason         = "recall_reason"
	EvidenceRecallReference      = "recall_reference"
)

var evidenceRequirementsByAction = map[TransitionAction][]string{
	ActionShip:          {EvidenceShipmentReference, EvidenceShipmentDate},
	ActionInstall:       {EvidenceInstallationDate, EvidenceInstallerID},
	ActionRecycle:       {EvidenceRecyclerEprID, EvidenceRecyclingDate, EvidenceCertificateReference},
	ActionRecall:        {EvidenceRecallReason, EvidenceRecallReference},
	ActionClose:         {EvidenceCertificateReference},
	ActionRemanufacture: {EvidenceRecyclerEprID, EvidenceCertificateReference},
	ActionReuse:         {EvidenceRecyclerEprID, EvidenceCertificateReference},
	ActionRepurpose:     {EvidenceRecyclerEprID, EvidenceCertificateReference},
}

var evidenceDateFields = map[string]bool{
	EvidenceShipmentDate:     true,
	EvidenceInstallationDate: true,
	EvidenceRecyclingDate:    true,
}

type EvidenceValidationResult struct {
	Evidence Evidence
	Dates    map[string]time.Time
}

// ValidateEvidence enforces action-specific evidence requirements and normalizes fields.
func ValidateEvidence(action TransitionAction, evidence Evidence) (EvidenceValidationResult, error) {
	required := evidenceRequirementsByAction[action]
	if evidence == nil {
		evidence = Evidence{}
	}

	if len(required) == 0 {
		if len(evidence) > 0 {
			return EvidenceValidationResult{}, fmt.Errorf("%w: evidence not allowed for action %s", ErrInvalidEvidence, action)
		}
		return EvidenceValidationResult{Evidence: Evidence{}, Dates: map[string]time.Time{}}, nil
	}

	if len(evidence) == 0 {
		return EvidenceValidationResult{}, fmt.Errorf("%w: evidence is required for action %s", ErrInvalidEvidence, action)
	}

	requiredSet := make(map[string]struct{}, len(required))
	for _, field := range required {
		requiredSet[field] = struct{}{}
	}

	for key := range evidence {
		if _, ok := requiredSet[key]; !ok {
			return EvidenceValidationResult{}, fmt.Errorf("%w: unexpected evidence field %s", ErrInvalidEvidence, key)
		}
	}

	normalized := Evidence{}
	dates := map[string]time.Time{}

	for _, field := range required {
		value := strings.TrimSpace(evidence[field])
		if value == "" {
			return EvidenceValidationResult{}, fmt.Errorf("%w: %s is required", ErrInvalidEvidence, field)
		}
		if evidenceDateFields[field] {
			parsed, err := parseEvidenceDate(value)
			if err != nil {
				return EvidenceValidationResult{}, fmt.Errorf("%w: %s must be a valid date", ErrInvalidEvidence, field)
			}
			normalized[field] = parsed.Format(time.RFC3339)
			dates[field] = parsed
			continue
		}
		normalized[field] = value
	}

	return EvidenceValidationResult{Evidence: normalized, Dates: dates}, nil
}

func parseEvidenceDate(value string) (time.Time, error) {
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		return parsed, nil
	}
	return time.Time{}, errors.New("invalid date format")
}

// ValidateReasonCode enforces that a reason_code is provided for actions that require one.
// ACTIVATE always requires a reason_code — the handler maps it to a SYSTEM actor but the
// trigger is always a human admin making a deliberate decision.
// CLOSE is already enforced by the evidence requirement (certificate_reference).
func ValidateReasonCode(action TransitionAction, reasonCode string) error {
	if action == ActionActivate {
		if strings.TrimSpace(reasonCode) == "" {
			return fmt.Errorf("reason_code is required for ACTIVATE action (e.g. \"BATCH_QC_PASS\", \"MANUAL_OVERRIDE\")")
		}
	}
	return nil
}
