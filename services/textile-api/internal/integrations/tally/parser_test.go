package tally

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const sampleTextileTallyXML = `<ENVELOPE>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER VCHTYPE="Purchase" ACTION="Create">
          <DATE>20260115</DATE>
          <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
          <PARTYLEDGERNAME>Arvind Mills Ltd</PARTYLEDGERNAME>
          <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
          <STATENAME>Gujarat</STATENAME>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>CGST</LEDGERNAME>
            <AMOUNT>5400.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>SGST</LEDGERNAME>
            <AMOUNT>5400.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>Organic Cotton Yarn 40s</STOCKITEMNAME>
            <RATE>450.00/kg</RATE>
            <AMOUNT>225000.00</AMOUNT>
            <BILLEDQTY>500 kg</BILLEDQTY>
            <GSTCLASS>5205</GSTCLASS>
          </ALLINVENTORYENTRIES.LIST>
        </VOUCHER>
        <STOCKITEM>
          <NAME>Organic Cotton Yarn 40s</NAME>
          <PARENT>Yarn</PARENT>
          <OPENINGBALANCE>200 kg</OPENINGBALANCE>
          <CLOSINGBALANCE>700 kg</CLOSINGBALANCE>
          <BASEUNITS>kg</BASEUNITS>
        </STOCKITEM>
        <STOCKITEM>
          <NAME>Reactive Dye Red 195</NAME>
          <PARENT>Dyes &amp; Chemicals</PARENT>
          <OPENINGBALANCE>50 kg</OPENINGBALANCE>
          <CLOSINGBALANCE>120 kg</CLOSINGBALANCE>
          <BASEUNITS>kg</BASEUNITS>
        </STOCKITEM>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`

func TestParseTallyXML_TextileSuccess(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTextileTallyXML))
	require.NoError(t, err)
	require.NotNil(t, doc)

	assert.Len(t, doc.Vouchers, 1)
	assert.Len(t, doc.StockItems, 2)
}

func TestParseTallyXML_TextileStockItems(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTextileTallyXML))
	require.NoError(t, err)

	items := doc.StockItems
	assert.Len(t, items, 2)

	assert.Equal(t, "Organic Cotton Yarn 40s", items[0].Name)
	assert.Equal(t, "Yarn", items[0].Parent)
	assert.Equal(t, "kg", items[0].BaseUnit)
	assert.Equal(t, 200.0, items[0].OpeningQty)
	assert.Equal(t, 700.0, items[0].ClosingQty)

	assert.Equal(t, "Reactive Dye Red 195", items[1].Name)
	assert.Equal(t, "Dyes & Chemicals", items[1].Parent)
}

func TestMapToTextileBatchDraft(t *testing.T) {
	doc, err := ParseTallyXML(strings.NewReader(sampleTextileTallyXML))
	require.NoError(t, err)

	batch := MapToTextileBatchDraft(doc)
	require.NotNil(t, batch)

	assert.Contains(t, batch.BatchName, "Tally")
	assert.Len(t, batch.FiberComposition, 2)

	// Cotton yarn should be detected as natural fiber
	assert.Equal(t, "Organic Cotton Yarn 40s", batch.FiberComposition[0].Name)
	assert.Equal(t, "natural", batch.FiberComposition[0].FiberType)

	// Dye should be detected as chemical
	assert.Equal(t, "chemical", batch.FiberComposition[1].FiberType)

	// Supplier from purchase voucher
	assert.Equal(t, "Arvind Mills Ltd", batch.SupplierName)
	assert.Equal(t, "Gujarat", batch.SupplierState)

	// GST
	assert.Equal(t, 10800.00, batch.TotalGST)
	assert.Equal(t, "5205", batch.HSNCode)
}

func TestDetectFiberType(t *testing.T) {
	tests := []struct {
		name     string
		expected string
	}{
		{"Organic Cotton Yarn 40s", "natural"},
		{"Polyester FDY 150D", "synthetic"},
		{"Reactive Dye Red 195", "chemical"},
		{"Viscose Rayon Filament", "semi-synthetic"},
		{"Wool Tops 64s", "natural"},
		{"Acrylic Yarn 2/32", "synthetic"},
		{"Sodium Hydroxide Pellets", "chemical"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.expected, DetectFiberType(tc.name))
		})
	}
}
