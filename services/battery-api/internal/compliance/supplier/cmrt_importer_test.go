package supplier

import (
	"bytes"
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xuri/excelize/v2"
)

func itoa(i int) string {
	return strconv.Itoa(i)
}

func buildTestCMRT(t *testing.T, rows [][]string) *bytes.Buffer {
	f := excelize.NewFile()
	defer f.Close()

	sheet := "Smelter List"
	_, err := f.NewSheet(sheet)
	require.NoError(t, err)

	for i, row := range rows {
		for j, cell := range row {
			col, _ := excelize.ColumnNumberToName(j + 1)
			cellRef := col + itoa(i+1)
			require.NoError(t, f.SetCellValue(sheet, cellRef, cell))
		}
	}

	var buf bytes.Buffer
	require.NoError(t, f.Write(&buf))
	return &buf
}

func TestCMRTImporter_Parse_Success(t *testing.T) {
	rows := [][]string{
		{"Smelter Name", "Country", "Mineral", "Smelter Ref"},
		{"China Tin Group Co., Ltd.", "CN", "Tin", "CID001070"},
		{"Unknown Smelter XYZ", "XX", "Gold", "REF999"},
	}
	buf := buildTestCMRT(t, rows)

	importer := NewCMRTImporter()
	result, err := importer.Parse(buf, 2025)
	require.NoError(t, err)

	assert.Equal(t, 2025, result.ReportingYear)
	assert.Len(t, result.Smelters, 2)
	assert.Equal(t, 1, result.UnknownSmelters)
	assert.Equal(t, 50, result.RMIConformantPct) // 1 conformant out of 2 = 50%

	// First smelter is known RMI conformant
	assert.Equal(t, "China Tin Group Co., Ltd.", result.Smelters[0].Name)
	assert.Equal(t, "conformant", result.Smelters[0].RMIStatus)

	// Second smelter is unknown
	assert.Equal(t, "Unknown Smelter XYZ", result.Smelters[1].Name)
	assert.Equal(t, "unknown", result.Smelters[1].RMIStatus)
}

func TestCMRTImporter_Parse_MissingSheet(t *testing.T) {
	f := excelize.NewFile()
	defer f.Close()
	// No "Smelter List" sheet — only default Sheet1 which is empty
	var buf bytes.Buffer
	require.NoError(t, f.Write(&buf))

	importer := NewCMRTImporter()
	_, err := importer.Parse(&buf, 2025)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no data rows")
}

func TestCMRTImporter_Parse_EmptyFile(t *testing.T) {
	rows := [][]string{
		{"Smelter Name", "Country"},
	}
	buf := buildTestCMRT(t, rows)

	importer := NewCMRTImporter()
	_, err := importer.Parse(buf, 2025)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no data rows")
}

func TestCMRTImporter_Parse_InvalidExcel(t *testing.T) {
	importer := NewCMRTImporter()
	_, err := importer.Parse(bytes.NewReader([]byte("not an excel file")), 2025)
	require.Error(t, err)
}
