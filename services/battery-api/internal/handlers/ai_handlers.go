package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/services"

	"github.com/google/uuid"
	"github.com/ledongthuc/pdf"
)

// AIHandler handles AI-powered parsing and generation endpoints
type AIHandler struct {
	service *services.AIService
}

// NewAIHandler creates a new AI handler
func NewAIHandler(service *services.AIService) *AIHandler {
	return &AIHandler{service: service}
}

// ParseDatasheetRequest is the request body for /ai/parse-datasheet
type ParseDatasheetRequest struct {
	Text string `json:"text"` // Extracted PDF text (client-side or server-side)
}

// ParseDatasheetResponse is the response from /ai/parse-datasheet
type ParseDatasheetResponse struct {
	Data       *services.DatasheetParseResult `json:"data"`
	Confidence float64                        `json:"confidence"`
	Method     string                         `json:"method"`
}

// NLCreateBatchRequest is the request body for /ai/nl-create-batch
type NLCreateBatchRequest struct {
	Text         string `json:"text"`
	MarketRegion string `json:"market_region,omitempty"` // Default if not specified in text
}

// maxDatasheetTextLen caps the extracted PDF text accepted by ParseDatasheet.
// Generous for real datasheets, well under the 10MB request body cap.
const maxDatasheetTextLen = 200_000

// ParseDatasheet handles POST /api/v1/ai/parse-datasheet
// @Summary Extract battery specs from datasheet text using AI
// @Description Uses regex patterns first, then falls back to Groq LLM if confidence is low
// @Tags ai
func (h *AIHandler) ParseDatasheet(w http.ResponseWriter, r *http.Request) {
	// Verify auth context
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized - tenant context required")
		return
	}
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	var req ParseDatasheetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		respondError(w, http.StatusBadRequest, "text is required")
		return
	}

	if len(req.Text) > maxDatasheetTextLen {
		respondError(w, http.StatusBadRequest, "text exceeds maximum length")
		return
	}

	result, err := h.service.ParseDatasheet(r.Context(), req.Text)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Parsing failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, ParseDatasheetResponse{
		Data:       result,
		Confidence: result.Confidence,
		Method:     result.Method,
	})
}

// NLCreateBatch handles POST /api/v1/ai/nl-create-batch
// @Summary Create a batch draft from natural language
// @Description Uses LLM to parse user intent into structured batch fields
// @Tags ai
func (h *AIHandler) NLCreateBatch(w http.ResponseWriter, r *http.Request) {
	// Verify auth context
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized - tenant context required")
		return
	}
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	var req NLCreateBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.Text) == "" {
		respondError(w, http.StatusBadRequest, "text is required")
		return
	}

	// Check if AI service is configured
	if h.service == nil {
		respondError(w, http.StatusServiceUnavailable, "AI service not configured - set GROQ_API_KEY")
		return
	}

	result, err := h.service.CreateBatchFromNL(r.Context(), req.Text, req.MarketRegion)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "NL processing failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// ParseDatasheetFromUpload handles POST /api/v1/ai/parse-datasheet-upload
// @Summary Upload a PDF and extract battery specs
// @Description Accepts PDF upload, extracts text server-side, then parses specs
// @Tags ai
func (h *AIHandler) ParseDatasheetFromUpload(w http.ResponseWriter, r *http.Request) {
	// Verify auth context
	tenantIDStr := middleware.GetTenantID(r.Context())
	if tenantIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized - tenant context required")
		return
	}
	if _, err := uuid.Parse(tenantIDStr); err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid tenant context")
		return
	}

	// Parse multipart form (max 10MB)
	if !parseMultipartForm(w, r, limits.MaxAIDatasheetBytes) {
		return
	}

	file, _, err := r.FormFile("pdf")
	if err != nil {
		respondError(w, http.StatusBadRequest, "PDF file required")
		return
	}
	defer file.Close()

	// Read file content
	content, err := io.ReadAll(io.LimitReader(file, 10<<20))
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// S-11: magic-byte check — filename suffix alone is insufficient.
	if err := services.RequirePDF(content); err != nil {
		respondError(w, http.StatusBadRequest, "Only valid PDF files are accepted (file content must start with %PDF-)")
		return
	}

	// Extract text from PDF
	text, err := extractTextFromPDF(content)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to extract text from PDF: "+err.Error())
		return
	}

	if strings.TrimSpace(text) == "" {
		respondError(w, http.StatusBadRequest, "No text found in PDF - it may be scanned/image-based")
		return
	}

	// Parse extracted text
	result, err := h.service.ParseDatasheet(r.Context(), text)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Parsing failed: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, ParseDatasheetResponse{
		Data:       result,
		Confidence: result.Confidence,
		Method:     result.Method,
	})
}

// extractTextFromPDF extracts text from PDF bytes using ledongthuc/pdf
func extractTextFromPDF(data []byte) (string, error) {
	reader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to open PDF: %w", err)
	}

	plainTextReader, err := reader.GetPlainText()
	if err != nil {
		return "", fmt.Errorf("failed to extract plain text: %w", err)
	}

	text, err := io.ReadAll(plainTextReader)
	if err != nil {
		return "", fmt.Errorf("failed to read extracted text: %w", err)
	}

	return string(text), nil
}
