package services

import (
	"fmt"
	"strings"

	"github.com/anvayalabs/battery-api/internal/models"
)

// BOMValidationResult holds the outcome of validating a component tree.
type BOMValidationResult struct {
	Valid   bool     `json:"valid"`
	Errors  []string `json:"errors,omitempty"`
}

// ValidateBOM checks a component hierarchy for structural and compliance issues.
// Rules:
//   - No cycles in parent references
//   - All cells must have chemistry declared
//   - Component types must be from the allowed set
//   - Parent IDs must reference components that exist in the list
func ValidateBOM(components []models.Component) BOMValidationResult {
	result := BOMValidationResult{Valid: true}
	if len(components) == 0 {
		return result // empty BOM is valid (optional field)
	}

	validTypes := map[string]bool{
		"cell":    true,
		"module":  true,
		"pack":    true,
		"bms":     true,
		"housing": true,
		"pcb":     true,
	}

	idMap := make(map[string]models.Component, len(components))
	for _, c := range components {
		idMap[c.ID] = c
	}

	// Check 1: all IDs are non-empty and unique
	seenIDs := make(map[string]bool)
	for _, c := range components {
		if strings.TrimSpace(c.ID) == "" {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("component %q has empty ID", c.Name))
			continue
		}
		if seenIDs[c.ID] {
			result.Valid = false
			result.Errors = append(result.Errors, fmt.Sprintf("duplicate component ID: %s", c.ID))
		}
		seenIDs[c.ID] = true
	}

	// Check 2: valid component types
	for _, c := range components {
		if !validTypes[c.ComponentType] {
			result.Valid = false
			result.Errors = append(result.Errors,
				fmt.Sprintf("component %q has invalid type %q (must be one of: cell, module, pack, bms, housing, pcb)", c.Name, c.ComponentType))
		}
	}

	// Check 3: parent IDs must exist
	for _, c := range components {
		if c.ParentID != nil && *c.ParentID != "" {
			if _, ok := idMap[*c.ParentID]; !ok {
				result.Valid = false
				result.Errors = append(result.Errors,
					fmt.Sprintf("component %q references unknown parent_id: %s", c.Name, *c.ParentID))
			}
		}
	}

	// Check 4: no cycles
	visited := make(map[string]bool)
	for _, c := range components {
		if hasCycle(idMap, c.ID, make(map[string]bool), visited) {
			result.Valid = false
			result.Errors = append(result.Errors,
				fmt.Sprintf("component %q (%s) is part of a cycle in the BOM hierarchy", c.Name, c.ID))
		}
	}

	// Check 5: cells must have chemistry
	for _, c := range components {
		if c.ComponentType == "cell" && strings.TrimSpace(c.Chemistry) == "" {
			result.Valid = false
			result.Errors = append(result.Errors,
				fmt.Sprintf("cell %q must declare chemistry (e.g. NMC811, LFP)", c.Name))
		}
	}

	return result
}

// hasCycle performs DFS to detect cycles in the parent reference graph.
func hasCycle(idMap map[string]models.Component, id string, stack, visited map[string]bool) bool {
	if stack[id] {
		return true
	}
	if visited[id] {
		return false
	}
	c, ok := idMap[id]
	if !ok {
		return false
	}

	visited[id] = true
	stack[id] = true
	defer delete(stack, id)

	if c.ParentID != nil && *c.ParentID != "" {
		if hasCycle(idMap, *c.ParentID, stack, visited) {
			return true
		}
	}
	return false
}
