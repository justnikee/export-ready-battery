package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"

	"github.com/google/uuid"
)

// epcisContext is the canonical GS1 EPCIS 2.0 JSON-LD context URL.
const epcisContext = "https://ref.gs1.org/standards/epcis/epcis-context.jsonld"

// bizStepMap maps our action codes to GS1 CBV bizStep URNs.
var bizStepMap = map[models.TransitionAction]string{
	models.ActionActivate: "urn:epcglobal:cbv:bizstep:commissioning",
	models.ActionShip:     "urn:epcglobal:cbv:bizstep:shipping",
	models.ActionInstall:  "urn:epcglobal:cbv:bizstep:installing",
	models.ActionRecall:   "urn:epcglobal:cbv:bizstep:recall",
	models.ActionRecycle:  "urn:epcglobal:cbv:bizstep:disposing",
	models.ActionClose:    "urn:epcglobal:cbv:bizstep:decommissioning",
}

// transactionEventActions lists actions that map to TransactionEvent type.
var transactionEventActions = map[models.TransitionAction]bool{
	models.ActionActivate: true,
	models.ActionClose:    true,
}

// EPCISDocument represents a GS1 EPCIS 2.0 JSON-LD document.
type EPCISDocument struct {
	Context          string        `json:"@context"`
	Type             string        `json:"type"`
	SchemaVersion    string        `json:"schemaVersion"`
	CreationDate     time.Time     `json:"creationDate"`
	EPCISBody        EPCISBody     `json:"epcisBody"`
}

// EPCISBody wraps the event list.
type EPCISBody struct {
	EventList []EPCISEvent `json:"eventList"`
}

// EPCISEvent represents a single EPCIS event (ObjectEvent or TransactionEvent).
type EPCISEvent struct {
	Type                string                   `json:"type"`
	EventID             string                   `json:"eventID"`
	EventTime           time.Time                `json:"eventTime"`
	EventTimeZoneOffset string                   `json:"eventTimeZoneOffset"`
	EPCList             []string                 `json:"epcList,omitempty"`
	Action              string                   `json:"action"`
	BizStep             string                   `json:"bizStep,omitempty"`
	Disposition         string                   `json:"disposition,omitempty"`
	ReadPoint           *EPCISReadPoint          `json:"readPoint,omitempty"`
	BizTransactionList  []EPCISBizTransaction    `json:"bizTransactionList,omitempty"`
	SourceList          []EPCISSource            `json:"sourceList,omitempty"`
	ILMD                map[string]interface{}   `json:"ilmd,omitempty"`
}

// EPCISReadPoint identifies the physical location of an event.
type EPCISReadPoint struct {
	ID string `json:"id"`
}

// EPCISBizTransaction represents a business transaction reference.
type EPCISBizTransaction struct {
	Type  string `json:"type"`
	BizTx string `json:"bizTransaction"`
}

// EPCISSource represents the source actor.
type EPCISSource struct {
	Type   string `json:"type"`
	Source string `json:"source"`
}

// BuildEPCISDocument creates a GS1 EPCIS 2.0 JSON-LD document from passport events.
func BuildEPCISDocument(passportID uuid.UUID, passport *models.Passport, events []*models.PassportEvent) *EPCISDocument {
	epcID := fmt.Sprintf("urn:epc:id:giai:%s", passport.SerialNumber)

	var epcisEvents []EPCISEvent
	for _, ev := range events {
		if ev.Action == "" {
			continue // skip non-transition events
		}

		eventType := "ObjectEvent"
		if transactionEventActions[ev.Action] {
			eventType = "TransactionEvent"
		}

		event := EPCISEvent{
			Type:                eventType,
			EventID:             fmt.Sprintf("urn:uuid:%s", ev.ID.String()),
			EventTime:           ev.CreatedAt,
			EventTimeZoneOffset: "+00:00",
			EPCList:             []string{epcID},
			Action:              "OBSERVE",
			BizStep:             bizStepMap[ev.Action],
			Disposition:         buildDisposition(ev.StatusTo),
		}

		// ReadPoint: prefer GPS from metadata, fall back to IP
		event.ReadPoint = buildReadPoint(ev)

		// bizTransactionList: shipment reference → bill of lading
		if ref := metaString(ev.Metadata, "shipment_reference"); ref != "" {
			event.BizTransactionList = []EPCISBizTransaction{
				{
					Type:  "urn:epcglobal:cbv:btt:bol",
					BizTx: ref,
				},
			}
		}

		// sourceList: actor + role
		if ev.Actor != "" {
			sourceType := "urn:epcglobal:cbv:sdt:owning_party"
			if ev.ActorRole != "" {
				sourceType = fmt.Sprintf("urn:epcglobal:cbv:sdt:%s", strings.ToLower(string(ev.ActorRole)))
			}
			event.SourceList = []EPCISSource{
				{Type: sourceType, Source: ev.Actor},
			}
		}

		// ILMD: audit hash extension
		if ev.Hash != "" {
			event.ILMD = map[string]interface{}{
				"auditHash": ev.Hash,
			}
		}

		epcisEvents = append(epcisEvents, event)
	}

	return &EPCISDocument{
		Context:       epcisContext,
		Type:          "EPCISDocument",
		SchemaVersion: "2.0",
		CreationDate:  time.Now().UTC(),
		EPCISBody: EPCISBody{
			EventList: epcisEvents,
		},
	}
}

// buildDisposition maps a StatusTo value to a GS1 CBV disposition URN.
func buildDisposition(status string) string {
	switch status {
	case models.PassportStatusActive:
		return "urn:epcglobal:cbv:disp:active"
	case models.PassportStatusShipped:
		return "urn:epcglobal:cbv:disp:in_transit"
	case models.PassportStatusInService:
		return "urn:epcglobal:cbv:disp:in_progress"
	case models.PassportStatusRecalled:
		return "urn:epcglobal:cbv:disp:recalled"
	case models.PassportStatusRecycled:
		return "urn:epcglobal:cbv:disp:disposed"
	case models.PassportStatusEndOfLife:
		return "urn:epcglobal:cbv:disp:non_sellable_other"
	}
	return ""
}

// buildReadPoint returns a GS1 ReadPoint from metadata GPS or IP.
func buildReadPoint(ev *models.PassportEvent) *EPCISReadPoint {
	lat := metaFloat(ev.Metadata, "lat")
	lng := metaFloat(ev.Metadata, "lng")
	if lat != 0 || lng != 0 {
		return &EPCISReadPoint{
			ID: fmt.Sprintf("geo:%f,%f", lat, lng),
		}
	}
	if ev.IPAddress != "" {
		return &EPCISReadPoint{
			ID: fmt.Sprintf("urn:epc:id:ip:%s", ev.IPAddress),
		}
	}
	return nil
}

func metaString(m map[string]interface{}, key string) string {
	if m == nil {
		return ""
	}
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func metaFloat(m map[string]interface{}, key string) float64 {
	if m == nil {
		return 0
	}
	if v, ok := m[key]; ok {
		switch f := v.(type) {
		case float64:
			return f
		case float32:
			return float64(f)
		}
	}
	return 0
}
