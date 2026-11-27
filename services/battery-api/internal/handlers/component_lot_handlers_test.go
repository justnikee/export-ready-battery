package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestComponentLotImportRoutes(t *testing.T) {
	repo := new(repository.MockRepository)
	h := &Handler{repo: repo}
	tenant, actor, batch := uuid.New(), uuid.New(), uuid.New()
	auth := services.NewAuthService("component-lot-test-secret", time.Hour, time.Hour)
	guard := middleware.NewAuth(auth)
	mux := http.NewServeMux()
	activeRole := middleware.RoleViewer
	isActive := true
	h.RegisterComponentLotImportRoutes(mux, func(next http.Handler) http.Handler {
		return guard.ProtectWorkspace(middleware.RequireWrite(h.RequireOnboardingComplete(next)), func(_ context.Context, workspace, user uuid.UUID) (string, error) {
			if !isActive || workspace != tenant || user != actor {
				return "", pgx.ErrNoRows
			}
			return activeRole, nil
		})
	})
	credential := func(role string) string {
		t.Helper()
		token, err := auth.GenerateToken(tenant.String(), actor.String(), "fixture@example.test", role, models.ProductTypeBattery)
		require.NoError(t, err)
		return token
	}
	owner := credential(middleware.RoleOwner)
	supplier, err := auth.GenerateSupplierToken(tenant.String(), uuid.NewString(), "supplier@example.test")
	require.NoError(t, err)
	request := func(endpoint, auth, csv, token string, status int) *httptest.ResponseRecorder {
		t.Helper()
		var body bytes.Buffer
		form := multipart.NewWriter(&body)
		part, err := form.CreateFormFile("file", "assembly.csv")
		require.NoError(t, err)
		_, err = part.Write([]byte(csv))
		require.NoError(t, err)
		require.NoError(t, form.WriteField("validation_token", token))
		require.NoError(t, form.WriteField("tenant_id", uuid.NewString()))
		require.NoError(t, form.Close())
		req := httptest.NewRequest(http.MethodPost, "/api/v1/component-lot-imports"+endpoint, &body)
		req.Header.Set("Content-Type", form.FormDataContentType())
		if auth != "" {
			req.Header.Set("Authorization", "Bearer "+auth)
		}
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		require.Equal(t, status, res.Code, res.Body.String())
		return res
	}
	const columns = "batch_id,scope,serial_number,source,part_number,lot_code\n"
	valid := columns + fmt.Sprintf("%s,pack,PACK-001,SOURCE,CELL,0007\n", batch)
	request("/validate", "", valid, "", http.StatusUnauthorized)
	request("/validate", supplier, valid, "", http.StatusUnauthorized)
	request("/validate", owner, valid, "", http.StatusForbidden)
	request("", owner, valid, strings.Repeat("0", 64), http.StatusForbidden)
	isActive = false
	request("/validate", owner, valid, "", http.StatusUnauthorized)
	isActive = true
	activeRole = middleware.RoleOwner
	repo.On("GetTenant", mock.Anything, tenant).Return(&models.Tenant{OnboardingCompleted: true}, nil)
	request("", owner, valid, "", http.StatusBadRequest)
	request("/validate", owner, "fake\x00csv", "", http.StatusBadRequest)
	request("/validate", owner, strings.Repeat("A", services.ComponentLotCSVMaxBytes+1), "", http.StatusRequestEntityTooLarge)

	input := models.ComponentLotImportInput{FileName: "assembly.csv", FileSHA256: fmt.Sprintf("%x", sha256.Sum256([]byte(valid))), Rows: []models.ComponentLotRow{
		{Line: 2, BatchID: batch, Scope: models.LotScopePack, SerialNumber: "PACK-001", Source: "SOURCE", PartNumber: "CELL", LotCode: "0007"},
	}, Issues: []models.ComponentLotIssue{}}
	preview := models.ComponentLotImportResult{NewRows: 1, Token: strings.Repeat("a", 64)}
	repo.On("ProcessComponentLotImport", mock.Anything, tenant, actor, input).Return(preview, nil).Once()
	res := request("/validate", owner, valid, "", http.StatusOK)
	require.Equal(t, "private, no-store", res.Header().Get("Cache-Control"))
	require.Contains(t, res.Body.String(), preview.Token)

	input.ExpectedToken = preview.Token
	repo.On("ProcessComponentLotImport", mock.Anything, tenant, actor, input).Return(models.ComponentLotImportResult{}, repository.ErrLotImportChanged).Once()
	request("", owner, valid, preview.Token, http.StatusConflict)

	invalid := columns + ",pack,PACK-001,SOURCE,CELL,0007\n"
	issue := models.ComponentLotIssue{Line: 2, Field: "batch_id", Message: "Enter the batch UUID. A serial by itself cannot identify a pack across batches."}
	input = models.ComponentLotImportInput{FileName: "assembly.csv", FileSHA256: fmt.Sprintf("%x", sha256.Sum256([]byte(invalid))), Rows: []models.ComponentLotRow{}, Issues: []models.ComponentLotIssue{issue}, ExpectedToken: preview.Token}
	repo.On("ProcessComponentLotImport", mock.Anything, tenant, actor, input).Return(models.ComponentLotImportResult{Issues: input.Issues}, nil).Once()
	res = request("", owner, invalid, preview.Token, http.StatusUnprocessableEntity)
	require.Contains(t, res.Body.String(), issue.Message)
	repo.AssertExpectations(t)
}
