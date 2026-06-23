package services

import (
	"encoding/json"
	"time"
)

// BuildInitialOwnershipHistory creates an initial ownership history array for a new passport.
func BuildInitialOwnershipHistory(ownerIdentifier, actor, source string, ts time.Time) (json.RawMessage, error) {
	entry := map[string]interface{}{
		"current_owner_identifier": ownerIdentifier,
		"timestamp":                ts,
		"actor":                    actor,
		"source":                   source,
	}

	data, err := json.Marshal([]interface{}{entry})
	if err != nil {
		return nil, err
	}

	return json.RawMessage(data), nil
}
