package tally

import (
	"encoding/xml"
	"fmt"
	"io"
	"regexp"
	"strings"
	"time"
)

// Document represents a parsed Tally Prime XML export.
type Document struct {
	Vouchers    []Voucher    `json:"vouchers"`
	StockItems  []StockItem  `json:"stock_items"`
	Ledgers     []Ledger     `json:"ledgers,omitempty"`
}

// Voucher represents a Tally voucher (Purchase, Sales, Receipt, etc.)
type Voucher struct {
	VoucherType         string           `json:"voucher_type"`
	Date                string           `json:"date"`
	PartyLedgerName     string           `json:"party_ledger_name"`
	GSTRegistrationType string           `json:"gst_registration_type"`
	StateName           string           `json:"state_name"`
	LedgerEntries       []LedgerEntry    `json:"ledger_entries"`
	InventoryEntries    []InventoryEntry `json:"inventory_entries"`
}

// LedgerEntry represents tax and ledger lines within a voucher
type LedgerEntry struct {
	LedgerName string  `json:"ledger_name"`
	Amount     float64 `json:"amount"`
}

// InventoryEntry represents stock-item lines within a voucher
type InventoryEntry struct {
	StockItemName string  `json:"stock_item_name"`
	Rate          string  `json:"rate"`
	Amount        float64 `json:"amount"`
	BilledQty     string  `json:"billed_qty"`
	GSTClass      string  `json:"gst_class"`
}

// StockItem represents a master stock item from Tally
type StockItem struct {
	Name         string  `json:"name"`
	Parent       string  `json:"parent"`
	BaseUnit     string  `json:"base_unit"`
	OpeningQty   float64 `json:"opening_qty"`
	ClosingQty   float64 `json:"closing_qty"`
}

// Ledger represents a master ledger from Tally
type Ledger struct {
	Name string `json:"name"`
}

// BatteryBatchDraft is the intermediate representation used to pre-fill
// a battery batch creation form from Tally data.
type BatteryBatchDraft struct {
	BatchName           string                   `json:"batch_name"`
	MaterialComposition []MaterialLine           `json:"material_composition"`
	SupplierName        string                   `json:"supplier_name"`
	SupplierState       string                   `json:"supplier_state"`
	TotalGST            float64                  `json:"total_gst"`
	HSNCode             string                   `json:"hsn_code"`
	ImportDate          string                   `json:"import_date"`
}

// MaterialLine is a single material extracted from Tally
type MaterialLine struct {
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Qty      float64 `json:"qty"`
	Rate     string  `json:"rate"`
	Amount   float64 `json:"amount"`
	Chemistry string `json:"chemistry,omitempty"`
}

// ParseTallyXML parses a Tally Prime XML export into a structured Document.
func ParseTallyXML(r io.Reader) (*Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, fmt.Errorf("failed to read XML: %w", err)
	}

	// Tally XML uses a flat structure with repeating LIST elements.
	// We decode manually to handle the flat ledger/inventory entries.
	var raw rawTallyMessage
	if err := xml.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("failed to parse XML: %w", err)
	}

	doc := &Document{}

	for _, msg := range raw.Body.Data.TallyMessages {
		for _, v := range msg.Vouchers {
			doc.Vouchers = append(doc.Vouchers, flattenVoucher(v))
		}
		for _, s := range msg.StockItems {
			doc.StockItems = append(doc.StockItems, flattenStockItem(s))
		}
		for _, l := range msg.Ledgers {
			doc.Ledgers = append(doc.Ledgers, Ledger{Name: l.Name})
		}
	}

	if len(doc.Vouchers) == 0 && len(doc.StockItems) == 0 {
		return nil, fmt.Errorf("no vouchers or stock items found in Tally export")
	}

	return doc, nil
}

// MapToBatteryBatchDraft converts a parsed Tally Document into a battery
// batch creation draft, deriving chemistry, supplier, and GST data.
func MapToBatteryBatchDraft(doc *Document) *BatteryBatchDraft {
	draft := &BatteryBatchDraft{
		BatchName: fmt.Sprintf("Tally Import %s", time.Now().Format("2006-01-02")),
	}

	// Derive material composition from stock items
	for _, si := range doc.StockItems {
		line := MaterialLine{
			Name:      si.Name,
			Category:  si.Parent,
			Qty:       si.ClosingQty - si.OpeningQty,
			Chemistry: DetectChemistryFromStockName(si.Name),
		}
		draft.MaterialComposition = append(draft.MaterialComposition, line)
	}

	// Supplement with purchase voucher data (supplier, GST, HSN)
	for _, v := range doc.Vouchers {
		if v.VoucherType != "Purchase" {
			continue
		}
		draft.SupplierName = v.PartyLedgerName
		draft.SupplierState = v.StateName
		draft.ImportDate = v.Date

		for _, le := range v.LedgerEntries {
			if strings.Contains(le.LedgerName, "GST") || strings.Contains(le.LedgerName, "CGST") || strings.Contains(le.LedgerName, "SGST") || strings.Contains(le.LedgerName, "IGST") {
				draft.TotalGST += le.Amount
			}
		}

		for _, inv := range v.InventoryEntries {
			if inv.GSTClass != "" {
				draft.HSNCode = inv.GSTClass
			}
			// Update rate/amount for matching stock item
			for i := range draft.MaterialComposition {
				if draft.MaterialComposition[i].Name == inv.StockItemName {
					draft.MaterialComposition[i].Rate = inv.Rate
					draft.MaterialComposition[i].Amount = inv.Amount
				}
			}
		}
	}

	return draft
}

// DetectChemistryFromStockName guesses battery chemistry from a Tally stock item name.
func DetectChemistryFromStockName(name string) string {
	upper := strings.ToUpper(name)
	switch {
	case strings.Contains(upper, "LFP") || strings.Contains(upper, "LIFEPO4") || strings.Contains(upper, "LI-FE"):
		return "LFP"
	case strings.Contains(upper, "NMC") || strings.Contains(upper, "NCM"):
		return "NMC"
	case strings.Contains(upper, "NCA"):
		return "NCA"
	case strings.Contains(upper, "LEAD ACID") || strings.Contains(upper, "LEAD-ACID") || strings.Contains(upper, "SLA"):
		return "Lead Acid"
	case strings.Contains(upper, "LCO") || strings.Contains(upper, "LICOO2"):
		return "LCO"
	default:
		return ""
	}
}

// ============================================================================
// Raw XML structs for decoding Tally's flat format
// ============================================================================

type rawTallyMessage struct {
	XMLName xml.Name `xml:"ENVELOPE"`
	Body    struct {
		Data struct {
			TallyMessages []struct {
				Vouchers    []rawVoucher    `xml:"VOUCHER"`
				StockItems  []rawStockItem  `xml:"STOCKITEM"`
				Ledgers     []rawLedger     `xml:"LEDGER"`
			} `xml:"TALLYMESSAGE"`
		} `xml:"DATA"`
	} `xml:"BODY"`
}

type rawVoucher struct {
	VoucherType         string                `xml:"VCHTYPE,attr"`
	Date                string                `xml:"DATE"`
	VoucherTypeName     string                `xml:"VOUCHERTYPENAME"`
	PartyLedgerName     string                `xml:"PARTYLEDGERNAME"`
	GSTRegistrationType string                `xml:"GSTREGISTRATIONTYPE"`
	StateName           string                `xml:"STATENAME"`
	LedgerEntries       []rawLedgerEntry      `xml:"ALLLEDGERENTRIES.LIST"`
	InventoryEntries    []rawInventoryEntry   `xml:"ALLINVENTORYENTRIES.LIST"`
}

type rawLedgerEntry struct {
	LedgerName string  `xml:"LEDGERNAME"`
	Amount     float64 `xml:"AMOUNT"`
}

type rawInventoryEntry struct {
	StockItemName string  `xml:"STOCKITEMNAME"`
	Rate          string  `xml:"RATE"`
	Amount        float64 `xml:"AMOUNT"`
	BilledQty     string  `xml:"BILLEDQTY"`
	GSTClass      string  `xml:"GSTCLASS"`
}

type rawStockItem struct {
	Name         string `xml:"NAME"`
	Parent       string `xml:"PARENT"`
	BaseUnits    string `xml:"BASEUNITS"`
	OpeningBal   string `xml:"OPENINGBALANCE"`
	ClosingBal   string `xml:"CLOSINGBALANCE"`
}

type rawLedger struct {
	Name string `xml:"NAME"`
}

func flattenVoucher(v rawVoucher) Voucher {
	entries := make([]LedgerEntry, 0, len(v.LedgerEntries))
	for _, le := range v.LedgerEntries {
		entries = append(entries, LedgerEntry{
			LedgerName: le.LedgerName,
			Amount:     le.Amount,
		})
	}

	invEntries := make([]InventoryEntry, 0, len(v.InventoryEntries))
	for _, inv := range v.InventoryEntries {
		invEntries = append(invEntries, InventoryEntry{
			StockItemName: inv.StockItemName,
			Rate:          inv.Rate,
			Amount:        inv.Amount,
			BilledQty:     inv.BilledQty,
			GSTClass:      inv.GSTClass,
		})
	}

	return Voucher{
		VoucherType:         v.VoucherType,
		Date:                v.Date,
		PartyLedgerName:     v.PartyLedgerName,
		GSTRegistrationType: v.GSTRegistrationType,
		StateName:           v.StateName,
		LedgerEntries:       entries,
		InventoryEntries:    invEntries,
	}
}

var qtyRe = regexp.MustCompile(`^([0-9]+\.?[0-9]*)\s*`)

func parseQty(s string) float64 {
	m := qtyRe.FindStringSubmatch(strings.TrimSpace(s))
	if len(m) < 2 {
		return 0
	}
	var q float64
	fmt.Sscanf(m[1], "%f", &q)
	return q
}

func flattenStockItem(s rawStockItem) StockItem {
	return StockItem{
		Name:       s.Name,
		Parent:     s.Parent,
		BaseUnit:   s.BaseUnits,
		OpeningQty: parseQty(s.OpeningBal),
		ClosingQty: parseQty(s.ClosingBal),
	}
}
