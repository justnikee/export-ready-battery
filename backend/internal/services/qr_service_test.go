package services

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestBuildQRPayload_LegacySerial(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("11111111-1111-1111-1111-111111111111")

	url := svc.BuildQRPayload(id, "LEGACY-SERIAL-123", nil)

	expected := "https://app.anvayalabs.in/p/11111111-1111-1111-1111-111111111111"
	if url != expected {
		t.Errorf("legacy serial should produce plain URL\ngot:  %s\nwant: %s", url, expected)
	}
}

func TestBuildQRPayload_BPANv2India(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	serial := "IN-TEN-LFP-2026-00042"

	url := svc.BuildQRPayload(id, serial, nil)

	// Must contain base URL
	if !strings.Contains(url, "22222222-2222-2222-2222-222222222222") {
		t.Error("URL must contain passport UUID")
	}

	// Must contain decoded BPAN params
	for _, param := range []string{"bpan=IN-TEN-LFP-2026-00042", "chem=LFP", "yr=2026", "mfr=TEN", "rgn=IN"} {
		if !strings.Contains(url, param) {
			t.Errorf("URL missing expected param %q\ngot: %s", param, url)
		}
	}

	// Must NOT contain co2 param (no carbon context)
	if strings.Contains(url, "co2=") {
		t.Error("URL should not contain co2 param when no carbon context provided")
	}
}

func TestBuildQRPayload_EUWithCarbon(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	serial := "EU-BAT-NMC-2026-00001"
	ctx := &QRLabelContext{CarbonPerKWh: 65.42}

	url := svc.BuildQRPayload(id, serial, ctx)

	for _, param := range []string{"rgn=EU", "chem=NMC", "co2=65.42"} {
		if !strings.Contains(url, param) {
			t.Errorf("EU URL missing expected param %q\ngot: %s", param, url)
		}
	}
}

func TestBuildQRPayload_GlobalNoCarbon(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("44444444-4444-4444-4444-444444444444")
	serial := "GL-SOL-LFP-2026-00007"

	url := svc.BuildQRPayload(id, serial, nil)

	if !strings.Contains(url, "rgn=GL") {
		t.Errorf("Global serial should have rgn=GL\ngot: %s", url)
	}
	if strings.Contains(url, "co2=") {
		t.Error("URL should not contain co2 param when no carbon context")
	}
}

func TestBuildQRPayload_TextileUsesFiberParam(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("77777777-7777-7777-7777-777777777777")
	serial := "IN-TEN-CTN-2026-00001"
	ctx := &QRLabelContext{ProductType: "TEXTILE"}

	url := svc.BuildQRPayload(id, serial, ctx)

	// Must use "fiber" param for textiles
	if !strings.Contains(url, "fiber=CTN") {
		t.Errorf("textile QR must contain fiber param, got: %s", url)
	}
	// Must NOT use "chem" param for textiles
	if strings.Contains(url, "chem=") {
		t.Errorf("textile QR should not contain chem param, got: %s", url)
	}
	// Must still have other BPAN params
	for _, param := range []string{"bpan=IN-TEN-CTN-2026-00001", "yr=2026", "mfr=TEN", "rgn=IN"} {
		if !strings.Contains(url, param) {
			t.Errorf("textile URL missing expected param %q\ngot: %s", param, url)
		}
	}
}

func TestExtractCarbonPerKWh_Valid(t *testing.T) {
	result := json.RawMessage(`{"total_kg_co2e": 500.0, "per_kwh_kg_co2e": 65.5}`)
	got := ExtractCarbonPerKWh(result)
	if got != 65.5 {
		t.Errorf("expected 65.5, got %f", got)
	}
}

func TestExtractCarbonPerKWh_Nil(t *testing.T) {
	got := ExtractCarbonPerKWh(nil)
	if got != 0 {
		t.Errorf("expected 0 for nil, got %f", got)
	}
}

func TestExtractCarbonPerKWh_InvalidJSON(t *testing.T) {
	result := json.RawMessage(`{bad json}`)
	got := ExtractCarbonPerKWh(result)
	if got != 0 {
		t.Errorf("expected 0 for invalid JSON, got %f", got)
	}
}

func TestGenerateQRCode_EnrichedProducesPNG(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("55555555-5555-5555-5555-555555555555")

	result, err := svc.GenerateQRCodeEnriched(id, "IN-TEN-LFP-2026-00001", &QRLabelContext{CarbonPerKWh: 42.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.PNGData) == 0 {
		t.Error("expected non-empty PNG data")
	}
	if result.Serial != "IN-TEN-LFP-2026-00001" {
		t.Error("serial mismatch")
	}
}

func TestGenerateQRCode_BackwardCompatible(t *testing.T) {
	svc := NewQRService("https://app.anvayalabs.in")
	id := uuid.MustParse("66666666-6666-6666-6666-666666666666")

	result, err := svc.GenerateQRCode(id, "LEGACY-001")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.PNGData) == 0 {
		t.Error("expected non-empty PNG data")
	}
}
