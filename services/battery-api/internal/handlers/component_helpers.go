package handlers

import (
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
)

// convertComponentTree maps repository component tree nodes to models.Component
// for embedding in batch snapshots and passport JSON.
func convertComponentTree(nodes []*repository.ComponentTreeNode) []models.Component {
	if len(nodes) == 0 {
		return nil
	}
	result := make([]models.Component, len(nodes))
	for i, n := range nodes {
		c := models.Component{
			ID:                   n.ID.String(),
			Name:                 n.Name,
			ComponentType:        n.ComponentType,
			ModelNumber:          derefString(n.ModelNumber),
			SerialNumber:         derefString(n.SerialNumber),
			LotNumber:            derefString(n.LotNumber),
			Manufacturer:         derefString(n.Manufacturer),
			ManufacturerAddress:  derefString(n.ManufacturerAddress),
			CountryOfOrigin:      derefString(n.CountryOfOrigin),
			Chemistry:            derefString(n.Chemistry),
			WeightKg:             derefFloat64(n.WeightKg),
			Quantity:             1,
			CEMarking:            n.CEMarking,
			BISNumber:            derefString(n.BISNumber),
			HazardousLead:        n.HazardousLead,
			HazardousMercury:     n.HazardousMercury,
			HazardousCadmium:     n.HazardousCadmium,
			Children:             convertComponentTree(n.Children),
		}
		if n.ParentID != nil {
			pid := n.ParentID.String()
			c.ParentID = &pid
		}
		if n.CobaltPct != nil {
			c.CobaltPct = *n.CobaltPct
		}
		if n.LithiumPct != nil {
			c.LithiumPct = *n.LithiumPct
		}
		if n.NickelPct != nil {
			c.NickelPct = *n.NickelPct
		}
		if n.ManganesePct != nil {
			c.ManganesePct = *n.ManganesePct
		}
		if n.GraphitePct != nil {
			c.GraphitePct = *n.GraphitePct
		}
		if n.LeadPct != nil {
			c.LeadPct = *n.LeadPct
		}
		if n.RecycledCobaltPct != nil {
			c.RecycledCobaltPct = *n.RecycledCobaltPct
		}
		if n.RecycledLithiumPct != nil {
			c.RecycledLithiumPct = *n.RecycledLithiumPct
		}
		if n.RecycledNickelPct != nil {
			c.RecycledNickelPct = *n.RecycledNickelPct
		}
		if n.RecycledLeadPct != nil {
			c.RecycledLeadPct = *n.RecycledLeadPct
		}
		if n.DateOfManufacture != nil {
			c.DateOfManufacture = n.DateOfManufacture.Format("2006-01-02")
		}
		result[i] = c
	}
	return result
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefFloat64(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}
