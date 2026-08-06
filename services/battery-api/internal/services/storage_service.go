package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"sync"
	"time"
)

// StorageService handles uploads and downloads to Supabase Storage
type StorageService struct {
	supabaseURL     string
	serviceRoleKey  string
	bucketName      string
	logger          *slog.Logger
	client          *http.Client    // shared HTTP client for connection reuse
	verifiedBuckets sync.Map        // cache of verified bucket names
}

// NewStorageService creates a new Supabase Storage service
func NewStorageService(logger *slog.Logger) *StorageService {
	// Allow override via env; default to lowercase "exports"
	bucket := os.Getenv("SUPABASE_EXPORTS_BUCKET")
	if bucket == "" {
		bucket = "exports"
	}
	return &StorageService{
		supabaseURL:    os.Getenv("SUPABASE_URL"),
		serviceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		bucketName:     bucket,
		logger:         logger,
		client: &http.Client{
			Timeout: 10 * time.Minute, // generous timeout for large uploads
			Transport: &http.Transport{
				MaxIdleConns:        20,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
				DialContext: (&net.Dialer{
					Timeout:   10 * time.Second,
					KeepAlive: 30 * time.Second,
				}).DialContext,
			},
		},
	}
}

// EnsureBucket creates the bucket if it does not already exist.
// It is idempotent — calling it when the bucket already exists is a no-op.
// Verified buckets are cached in memory to avoid redundant HTTP checks.
func (s *StorageService) EnsureBucket(ctx context.Context, bucket string) error {
	// Fast path: bucket already verified in memory
	if _, ok := s.verifiedBuckets.Load(bucket); ok {
		return nil
	}

	checkURL := fmt.Sprintf("%s/storage/v1/bucket/%s", s.supabaseURL, bucket)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, checkURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create bucket check request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("bucket check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		s.verifiedBuckets.Store(bucket, true)
		return nil // Bucket already exists
	}

	// Create the bucket
	creatURL := fmt.Sprintf("%s/storage/v1/bucket", s.supabaseURL)
	body := fmt.Sprintf(`{"id":%q,"name":%q,"public":false}`, bucket, bucket)
	creatReq, err := http.NewRequestWithContext(ctx, http.MethodPost, creatURL, strings.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create bucket creation request: %w", err)
	}
	creatReq.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	creatReq.Header.Set("Content-Type", "application/json")

	creatResp, err := s.client.Do(creatReq)
	if err != nil {
		return fmt.Errorf("bucket creation failed: %w", err)
	}
	defer creatResp.Body.Close()

	if creatResp.StatusCode != http.StatusOK && creatResp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(creatResp.Body)
		return fmt.Errorf("bucket creation returned status %d: %s", creatResp.StatusCode, string(respBody))
	}

	s.verifiedBuckets.Store(bucket, true)
	s.logger.Info("created storage bucket", "bucket", bucket)
	return nil
}

// UploadFile uploads data to the default bucket in Supabase Storage.
func (s *StorageService) UploadFile(ctx context.Context, data []byte, filePath string, contentType string) error {
	return s.UploadFileToBucket(ctx, s.bucketName, filePath, data, contentType)
}

// UploadFileToBucket uploads data to a specific bucket in Supabase Storage.
func (s *StorageService) UploadFileToBucket(ctx context.Context, bucket, filePath string, data []byte, contentType string) error {
	// Auto-create bucket if it doesn't exist yet
	if err := s.EnsureBucket(ctx, bucket); err != nil {
		s.logger.Warn("EnsureBucket failed — attempting upload anyway", "bucket", bucket, "error", err)
	}

	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, filePath)

	s.logger.Info("attempting upload",
		"url", uploadURL,
		"bucket", bucket,
		"supabaseURL", s.supabaseURL,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true") // Overwrite if exists

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	s.logger.Info("file uploaded to storage",
		"path", filePath,
		"bucket", bucket,
		"size", len(data),
		"contentType", contentType,
	)

	return nil
}

// UploadReader uploads from an io.Reader to the default bucket.
func (s *StorageService) UploadReader(ctx context.Context, reader io.Reader, size int64, filePath string, contentType string) error {
	return s.UploadReaderToBucket(ctx, s.bucketName, reader, size, filePath, contentType)
}

// UploadReaderToBucket uploads from an io.Reader to a specific bucket.
func (s *StorageService) UploadReaderToBucket(ctx context.Context, bucket string, reader io.Reader, size int64, filePath string, contentType string) error {
	// Auto-create bucket if it doesn't exist yet
	if err := s.EnsureBucket(ctx, bucket); err != nil {
		s.logger.Warn("EnsureBucket failed — attempting upload anyway", "bucket", bucket, "error", err)
	}

	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, filePath)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, reader)
	if err != nil {
		return fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", contentType)
	if size > 0 {
		req.Header.Set("Content-Length", fmt.Sprintf("%d", size))
	}
	req.Header.Set("x-upsert", "true")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	s.logger.Info("file uploaded to storage",
		"path", filePath,
		"bucket", bucket,
		"size", size,
		"contentType", contentType,
	)

	return nil
}

// CreateSignedURL creates a presigned download URL from the default bucket.
func (s *StorageService) CreateSignedURL(ctx context.Context, filePath string, expiresIn time.Duration) (string, error) {
	return s.CreateSignedURLForBucket(ctx, s.bucketName, filePath, expiresIn)
}

// CreateSignedURLForBucket creates a presigned download URL from a specific bucket.
func (s *StorageService) CreateSignedURLForBucket(ctx context.Context, bucket, filePath string, expiresIn time.Duration) (string, error) {
	u, err := url.Parse(s.supabaseURL)
	if err != nil {
		return "", fmt.Errorf("invalid supabase URL: %w", err)
	}

	u.Path = path.Join(u.Path, "storage/v1/object/sign", bucket, filePath)
	destURL := u.String()

	s.logger.Info("creating signed URL request",
		"url", destURL,
		"filePath", filePath,
		"bucket", bucket,
	)

	expirySeconds := int(expiresIn.Seconds())
	body := fmt.Sprintf(`{"expiresIn": %d}`, expirySeconds)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, destURL, bytes.NewBufferString(body))
	if err != nil {
		return "", fmt.Errorf("failed to create signed URL request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to create signed URL: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read signed URL response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("signed URL creation failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var response struct {
		SignedURL string `json:"signedURL"`
	}
	if err := json.Unmarshal(respBody, &response); err != nil {
		s.logger.Error("failed to unmarshal signed URL response",
			"body", string(respBody),
			"error", err,
		)
		return "", fmt.Errorf("failed to parse signed URL response: %w", err)
	}

	signedPath := response.SignedURL
	if !strings.HasPrefix(signedPath, "/storage/v1") {
		if strings.HasPrefix(signedPath, "/") {
			signedPath = "/storage/v1" + signedPath
		} else {
			signedPath = "/storage/v1/" + signedPath
		}
	}

	fullURL := strings.TrimRight(s.supabaseURL, "/") + signedPath

	s.logger.Info("created signed URL successfully",
		"path", filePath,
		"bucket", bucket,
		"fullURL", fullURL,
	)

	return fullURL, nil
}

// ExtractStoragePath recovers the object path within bucket from a previously
// issued Supabase Storage URL (either a signed URL with a query-string token,
// or a public URL). Signed URLs expire (see CreateSignedURLForBucket), so
// callers that persist a URL long-term should instead persist the storage
// path and re-derive a fresh signed URL on each read — this is the inverse
// operation used to migrate/recover a path from an already-stored URL.
// Returns ok=false if rawURL isn't a Supabase object URL for this bucket.
//
// Also accepts bare object keys (no scheme) such as
// "{tenant_id}/certificates/epr.pdf" for callers that store paths only.
func (s *StorageService) ExtractStoragePath(rawURL, bucket string) (string, bool) {
	if rawURL == "" {
		return "", false
	}

	// Bare storage key (no scheme / host) — treat as object path in bucket.
	if !strings.Contains(rawURL, "://") && !strings.HasPrefix(rawURL, "/") {
		key := strings.TrimSpace(rawURL)
		if key != "" && !strings.Contains(key, "..") {
			return key, true
		}
	}

	for _, marker := range []string{
		"/storage/v1/object/sign/" + bucket + "/",
		"/object/sign/" + bucket + "/",
		"/storage/v1/object/public/" + bucket + "/",
		"/object/public/" + bucket + "/",
		"/storage/v1/object/" + bucket + "/",
		"/object/" + bucket + "/",
	} {
		idx := strings.Index(rawURL, marker)
		if idx == -1 {
			continue
		}
		rest := rawURL[idx+len(marker):]
		if q := strings.IndexByte(rest, '?'); q != -1 {
			rest = rest[:q]
		}
		if rest == "" {
			return "", false
		}
		decoded, err := url.PathUnescape(rest)
		if err != nil {
			return rest, true
		}
		return decoded, true
	}

	return "", false
}

// DeleteFile removes a file from the default bucket.
func (s *StorageService) DeleteFile(ctx context.Context, filePath string) error {
	return s.DeleteFileFromBucket(ctx, s.bucketName, filePath)
}

// DeleteFileFromBucket removes a file from a specific bucket.
func (s *StorageService) DeleteFileFromBucket(ctx context.Context, bucket, filePath string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, filePath)

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNotFound {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(body))
	}

	s.logger.Info("file deleted from storage", "path", filePath, "bucket", bucket)
	return nil
}

// PublicURL returns the public URL for an object in a bucket.
// This works for buckets with public access enabled.
func (s *StorageService) PublicURL(bucket, filePath string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.supabaseURL, bucket, filePath)
}

