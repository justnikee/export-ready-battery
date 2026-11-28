package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/anvayalabs/battery-api/internal/testutil"
	"github.com/google/uuid"
)

func TestSupplierUploadAuthorizationPostgres(t *testing.T) {
	pool := testutil.OpenPostgres(t)
	ctx := context.Background()
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, query, args...); err != nil {
			t.Fatal(err)
		}
	}
	exec(`CREATE TABLE tenants (id uuid PRIMARY KEY);
		CREATE TABLE batches (id uuid PRIMARY KEY);
		CREATE TABLE components (id uuid PRIMARY KEY);`)
	for _, migration := range []string{"000082_create_suppliers.up.sql", "000083_create_supplier_documents.up.sql"} {
		sql, err := os.ReadFile(filepath.Join("..", "db", "migrations", migration))
		if err != nil {
			t.Fatal(err)
		}
		exec(string(sql))
	}

	tenant, otherTenant, supplier := uuid.New(), uuid.New(), uuid.New()
	batchID, componentID := uuid.NewString(), uuid.NewString()
	exec(`INSERT INTO tenants(id) VALUES ($1), ($2)`, tenant, otherTenant)
	exec(`INSERT INTO suppliers(id,tenant_id,email,company_name,status)
		VALUES ($1,$2,'supplier@example.test','Fixture supplier','active')`, supplier, tenant)
	exec(`INSERT INTO batches(id) VALUES ($1)`, batchID)
	exec(`INSERT INTO components(id) VALUES ($1)`, componentID)

	var uploads, deletions atomic.Int32
	var revokeDuringUpload, publicBucket atomic.Bool
	storage := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			_ = json.NewEncoder(w).Encode(map[string]bool{"public": publicBucket.Load()})
		case http.MethodPost:
			uploads.Add(1)
			if revokeDuringUpload.Load() {
				if _, err := pool.Exec(r.Context(), `UPDATE suppliers SET status='blocked' WHERE id=$1`, supplier); err != nil {
					t.Error(err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
			}
			w.WriteHeader(http.StatusCreated)
		case http.MethodDelete:
			deletions.Add(1)
			w.WriteHeader(http.StatusOK)
		default:
			t.Errorf("unexpected storage request method %s", r.Method)
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}))
	defer storage.Close()
	t.Setenv("SUPABASE_URL", storage.URL)
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "fixture-only")

	repo := repository.New(&db.DB{Pool: pool})
	h := &Handler{repo: repo, storageService: services.NewStorageService(slog.Default())}
	auth := services.NewAuthService("supplier-upload-fixture", time.Hour, time.Hour)
	guard := middleware.NewAuth(auth)
	mux := http.NewServeMux()
	mux.Handle("POST /api/v1/supplier/documents", guard.ProtectSupplier(http.HandlerFunc(h.UploadSupplierDocument)))
	mux.Handle("GET /api/v1/supplier/batches", guard.ProtectSupplier(http.HandlerFunc(h.ListSupplierBatches)))
	tokenFor := func(workspace uuid.UUID) string {
		t.Helper()
		token, err := auth.GenerateSupplierToken(workspace.String(), supplier.String(), "supplier@example.test")
		if err != nil {
			t.Fatal(err)
		}
		return token
	}
	submit := func(token, association, id string, want int) {
		t.Helper()
		var body bytes.Buffer
		form := multipart.NewWriter(&body)
		if association != "" {
			if err := form.WriteField(association, id); err != nil {
				t.Fatal(err)
			}
		}
		part, err := form.CreateFormFile("file", "fixture.pdf")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := part.Write([]byte("%PDF-1.4\n% disposable fixture\n")); err != nil {
			t.Fatal(err)
		}
		if err := form.Close(); err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest(http.MethodPost, "/api/v1/supplier/documents", &body)
		req.Header.Set("Content-Type", form.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+token)
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		if res.Code != want {
			t.Fatalf("upload returned %d, want %d: %s", res.Code, want, res.Body.String())
		}
	}
	token := tokenFor(tenant)
	submit(tokenFor(otherTenant), "", "", http.StatusForbidden)
	submit(token, "batch_id", batchID, http.StatusForbidden)
	submit(token, "component_id", componentID, http.StatusForbidden)
	if uploads.Load() != 0 {
		t.Fatal("denied submissions reached storage")
	}

	list := httptest.NewRequest(http.MethodGet, "/api/v1/supplier/batches", nil)
	list.Header.Set("Authorization", "Bearer "+token)
	res := httptest.NewRecorder()
	mux.ServeHTTP(res, list)
	var listed struct {
		Batches []json.RawMessage `json:"batches"`
		Total   int               `json:"total"`
	}
	if res.Code != http.StatusOK || json.Unmarshal(res.Body.Bytes(), &listed) != nil || listed.Batches == nil || len(listed.Batches) != 0 || listed.Total != 0 {
		t.Fatalf("legacy list did not return an empty list: %d %s", res.Code, res.Body.String())
	}

	publicBucket.Store(true)
	submit(token, "", "", http.StatusServiceUnavailable)
	if uploads.Load() != 0 {
		t.Fatal("upload reached a public bucket")
	}
	publicBucket.Store(false)
	submit(token, "", "", http.StatusOK)
	var count int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM supplier_documents
		WHERE tenant_id=$1 AND supplier_id=$2 AND batch_id IS NULL AND component_id IS NULL
		AND file_url = tenant_id::text || '/supplier-docs/' || supplier_id::text || '/' || id::text`, tenant, supplier).Scan(&count); err != nil || count != 1 {
		t.Fatalf("unlinked document count = %d: %v", count, err)
	}

	revokeDuringUpload.Store(true)
	submit(token, "", "", http.StatusForbidden)
	submit(token, "", "", http.StatusForbidden)
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM supplier_documents`).Scan(&count); err != nil ||
		count != 1 || uploads.Load() != 2 || deletions.Load() != 1 {
		t.Fatalf("revoked upload should be cleaned up, got records=%d uploads=%d deletions=%d: %v", count, uploads.Load(), deletions.Load(), err)
	}
}
