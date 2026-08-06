package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	supplierpkg "github.com/anvayalabs/battery-api/internal/compliance/supplier"
	"github.com/anvayalabs/battery-api/internal/limits"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
)

// ============================================================================
// SUPPLIER PORTAL HANDLERS
// ============================================================================

// supplierCookieName is the HttpOnly session cookie for the supplier portal (S-05).
// Kept separate from manufacturer auth_token / refresh_token.
const supplierCookieName = "supplier_token"

func setSupplierCookie(w http.ResponseWriter, token string, expiry time.Duration) {
	maxAge := int(expiry.Seconds())
	secure := os.Getenv("APP_ENV") == "production"
	sameSite := http.SameSiteStrictMode
	if !secure {
		sameSite = http.SameSiteLaxMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     supplierCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	})
}

func clearSupplierCookie(w http.ResponseWriter) {
	secure := os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     supplierCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
	})
}

// generateInvitationToken creates a secure random token for supplier invites.
func generateInvitationToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// InviteSupplier handles POST /api/v1/suppliers/invitations
// Tenant-only: invite an upstream supplier by email.
func (h *Handler) InviteSupplier(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	var req models.SupplierInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.CompanyName == "" {
		respondError(w, http.StatusBadRequest, "email and company_name are required")
		return
	}

	// Check if supplier already exists for this tenant
	existing, _ := h.repo.GetSupplierByEmail(r.Context(), tenantID, req.Email)
	if existing != nil {
		respondError(w, http.StatusConflict, "supplier already invited")
		return
	}

	supplier := &models.Supplier{
		ID:              uuid.New().String(),
		TenantID:        tenantID.String(),
		Email:           req.Email,
		CompanyName:     req.CompanyName,
		ContactPhone:    req.ContactPhone,
		Address:         req.Address,
		Country:         req.Country,
		Status:          "invited",
		InvitationToken: generateInvitationToken(),
		InvitedAt:       time.Now(),
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := h.repo.CreateSupplier(r.Context(), supplier); err != nil {
		slog.Error("failed to create supplier", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to invite supplier")
		return
	}

	// Auto-compute initial risk profile
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		calc := supplierpkg.NewRiskCalculator(h.repo)
		if _, calcErr := calc.ComputeProfile(ctx, uuid.MustParse(supplier.ID), tenantID); calcErr != nil {
			slog.Error("failed to compute initial risk profile", "error", calcErr, "supplier_id", supplier.ID)
		}
	}()

	// Send invitation email
	if h.emailService != nil {
		tenant, err := h.repo.GetTenant(r.Context(), tenantID)
		if err == nil && tenant != nil {
			tenantName := tenant.CompanyName
			if tenantName == "" {
				tenantName = "Your Buyer"
			}
			if emailErr := h.emailService.SendSupplierInvitationEmail(supplier.Email, tenantName, supplier.CompanyName, supplier.InvitationToken); emailErr != nil {
				slog.Error("failed to send supplier invitation email", "error", emailErr, "supplier_email", supplier.Email)
			}
		}
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":               supplier.ID,
		"email":            supplier.Email,
		"company_name":     supplier.CompanyName,
		"status":           supplier.Status,
		"invitation_token": supplier.InvitationToken,
		"message":          "Supplier invited successfully. Invitation email sent.",
	})
}

// AcceptSupplierInvitation handles POST /api/v1/suppliers/accept
// No auth required: supplier accepts invite and sets password.
func (h *Handler) AcceptSupplierInvitation(w http.ResponseWriter, r *http.Request) {
	var req models.SupplierAcceptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Token == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "token and password are required")
		return
	}

	supplier, err := h.repo.GetSupplierByInvitationToken(r.Context(), req.Token)
	if err != nil {
		respondError(w, http.StatusNotFound, "invalid or expired invitation")
		return
	}
	if supplier.Status != "invited" {
		respondError(w, http.StatusConflict, "invitation already accepted or blocked")
		return
	}

	// S-13: same password policy as manufacturer register/reset.
	if err := services.ValidatePassword(req.Password, supplier.Email); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	hash, err := services.NewAuthService("", 0, 0).HashPassword(req.Password)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to process password")
		return
	}

	id, _ := uuid.Parse(supplier.ID)
	if err := h.repo.UpdateSupplierAcceptance(r.Context(), id, hash); err != nil {
		slog.Error("failed to accept supplier invitation", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to accept invitation")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"status":  "active",
		"message": "Invitation accepted. You can now log in.",
	})
}

// SupplierLogin handles POST /api/v1/supplier/login
// No auth required: supplier logs in with email + password.
// The request must include tenant_id since suppliers are scoped to tenants.
func (h *Handler) SupplierLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		TenantID string `json:"tenant_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Email == "" || req.Password == "" || req.TenantID == "" {
		respondError(w, http.StatusBadRequest, "email, password, and tenant_id are required")
		return
	}

	tenantID, err := uuid.Parse(req.TenantID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid tenant_id")
		return
	}

	supplier, err := h.repo.GetSupplierByEmail(r.Context(), tenantID, req.Email)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if supplier.Status != "active" {
		respondError(w, http.StatusForbidden, "account is not active")
		return
	}

	// Verify password
	if !services.NewAuthService("", 0, 0).CheckPassword(req.Password, supplier.PasswordHash) {
		respondError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	// Update last login
	supplierUUID, _ := uuid.Parse(supplier.ID)
	_ = h.repo.UpdateSupplierLastLogin(r.Context(), supplierUUID)

	// Send invitation accepted alert
	if h.alertService != nil {
		tenantUUID, _ := uuid.Parse(supplier.TenantID)
		_ = h.alertService.CreateSupplierInvitationAlert(r.Context(), tenantUUID, supplier.ID, supplier.CompanyName)
	}

	// Generate supplier JWT
	token, err := h.authService.GenerateSupplierToken(supplier.TenantID, supplier.ID, supplier.Email)
	if err != nil {
		slog.Error("failed to generate supplier token", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	// S-05: HttpOnly cookie for session rehydration (not readable by JS / XSS).
	// Access token is also returned once for in-memory use on the client.
	expiry := h.authService.GetTokenExpiry()
	if expiry <= 0 {
		expiry = 15 * time.Minute
	}
	setSupplierCookie(w, token, expiry)

	respondJSON(w, http.StatusOK, models.SupplierLoginResponse{
		Token:       token,
		SupplierID:  supplier.ID,
		TenantID:    supplier.TenantID,
		Email:       supplier.Email,
		CompanyName: supplier.CompanyName,
		ExpiresIn:   int(expiry.Seconds()),
	})
}

// SupplierLogout handles POST /api/v1/supplier/logout — clears the HttpOnly supplier session cookie.
func (h *Handler) SupplierLogout(w http.ResponseWriter, r *http.Request) {
	clearSupplierCookie(w)
	respondJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// ListSuppliers handles GET /api/v1/suppliers
// Tenant-only: list invited/active suppliers.
func (h *Handler) ListSuppliers(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	status := r.URL.Query().Get("status")
	suppliers, err := h.repo.ListSuppliersByTenant(r.Context(), tenantID, status)
	if err != nil {
		slog.Error("failed to list suppliers", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list suppliers")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"suppliers": suppliers,
		"total":     len(suppliers),
	})
}

// UpdateSupplierStatus handles PUT /api/v1/suppliers/{id}/status
// Tenant-only: approve, block, or re-invite a supplier.
func (h *Handler) UpdateSupplierStatus(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid supplier id")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Status != "active" && req.Status != "blocked" && req.Status != "invited" {
		respondError(w, http.StatusBadRequest, "status must be active, blocked, or invited")
		return
	}

	if err := h.repo.UpdateSupplierStatus(r.Context(), id, req.Status); err != nil {
		slog.Error("failed to update supplier status", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update status")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": req.Status})
}

// UploadSupplierDocument handles POST /api/v1/supplier/documents
// Supplier-only: upload CoC, audit report, or provenance file.
func (h *Handler) UploadSupplierDocument(w http.ResponseWriter, r *http.Request) {
	supplierIDStr := middleware.GetSupplierID(r.Context())
	if supplierIDStr == "" {
		respondError(w, http.StatusUnauthorized, "supplier authentication required")
		return
	}
	tenantIDStr := middleware.GetTenantID(r.Context())

	supplierID, _ := uuid.Parse(supplierIDStr)
	tenantID, _ := uuid.Parse(tenantIDStr)

	if !parseMultipartForm(w, r, limits.MaxSupplierDocBytes) {
		return
	}

	docType := r.FormValue("doc_type")
	if docType == "" {
		docType = "other"
	}
	validTypes := map[string]bool{"coc": true, "audit_report": true, "provenance": true, "msds": true, "test_report": true, "other": true}
	if !validTypes[docType] {
		respondError(w, http.StatusBadRequest, "invalid doc_type")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	if header.Size > limits.MaxSupplierDocBytes {
		respondError(w, http.StatusRequestEntityTooLarge, "File too large. Maximum size is 5MB")
		return
	}

	if h.storageService == nil {
		storageUnavailable(w)
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		slog.Error("Failed to read uploaded file", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to read file")
		return
	}

	// S-11: allow only sniffed PDF/JPEG/PNG/TIFF — not arbitrary octet-stream.
	contentType, ok := services.DetectAllowedDocMIME(fileBytes)
	if !ok {
		respondError(w, http.StatusBadRequest, "Unsupported file type. Allowed: PDF, JPEG, PNG, TIFF")
		return
	}

	filename := fmt.Sprintf("%s_%s_%s", docType, time.Now().Format("20060102_150405"), filepath.Base(header.Filename))
	filename = strings.ReplaceAll(filename, " ", "_")
	storagePath := fmt.Sprintf("%s/supplier-docs/%s/%s", tenantID.String(), supplierID.String(), filename)

	if err := h.storageService.UploadFileToBucket(r.Context(), complianceDocsBucket, storagePath, fileBytes, contentType); err != nil {
		slog.Error("Failed to upload supplier document to storage", "error", err, "supplier_id", supplierIDStr, "tenant_id", tenantIDStr)
		respondError(w, http.StatusInternalServerError, "Failed to upload file to cloud storage")
		return
	}

	publicURL := h.storageService.PublicURL(complianceDocsBucket, storagePath)

	var batchID, componentID *string
	if b := r.FormValue("batch_id"); b != "" {
		batchID = &b
	}
	if c := r.FormValue("component_id"); c != "" {
		componentID = &c
	}

	doc := &models.SupplierDocument{
		ID:          uuid.New().String(),
		SupplierID:  supplierIDStr,
		TenantID:    tenantIDStr,
		BatchID:     batchID,
		ComponentID: componentID,
		DocType:     docType,
		FileURL:     publicURL,
		FileName:    header.Filename,
		FileSize:    int(header.Size),
		Status:      "pending",
		UploadedAt:  time.Now(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := h.repo.CreateSupplierDocument(r.Context(), doc); err != nil {
		_ = h.storageService.DeleteFileFromBucket(r.Context(), complianceDocsBucket, storagePath)
		slog.Error("Failed to create supplier document record", "error", err)
		respondError(w, http.StatusInternalServerError, "Failed to save document record")
		return
	}

	// Send alert to tenant
	if h.alertService != nil {
		supplierUUID, _ := uuid.Parse(supplierIDStr)
		supplier, _ := h.repo.GetSupplierByID(r.Context(), supplierUUID)
		if supplier != nil {
			tenantUUID, _ := uuid.Parse(tenantIDStr)
			_ = h.alertService.CreateSupplierDocumentAlert(r.Context(), tenantUUID, supplier.ID, supplier.CompanyName, doc.DocType)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"id":      doc.ID,
		"status":  doc.Status,
		"message": "Document uploaded successfully and pending review",
	})
}

// ListSupplierBatches handles GET /api/v1/supplier/batches
// Supplier-only: list batches for their tenant (to link documents).
func (h *Handler) ListSupplierBatches(w http.ResponseWriter, r *http.Request) {
	supplierIDStr := middleware.GetSupplierID(r.Context())
	if supplierIDStr == "" {
		respondError(w, http.StatusUnauthorized, "supplier authentication required")
		return
	}

	supplierUUID, _ := uuid.Parse(supplierIDStr)
	supplier, err := h.repo.GetSupplierByID(r.Context(), supplierUUID)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid supplier")
		return
	}

	tenantID, _ := uuid.Parse(supplier.TenantID)
	batches, _, err := h.repo.ListBatches(r.Context(), tenantID, models.ProductTypeBattery, 100, 0)
	if err != nil {
		slog.Error("failed to list supplier batches", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list batches")
		return
	}

	// Return lightweight batch info
	type batchSummary struct {
		ID        string `json:"id"`
		BatchName string `json:"batch_name"`
		ModelName string `json:"model_name"`
		Status    string `json:"status"`
	}

	var results []batchSummary
	for _, b := range batches {
		results = append(results, batchSummary{
			ID:        b.ID.String(),
			BatchName: b.BatchName,
			ModelName: b.ModelName,
			Status:    b.Status,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"batches": results,
		"total":   len(results),
	})
}

// ListSupplierDocuments handles GET /api/v1/supplier/documents
// Supplier-only: list their own uploads.
func (h *Handler) ListSupplierDocuments(w http.ResponseWriter, r *http.Request) {
	supplierIDStr := middleware.GetSupplierID(r.Context())
	if supplierIDStr == "" {
		respondError(w, http.StatusUnauthorized, "supplier authentication required")
		return
	}

	supplierID, _ := uuid.Parse(supplierIDStr)
	status := r.URL.Query().Get("status")

	docs, err := h.repo.ListSupplierDocuments(r.Context(), supplierID, status)
	if err != nil {
		slog.Error("failed to list supplier documents", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list documents")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"documents": docs,
		"total":     len(docs),
	})
}

// ListTenantSupplierDocuments handles GET /api/v1/supplier-documents
// Tenant-only: review all supplier uploads.
func (h *Handler) ListTenantSupplierDocuments(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	status := r.URL.Query().Get("status")
	docs, err := h.repo.ListTenantSupplierDocuments(r.Context(), tenantID, status)
	if err != nil {
		slog.Error("failed to list tenant supplier documents", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to list documents")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"documents": docs,
		"total":     len(docs),
	})
}

// ReviewSupplierDocument handles PUT /api/v1/supplier-documents/{id}/status
// Tenant-only: approve or reject a supplier document.
func (h *Handler) ReviewSupplierDocument(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := middleware.GetTenantID(r.Context())
	_, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "invalid tenant")
		return
	}

	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid document id")
		return
	}

	var req struct {
		Status        string `json:"status"`
		ReviewerNotes string `json:"reviewer_notes,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Status != "approved" && req.Status != "rejected" {
		respondError(w, http.StatusBadRequest, "status must be approved or rejected")
		return
	}

	// Get document before updating to find supplier
	doc, err := h.repo.GetSupplierDocumentByID(r.Context(), id)
	if err != nil {
		slog.Error("failed to get document for review", "error", err)
		respondError(w, http.StatusNotFound, "document not found")
		return
	}

	reviewerID, _ := uuid.Parse(middleware.GetTenantID(r.Context()))
	if err := h.repo.UpdateSupplierDocumentStatus(r.Context(), id, req.Status, req.ReviewerNotes, reviewerID); err != nil {
		slog.Error("failed to review document", "error", err)
		respondError(w, http.StatusInternalServerError, "failed to update document")
		return
	}

	// Notify supplier via email
	if h.emailService != nil && doc != nil {
		supplierUUID, _ := uuid.Parse(doc.SupplierID)
		supplier, err := h.repo.GetSupplierByID(r.Context(), supplierUUID)
		if err == nil && supplier != nil && supplier.Email != "" {
			dashboardURL := fmt.Sprintf("%s/supplier/dashboard", h.emailService.BaseURL())
			if dashboardURL == "" || dashboardURL == "/supplier/dashboard" {
				dashboardURL = fmt.Sprintf("%s/supplier/dashboard", os.Getenv("FRONTEND_URL"))
			}
			_ = h.emailService.SendSupplierDocumentReviewEmail(supplier.Email, services.DocumentReviewData{
				DocType:       doc.DocType,
				Status:        req.Status,
				ReviewerNotes: req.ReviewerNotes,
				DashboardURL:  dashboardURL,
			})
		}
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"status":  req.Status,
		"message": "Document reviewed successfully",
	})
}
