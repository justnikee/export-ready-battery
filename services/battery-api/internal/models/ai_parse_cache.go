package models

import (
	"encoding/json"
	"time"
)

// AIParseCacheEntry represents a cached AI/regex extraction result in the
// ai_parse_cache table. Entries are immutable — same text hash + prompt version +
// task always produces the same result. Bumping PromptVersion invalidates the cache.
type AIParseCacheEntry struct {
	TextHash       string          `json:"text_hash"`
	PromptVersion  int             `json:"prompt_version"`
	Task           string          `json:"task"`
	Result         json.RawMessage `json:"result"`
	Method         string          `json:"method"`     // "regex", "llm", "regex+llm"
	Confidence     float64         `json:"confidence"`
	Model          string          `json:"model"`      // e.g. "llama-3.3-70b-versatile", "" for regex-only
	CreatedAt      time.Time       `json:"created_at"`
}
