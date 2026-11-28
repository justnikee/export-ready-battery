package handlers

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/middleware"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/anvayalabs/battery-api/internal/testutil"
	"github.com/google/uuid"
)

func TestSupplierDocumentDownloadsPostgres(t *testing.T) {
	pool := testutil.OpenPostgres(t)
	ctx := context.Background()
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, query, args...); err != nil {
			t.Fatal(err)
		}
	}
	exec(`CREATE TABLE tenants (id uuid PRIMARY KEY);
		CREATE TABLE batches (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, deleted_at timestamptz);
		CREATE TABLE components (id uuid PRIMARY KEY, tenant_id uuid NOT NULL, batch_id uuid);
		CREATE TABLE team_members (tenant_id uuid, user_id uuid, role text, status text);`)
	for _, migration := range []string{"000082_create_suppliers.up.sql", "000083_create_supplier_documents.up.sql"} {
		sql, err := os.ReadFile(filepath.Join("..", "db", "migrations", migration))
		if err != nil {
			t.Fatal(err)
		}
		exec(string(sql))
	}

	tenant, otherTenant := uuid.New(), uuid.New()
	owner, peer, otherSupplier := uuid.New(), uuid.New(), uuid.New()
	manufacturer, otherManufacturer := uuid.New(), uuid.New()
	exec(`INSERT INTO tenants VALUES ($1), ($2)`, tenant, otherTenant)
	exec(`INSERT INTO team_members VALUES ($1,$2,'VIEWER','ACTIVE'), ($3,$4,'OWNER','ACTIVE')`, tenant, manufacturer, otherTenant, otherManufacturer)
	exec(`INSERT INTO suppliers(id,tenant_id,email,company_name,status) VALUES
		($1,$2,'owner@example.test','Owner','active'),
		($3,$2,'peer@example.test','Peer','active'),
		($4,$5,'other@example.test','Other','active')`, owner, tenant, peer, otherSupplier, otherTenant)

	document, legacy, previous, peerDocument, otherDocument := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
	ownerPrefix := supplierDocumentPrefix(tenant, owner)
	documentKey := ownerPrefix + document.String()
	legacyKey := ownerPrefix + "coc_20260228_123456_fixture_file.pdf"
	previousKey := ownerPrefix + previous.String()
	peerKey := supplierDocumentPrefix(tenant, peer) + peerDocument.String()
	otherKey := supplierDocumentPrefix(otherTenant, otherSupplier) + otherDocument.String()
	const content = "%PDF-1.4\nprivate integration fixture\n"
	const bucket = "/storage/v1/bucket/compliance-docs"
	const privatePrefix = "/storage/v1/object/authenticated/compliance-docs/"
	const publicPrefix = "/storage/v1/object/public/compliance-docs/"
	var metadata atomic.Value
	metadata.Store(`{"public":false}`)
	var storageRequests, objectReads atomic.Int32
	storage := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		storageRequests.Add(1)
		if r.Method != http.MethodGet || r.Header.Get("Authorization") != "Bearer fixture-only" {
			http.Error(w, "fixture storage requires service credentials", http.StatusUnauthorized)
			return
		}
		if r.URL.Path == bucket {
			_, _ = io.WriteString(w, metadata.Load().(string))
			return
		}
		switch r.URL.Path {
		case privatePrefix + documentKey, privatePrefix + legacyKey, privatePrefix + previousKey, privatePrefix + peerKey, privatePrefix + otherKey:
			objectReads.Add(1)
			_, _ = io.WriteString(w, content)
		default:
			t.Errorf("unexpected provider request path %q", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(storage.Close)
	t.Setenv("SUPABASE_URL", storage.URL)
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "fixture-only")

	insertDocument := func(id, workspace, supplier uuid.UUID, ref string) {
		t.Helper()
		exec(`INSERT INTO supplier_documents(id,tenant_id,supplier_id,doc_type,file_url,file_name)
			VALUES ($1,$2,$3,'coc',$4,'fixture file.pdf')`, id, workspace, supplier, ref)
	}
	insertDocument(document, tenant, owner, documentKey)
	insertDocument(legacy, tenant, owner, storage.URL+publicPrefix+legacyKey)
	insertDocument(previous, tenant, owner, storage.URL+publicPrefix+previousKey)
	insertDocument(peerDocument, tenant, peer, peerKey)
	insertDocument(otherDocument, otherTenant, otherSupplier, otherKey)

	repo := repository.New(&db.DB{Pool: pool})
	profile, err := repo.GetSupplierByEmail(ctx, tenant, "owner@example.test")
	if err != nil || profile.ID != owner.String() {
		t.Fatalf("supplier lookup with optional fields omitted failed: %v", err)
	}
	h := &Handler{repo: repo, storageService: services.NewStorageService(slog.Default())}
	auth := services.NewAuthService("fixture-supplier-download", time.Hour, time.Hour)
	guard := middleware.NewAuth(auth)
	mux := http.NewServeMux()
	const supplierPath = "/api/v1/supplier/documents"
	const manufacturerPath = "/api/v1/supplier-documents"
	mux.Handle("POST "+supplierPath+"/{id}/download", guard.ProtectSupplier(http.HandlerFunc(h.DownloadSupplierDocument)))
	mux.Handle("POST "+manufacturerPath+"/{id}/download", guard.ProtectWorkspace(http.HandlerFunc(h.DownloadTenantSupplierDocument), repo.GetActiveMembershipRole))
	mux.Handle("GET "+supplierPath, guard.ProtectSupplier(http.HandlerFunc(h.ListSupplierDocuments)))
	mux.Handle("GET "+manufacturerPath, guard.ProtectWorkspace(http.HandlerFunc(h.ListTenantSupplierDocuments), repo.GetActiveMembershipRole))
	const sessionPath = "/api/v1/supplier/session"
	mux.Handle("POST "+sessionPath, guard.ProtectSupplier(http.HandlerFunc(h.SupplierSession)))

	supplierCookie := func(workspace, supplier uuid.UUID) *http.Cookie {
		t.Helper()
		token, err := auth.GenerateSupplierToken(workspace.String(), supplier.String(), "supplier@example.test")
		if err != nil {
			t.Fatal(err)
		}
		return &http.Cookie{Name: "supplier_token", Value: token}
	}
	manufacturerCookie := func(workspace, user uuid.UUID) *http.Cookie {
		t.Helper()
		token, err := auth.GenerateToken(workspace.String(), user.String(), "workspace@example.test", "OWNER", models.ProductTypeBattery)
		if err != nil {
			t.Fatal(err)
		}
		return &http.Cookie{Name: "auth_token", Value: token}
	}
	ownerSession := supplierCookie(tenant, owner)
	peerSession := supplierCookie(tenant, peer)
	otherSupplierSession := supplierCookie(otherTenant, otherSupplier)
	manufacturerSession := manufacturerCookie(tenant, manufacturer)
	otherManufacturerSession := manufacturerCookie(otherTenant, otherManufacturer)

	request := func(method, route string, credential *http.Cookie) *httptest.ResponseRecorder {
		t.Helper()
		req := httptest.NewRequest(method, route, nil)
		if credential != nil {
			req.AddCookie(credential)
		}
		res := httptest.NewRecorder()
		mux.ServeHTTP(res, req)
		return res
	}
	download := func(route string, id uuid.UUID, credential *http.Cookie, want int) {
		t.Helper()
		res := request(http.MethodPost, route+"/"+id.String()+"/download", credential)
		if res.Code != want {
			t.Fatalf("download returned %d, want %d: %s", res.Code, want, res.Body.String())
		}
		if want == http.StatusOK {
			if res.Body.String() != content || res.Header().Get("Cache-Control") != "private, no-store" ||
				res.Header().Get("Content-Disposition") != `attachment; filename="fixture file.pdf"` {
				t.Fatalf("unexpected download headers or content: %v", res.Header())
			}
		} else if strings.Contains(res.Body.String(), content) || strings.Contains(res.Body.String(), storage.URL) {
			t.Fatal("denied download leaked file data or the storage URL")
		}
	}

	t.Run("restores only a live supplier cookie", func(t *testing.T) {
		res := request(http.MethodPost, sessionPath, ownerSession)
		var session struct{ Token string }
		if res.Code != http.StatusOK || res.Header().Get("Cache-Control") != "private, no-store" ||
			json.Unmarshal(res.Body.Bytes(), &session) != nil || session.Token != ownerSession.Value {
			t.Fatalf("supplier session was not restored securely, status %d", res.Code)
		}
		for _, cookie := range []*http.Cookie{nil, manufacturerSession} {
			if res := request(http.MethodPost, sessionPath, cookie); res.Code != http.StatusUnauthorized {
				t.Fatalf("non-supplier session returned %d", res.Code)
			}
		}
	})

	t.Run("owners download their files", func(t *testing.T) {
		download(supplierPath, document, ownerSession, http.StatusOK)
		download(manufacturerPath, document, manufacturerSession, http.StatusOK)
		download(supplierPath, peerDocument, peerSession, http.StatusOK)
		download(supplierPath, otherDocument, otherSupplierSession, http.StatusOK)
		download(manufacturerPath, otherDocument, otherManufacturerSession, http.StatusOK)
		download(supplierPath, legacy, ownerSession, http.StatusOK)
		download(manufacturerPath, previous, manufacturerSession, http.StatusOK)
		if objectReads.Load() != 7 {
			t.Fatalf("expected seven authenticated object reads, got %d", objectReads.Load())
		}
	})

	t.Run("lists only return scoped metadata", func(t *testing.T) {
		for _, tc := range []struct {
			route      string
			credential *http.Cookie
		}{
			{supplierPath + "?supplier_id=" + peer.String(), ownerSession},
			{manufacturerPath + "?supplier_id=" + owner.String(), manufacturerSession},
		} {
			res := request(http.MethodGet, tc.route, tc.credential)
			var list struct {
				Documents []map[string]json.RawMessage `json:"documents"`
			}
			if res.Code != http.StatusOK || res.Header().Get("Cache-Control") != "private, no-store" ||
				json.Unmarshal(res.Body.Bytes(), &list) != nil || len(list.Documents) != 3 {
				t.Fatalf("unexpected metadata response: %d %s", res.Code, res.Body.String())
			}
			for _, doc := range list.Documents {
				if string(doc["supplier_id"]) != `"`+owner.String()+`"` || doc["file_url"] != nil {
					t.Fatal("metadata exposed another supplier's record or a storage reference")
				}
			}
		}
	})

	t.Run("denials reach no storage endpoint", func(t *testing.T) {
		before := storageRequests.Load()
		download(supplierPath, document, nil, http.StatusUnauthorized)
		download(manufacturerPath, document, nil, http.StatusUnauthorized)
		download(supplierPath, document, peerSession, http.StatusNotFound)
		download(supplierPath, document, otherSupplierSession, http.StatusNotFound)
		download(manufacturerPath, document, otherManufacturerSession, http.StatusNotFound)
		download(supplierPath, document, supplierCookie(otherTenant, owner), http.StatusNotFound)
		download(supplierPath, document, &http.Cookie{Name: "supplier_token", Value: manufacturerSession.Value}, http.StatusUnauthorized)
		download(manufacturerPath, document, &http.Cookie{Name: "auth_token", Value: ownerSession.Value}, http.StatusUnauthorized)
		for _, ref := range []string{
			"https://other.example.test" + publicPrefix + legacyKey,
			storage.URL + publicPrefix + ownerPrefix + "../coc_20260228_123456_fixture_file.pdf",
			storage.URL + publicPrefix + legacyKey + "?token=fixture",
			storage.URL + publicPrefix + peerKey,
			storage.URL + publicPrefix + documentKey,
			ownerPrefix + "unknown.pdf",
		} {
			id := uuid.New()
			insertDocument(id, tenant, owner, ref)
			download(manufacturerPath, id, manufacturerSession, http.StatusNotFound)
		}
		foreignBatch, badComponent, badBatchDoc, badComponentDoc, badSupplierDoc := uuid.New(), uuid.New(), uuid.New(), uuid.New(), uuid.New()
		exec(`INSERT INTO batches(id,tenant_id) VALUES ($1,$2)`, foreignBatch, otherTenant)
		exec(`INSERT INTO components VALUES ($1,$2,$3)`, badComponent, tenant, foreignBatch)
		insertDocument(badBatchDoc, tenant, owner, ownerPrefix+badBatchDoc.String())
		insertDocument(badComponentDoc, tenant, owner, ownerPrefix+badComponentDoc.String())
		insertDocument(badSupplierDoc, tenant, otherSupplier, supplierDocumentPrefix(tenant, otherSupplier)+badSupplierDoc.String())
		exec(`UPDATE supplier_documents SET batch_id=$2 WHERE id=$1`, badBatchDoc, foreignBatch)
		exec(`UPDATE supplier_documents SET component_id=$2 WHERE id=$1`, badComponentDoc, badComponent)
		download(supplierPath, badBatchDoc, ownerSession, http.StatusNotFound)
		download(manufacturerPath, badComponentDoc, manufacturerSession, http.StatusNotFound)
		download(manufacturerPath, badSupplierDoc, manufacturerSession, http.StatusNotFound)

		exec(`UPDATE suppliers SET status='blocked' WHERE id=$1`, peer)
		download(supplierPath, peerDocument, peerSession, http.StatusNotFound)
		if res := request(http.MethodGet, supplierPath, peerSession); res.Code != http.StatusForbidden {
			t.Fatalf("blocked supplier metadata request returned %d", res.Code)
		}
		if res := request(http.MethodPost, sessionPath, peerSession); res.Code != http.StatusForbidden {
			t.Fatalf("blocked supplier session restore returned %d", res.Code)
		}
		exec(`DELETE FROM team_members WHERE tenant_id=$1 AND user_id=$2`, otherTenant, otherManufacturer)
		download(manufacturerPath, otherDocument, otherManufacturerSession, http.StatusUnauthorized)
		if got := storageRequests.Load() - before; got != 0 {
			t.Fatalf("denied requests reached storage %d times", got)
		}
		download(manufacturerPath, peerDocument, manufacturerSession, http.StatusOK)
	})

	t.Run("ambiguous or public bucket metadata fails closed", func(t *testing.T) {
		before := objectReads.Load()
		for _, body := range []string{`{"public":true}`, `{"public":null}`, `{}`, `partial`} {
			metadata.Store(body)
			download(supplierPath, document, ownerSession, http.StatusServiceUnavailable)
		}
		if objectReads.Load() != before {
			t.Fatal("an unverified bucket configuration reached the object store")
		}
	})
}
