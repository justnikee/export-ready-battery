package compliance

import (
	"encoding/json"
	"log/slog"
)

// Gap represents a single compliance gap — a missing or invalid data point
// that maps directly to a regulatory requirement.
type Gap struct {
	Field      string `json:"field"`
	Market     string `json:"market,omitempty"`
	Regulation string `json:"regulation,omitempty"`
	Message    string `json:"message"`
	Severity   string `json:"severity"` // "ERROR" blocks activation; "WARNING" is informational
}

// Result is the output of a compliance validation run.
type Result struct {
	Valid     bool     `json:"valid"`
	Score     float64  `json:"score"`              // 0.0 – 100.0
	Missing   []string `json:"missing,omitempty"`  // required field paths that are absent
	Errors    []string `json:"errors,omitempty"`   // hard rule violations that block activation
	Warnings  []string `json:"warnings,omitempty"` // soft informational notices
	Gaps      []Gap    `json:"gaps,omitempty"`     // structured gap objects for DB storage
}

// GapsJSON serialises the Gap slice as a json.RawMessage ready for the
// compliance_gaps JSONB column in the batches table.
func (r Result) GapsJSON() json.RawMessage {
	if len(r.Gaps) == 0 {
		return json.RawMessage("[]")
	}
	b, err := json.Marshal(r.Gaps)
	if err != nil {
		slog.Error("compliance: failed to marshal gaps", "error", err, "gap_count", len(r.Gaps))
		return json.RawMessage("[]")
	}
	return json.RawMessage(b)
}

// Aggregate merges multiple Results into one composite result.
// Used for GLOBAL market compliance where both India and EU validators run.
// The composite score is the arithmetic mean; validity requires all Results to be valid.
func Aggregate(results ...Result) Result {
	if len(results) == 0 {
		return Result{Valid: true, Score: 100.0}
	}

	merged := Result{}
	totalScore := 0.0
	for _, r := range results {
		merged.Missing = append(merged.Missing, r.Missing...)
		merged.Errors = append(merged.Errors, r.Errors...)
		merged.Warnings = append(merged.Warnings, r.Warnings...)
		merged.Gaps = append(merged.Gaps, r.Gaps...)
		totalScore += r.Score
	}
	merged.Score = totalScore / float64(len(results))
	merged.Valid = len(merged.Missing) == 0 && len(merged.Errors) == 0
	return merged
}

// ScoreFromCheckpoints calculates a 0–100 compliance score.
//
//   - totalCheckpoints: the total number of discrete rules/fields evaluated.
//   - criticalFailures: the count of hard-blocking gaps (missing required fields + errors).
//
// Warnings do not reduce the score.
func ScoreFromCheckpoints(totalCheckpoints, criticalFailures int) float64 {
	if totalCheckpoints <= 0 {
		return 100.0
	}
	if criticalFailures >= totalCheckpoints {
		return 0.0
	}
	passed := float64(totalCheckpoints - criticalFailures)
	return (passed / float64(totalCheckpoints)) * 100.0
}
