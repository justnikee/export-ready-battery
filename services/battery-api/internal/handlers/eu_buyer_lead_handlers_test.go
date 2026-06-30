package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateEUBuyerLead_Success(t *testing.T) {
	repo := newFakeTeamRepo()
	h := newTeamHandler(repo)

	body, _ := json.Marshal(EUBuyerLeadRequest{
		BuyerCompanyName: "Berlin Mobility GmbH",
		ContactName:      "Anna Schmidt",
		ContactEmail:     "anna@berlinmobility.de",
		Country:          "Germany",
		IndianSuppliers:  "Tata AutoComp, Exide",
		Message:          "We require digital battery passports from all suppliers by Q1.",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leads/eu-buyer", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.CreateEUBuyerLead(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestCreateEUBuyerLead_RejectsMissingRequiredFields(t *testing.T) {
	tests := []struct {
		name string
		req  EUBuyerLeadRequest
	}{
		{"missing company name", EUBuyerLeadRequest{ContactName: "A", ContactEmail: "a@b.com", Country: "Germany"}},
		{"missing contact name", EUBuyerLeadRequest{BuyerCompanyName: "Co", ContactEmail: "a@b.com", Country: "Germany"}},
		{"missing email", EUBuyerLeadRequest{BuyerCompanyName: "Co", ContactName: "A", Country: "Germany"}},
		{"invalid email", EUBuyerLeadRequest{BuyerCompanyName: "Co", ContactName: "A", ContactEmail: "not-an-email", Country: "Germany"}},
		{"missing country", EUBuyerLeadRequest{BuyerCompanyName: "Co", ContactName: "A", ContactEmail: "a@b.com"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newFakeTeamRepo()
			h := newTeamHandler(repo)

			body, _ := json.Marshal(tt.req)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/leads/eu-buyer", bytes.NewReader(body))
			rr := httptest.NewRecorder()

			h.CreateEUBuyerLead(rr, req)

			if rr.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d: %s", rr.Code, rr.Body.String())
			}
		})
	}
}

func TestCreateEUBuyerLead_PersistsViaRepo(t *testing.T) {
	repo := newFakeTeamRepo()
	h := newTeamHandler(repo)

	body, _ := json.Marshal(EUBuyerLeadRequest{
		BuyerCompanyName: "Berlin Mobility GmbH",
		ContactName:      "Anna Schmidt",
		ContactEmail:     "ANNA@BerlinMobility.de",
		Country:          "Germany",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/leads/eu-buyer", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.CreateEUBuyerLead(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	if len(repo.euBuyerLeads) != 1 {
		t.Fatalf("expected CreateEUBuyerLead to be called on the repo, got %d leads", len(repo.euBuyerLeads))
	}
	captured := repo.euBuyerLeads[0]
	if captured.ContactEmail != "anna@berlinmobility.de" {
		t.Errorf("expected email to be lowercased, got %q", captured.ContactEmail)
	}
	if captured.Status != "new" {
		t.Errorf("expected status 'new', got %q", captured.Status)
	}
}
