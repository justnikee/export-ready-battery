package tally

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// sampleTallyXML is a realistic Tally Prime export snippet containing
// purchase vouchers and stock items relevant to a battery assembler.
const sampleTallyXML = `<ENVELOPE>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER VCHTYPE="Purchase" ACTION="Create">
          <DATE>20260115</DATE>
          <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
          <PARTYLEDGERNAME>Amara Raja Cells Ltd</PARTYLEDGERNAME>
          <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
          <STATENAME>Tamil Nadu</STATENAME>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>CGST</LEDGERNAME>
            <AMOUNT>1350.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>SGST</LEDGERNAME>
            <AMOUNT>1350.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>LFP Cell 3.2V 100Ah</STOCKITEMNAME>
            <RATE>1500.00/pcs</RATE>
            <AMOUNT>150000.00</AMOUNT>
            <BILLEDQTY>100 pcs</BILLEDQTY>
            <GSTCLASS>8507</GSTCLASS>
          </ALLINVENTORYENTRIES.LIST>
        </VOUCHER>
        <STOCKITEM>
          <NAME>LFP Cell 3.2V 100Ah</NAME>
          <PARENT>Battery Cells</PARENT>
          <OPENINGBALANCE>50 pcs</OPENINGBALANCE>
          <CLOSINGBALANCE>150 pcs</CLOSINGBALANCE>
          <BASEUNITS>pcs</BASEUNITS>
        </STOCKITEM>
        <STOCKITEM>
          <NAME>NMC Cell 3.7V 50Ah</NAME>
          <PARENT>Battery Cells</PARENT>
          <OPENINGBALANCE>20 pcs</OPENINGBALANCE>
          <CLOSINGBALANCE>80 pcs</CLOSINGBALANCE>
          <BASEUNITS>pcs</BASEUNITS>
        </STOCKITEM>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`

func TestParseTallyXML_Success(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTallyXML))
	require.NoError(t, err)
	require.NotNil(t, doc)

	assert.Len(t, doc.Vouchers, 1)
	assert.Len(t, doc.StockItems, 2)
}

func TestParseTallyXML_StockItems(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTallyXML))
	require.NoError(t, err)

	items := doc.StockItems
	assert.Len(t, items, 2)

	assert.Equal(t, "LFP Cell 3.2V 100Ah", items[0].Name)
	assert.Equal(t, "Battery Cells", items[0].Parent)
	assert.Equal(t, "pcs", items[0].BaseUnit)
	assert.Equal(t, 50.0, items[0].OpeningQty)
	assert.Equal(t, 150.0, items[0].ClosingQty)

	assert.Equal(t, "NMC Cell 3.7V 50Ah", items[1].Name)
	assert.Equal(t, 20.0, items[1].OpeningQty)
	assert.Equal(t, 80.0, items[1].ClosingQty)
}

func TestParseTallyXML_Vouchers(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTallyXML))
	require.NoError(t, err)

	v := doc.Vouchers[0]
	assert.Equal(t, "Purchase", v.VoucherType)
	assert.Equal(t, "20260115", v.Date)
	assert.Equal(t, "Amara Raja Cells Ltd", v.PartyLedgerName)
	assert.Equal(t, "Regular", v.GSTRegistrationType)
	assert.Equal(t, "Tamil Nadu", v.StateName)

	assert.Len(t, v.LedgerEntries, 2)
	assert.Equal(t, "CGST", v.LedgerEntries[0].LedgerName)
	assert.Equal(t, 1350.00, v.LedgerEntries[0].Amount)
	assert.Equal(t, "SGST", v.LedgerEntries[1].LedgerName)
	assert.Equal(t, 1350.00, v.LedgerEntries[1].Amount)

	assert.Len(t, v.InventoryEntries, 1)
	inv := v.InventoryEntries[0]
	assert.Equal(t, "LFP Cell 3.2V 100Ah", inv.StockItemName)
	assert.Equal(t, "1500.00/pcs", inv.Rate)
	assert.Equal(t, 150000.00, inv.Amount)
	assert.Equal(t, "100 pcs", inv.BilledQty)
	assert.Equal(t, "8507", inv.GSTClass)
}

func TestMapToBatteryBatch(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTallyXML))
	require.NoError(t, err)

	batch := MapToBatteryBatchDraft(doc)
	require.NotNil(t, batch)

	// Batch name derived from date + first stock item
	assert.Contains(t, batch.BatchName, "Tally")

	// Material composition derived from stock items
	assert.Len(t, batch.MaterialComposition, 2)
	assert.Equal(t, "LFP Cell 3.2V 100Ah", batch.MaterialComposition[0].Name)
	assert.Equal(t, "Battery Cells", batch.MaterialComposition[0].Category)

	// Supplier derived from purchase voucher
	assert.Equal(t, "Amara Raja Cells Ltd", batch.SupplierName)
	assert.Equal(t, "Tamil Nadu", batch.SupplierState)

	// GST extracted from ledger entries
	assert.Equal(t, 2700.00, batch.TotalGST)
	assert.Equal(t, "8507", batch.HSNCode)
}

func TestParseTallyXML_Empty(t *testing.T) {
	_, err := ParseTallyXML(strings.NewReader(""))
	assert.Error(t, err)
}

func TestParseTallyXML_Malformed(t *testing.T) {
	_, err := ParseTallyXML(strings.NewReader("<not-xml>"))
	assert.Error(t, err)
}

func TestDetectChemistryFromStockName(t *testing.T) {
	tests := []struct {
		name      string
		expected  string
	}{
		{"LFP Cell 3.2V", "LFP"},
		{"NMC 811 Cathode Powder", "NMC"},
		{"NCA Cell 3.6V", "NCA"},
		{"LiFePO4 Prismatic Cell", "LFP"},
		{"Lead Acid Battery 12V", "Lead Acid"},
		{"Graphite Anode Material", ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, DetectChemistryFromStockName(tc.name))
		})
	}
}
