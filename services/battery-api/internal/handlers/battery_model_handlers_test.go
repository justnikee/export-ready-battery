package handlers

import (
	"context"
	"encoding/json"
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

func TestBatteryModelRoutesWorkspaceGates(t *testing.T) {
	repo := new(repository.MockRepository)
	h := &Handler{repo: repo}
	tenant, actor, modelID, revisionID := uuid.New(), uuid.New(), uuid.New(), uuid.New()
	role := middleware.RoleViewer
	auth := services.NewAuthService("model-test-secret", time.Hour, time.Hour)
	guard := middleware.NewAuth(auth)
	activeRole := func(_ context.Context, workspace, user uuid.UUID) (string, error) {
		if workspace != tenant || user != actor {
			return "", pgx.ErrNoRows
		}
		return role, nil
	}
	read := func(next http.Handler) http.Handler {
		return guard.ProtectWorkspace(next, activeRole)
	}
	mux := http.NewServeMux()
	h.RegisterBatteryModelRoutes(mux, read, func(next http.Handler) http.Handler {
		return read(middleware.RequireWrite(h.RequireOnboardingComplete(next)))
	})
	token, err := auth.GenerateToken(tenant.String(), actor.String(), "fixture@example.test", middleware.RoleOwner, models.ProductTypeBattery)
	require.NoError(t, err)
	supplierToken, err := auth.GenerateSupplierToken(tenant.String(), uuid.NewString(), "supplier@example.test")
	require.NoError(t, err)
	request := func(method, path, credential, body string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, "/api/v1/battery-models"+path, strings.NewReader(body))
		if credential != "" {
			req.Header.Set("Authorization", "Bearer "+credential)
		}
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		return res
	}
	expectCode := func(res *httptest.ResponseRecorder, status int) {
		t.Helper()
		require.Equal(t, status, res.Code, res.Body.String())
	}

	refreshToken, _, err := auth.GenerateRefreshToken(tenant.String(), actor.String(), "fixture@example.test", middleware.RoleOwner, models.ProductTypeBattery)
	require.NoError(t, err)
	for _, credential := range []string{"", supplierToken, refreshToken} {
		expectCode(request(http.MethodGet, "", credential, ""), http.StatusUnauthorized)
	}
	repo.On("ListBatteryModels", mock.Anything, tenant, 200, 200).Return([]models.BatteryModel{}, 0, nil).Once()
	list := request(http.MethodGet, "?tenant_id="+uuid.NewString()+"&page=2&limit=999", token, "")
	expectCode(list, http.StatusOK)
	require.Equal(t, "private, no-store", list.Header().Get("Cache-Control"))
	expectCode(request(http.MethodPost, "", token, `{"code":"M1","name":"Model One"}`), http.StatusForbidden)

	role = middleware.RoleMember
	repo.On("GetTenant", mock.Anything, tenant).Return(&models.Tenant{OnboardingCompleted: true}, nil)
	expectCode(request(http.MethodPost, "", token, `{"code":"M1","name":"Model One","tenant_id":"other"}`), http.StatusBadRequest)
	repo.On("CreateBatteryModel", mock.Anything, tenant, "M1", "Model One").
		Return(models.BatteryModel{ID: modelID, Code: "M1", Name: "Model One"}, nil).Once()
	expectCode(request(http.MethodPost, "", token, `{"code":" M1 ","name":" Model One "}`), http.StatusCreated)
	modelPath := "/" + modelID.String()
	revisionPath := modelPath + "/revisions/" + revisionID.String()
	repo.On("GetBatteryModel", mock.Anything, tenant, modelID, 50, 0).
		Return(models.BatteryModel{}, nil, 0, pgx.ErrNoRows).Once()
	expectCode(request(http.MethodGet, modelPath, token, ""), http.StatusNotFound)
	expectCode(request(http.MethodPut, revisionPath, token, `{"version":1,"specs":{"voltage":"-9 V","capacity":"30 Ah"}}`), http.StatusBadRequest)
	expectCode(request(http.MethodPut, revisionPath, token, `{"version":1,"specs":{"intended_bom":[{"part_number":"C","name":"Cell","quantity":0}]}}`), http.StatusBadRequest)
	repo.On("UpdateBatteryModelDraft", mock.Anything, tenant, modelID, revisionID, 1, models.ModelRevisionSpecs{
		Chemistry: "LFP", Voltage: "48 V", Capacity: "30 Ah",
	}).Return(models.BatteryModelRevision{}, repository.ErrModelRevisionChanged).Once()
	expectCode(request(http.MethodPut, revisionPath, token, `{"version":1,"specs":{"chemistry":" LFP ","voltage":"48 V","capacity":"30 Ah"}}`), http.StatusConflict)
	repo.On("ReleaseBatteryModelDraft", mock.Anything, tenant, modelID, revisionID, actor, 2).
		Return(models.BatteryModelRevision{}, repository.ErrModelDraftIncomplete).Once()
	res := request(http.MethodPost, revisionPath+"/release", token, `{"version":2}`)
	expectCode(res, http.StatusUnprocessableEntity)
	var message map[string]string
	require.NoError(t, json.Unmarshal(res.Body.Bytes(), &message))
	require.Contains(t, message["error"], "chemistry")
	repo.AssertExpectations(t)
}
