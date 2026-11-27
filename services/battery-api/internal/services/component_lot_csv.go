package services

import (
	"bytes"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"slices"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/google/uuid"
)

const ComponentLotCSVMaxBytes = 1 << 20
const ComponentLotCSVMaxRows = 500

var componentLotColumns = []string{"batch_id", "scope", "serial_number", "source", "part_number", "lot_code"}

func ParseComponentLotCSV(data []byte) ([]models.ComponentLotRow, []models.ComponentLotIssue, error) {
	if !utf8.Valid(data) || bytes.IndexByte(data, 0) >= 0 {
		return nil, nil, errors.New("Use a UTF-8 CSV file without binary data.")
	}
	reader := csv.NewReader(bytes.NewReader(bytes.TrimPrefix(data, []byte{0xef, 0xbb, 0xbf})))
	reader.FieldsPerRecord = len(componentLotColumns)
	header, err := reader.Read()
	if err != nil || !slices.Equal(header, componentLotColumns) {
		return nil, nil, errors.New("Use the template columns in this order: batch_id, scope, serial_number, source, part_number, lot_code.")
	}
	rows := []models.ComponentLotRow{}
	issues := []models.ComponentLotIssue{}
	for records := 0; ; records++ {
		values, err := reader.Read()
		if errors.Is(err, io.EOF) {
			break
		}
		if records >= ComponentLotCSVMaxRows {
			return nil, nil, fmt.Errorf("A file can contain up to %d data rows.", ComponentLotCSVMaxRows)
		}
		if err != nil {
			var parseErr *csv.ParseError
			if errors.As(err, &parseErr) {
				issues = append(issues, models.ComponentLotIssue{Line: parseErr.StartLine, Field: "csv", Message: "Check the quoting and use exactly six columns."})
				if errors.Is(err, csv.ErrFieldCount) {
					continue
				}
				break
			}
			return nil, nil, errors.New("The CSV could not be read.")
		}
		line, _ := reader.FieldPos(0)
		for i, value := range values {
			values[i] = strings.TrimSpace(value)
		}
		row, problems := validateComponentLotRow(line, values)
		issues = append(issues, problems...)
		if len(problems) == 0 {
			rows = append(rows, row)
		}
	}
	if len(rows) == 0 && len(issues) == 0 {
		return nil, nil, errors.New("Add at least one data row to the CSV.")
	}
	return rows, issues, nil
}

func validateComponentLotRow(line int, values []string) (models.ComponentLotRow, []models.ComponentLotIssue) {
	batchID, err := uuid.Parse(values[0])
	row := models.ComponentLotRow{Line: line, BatchID: batchID, Scope: values[1], SerialNumber: values[2], Source: values[3], PartNumber: values[4], LotCode: values[5]}
	var issues []models.ComponentLotIssue
	add := func(field, message string) {
		issues = append(issues, models.ComponentLotIssue{Line: line, Field: field, Message: message})
	}
	if err != nil || batchID == uuid.Nil || len(values[0]) != 36 {
		add("batch_id", "Enter the batch UUID. A serial by itself cannot identify a pack across batches.")
	}
	switch row.Scope {
	case models.LotScopePack:
		if row.SerialNumber == "" {
			add("serial_number", "Pack scope requires the serial from the specified batch.")
		}
	case models.LotScopeBatchAll, models.LotScopeBatchUnknown:
		if row.SerialNumber != "" {
			add("serial_number", "Leave the serial empty for batch scope, or use pack scope.")
		}
	default:
		add("scope", "Choose pack, batch_all, or batch_unknown. Allocation cannot be inferred.")
	}
	for i, maxLength := range []int{100, 120, 100, 120} {
		field, value := componentLotColumns[i+2], values[i+2]
		if (i > 0 && value == "") || utf8.RuneCountInString(value) > maxLength || strings.ContainsFunc(value, unicode.IsControl) {
			add(field, fmt.Sprintf("Use a valid identifier of up to %d characters.", maxLength))
		}
	}
	return row, issues
}
