package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"time"
)

// StorageService handles uploads and downloads to Supabase Storage
type StorageService struct {
	supabaseURL    string
	serviceRoleKey string
	bucketName     string
	logger         *slog.Logger
}

// NewStorageService creates a new Supabase Storage service
func NewStorageService(logger *slog.Logger) *StorageService {
	return &StorageService{
		supabaseURL:    os.Getenv("SUPABASE_URL"),
		serviceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		bucketName:     "Exports",
		logger:         logger,
	}
}

// UploadFile uploads data to the default bucket in Supabase Storage.
func (s *StorageService) UploadFile(ctx context.Context, data []byte, filePath string, contentType string) error {
	return s.UploadFileToBucket(ctx, s.bucketName, filePath, data, contentType)
}

// UploadFileToBucket uploads data to a specific bucket in Supabase Storage.
func (s *StorageService) UploadFileToBucket(ctx context.Context, bucket, filePath string, data []byte, contentType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, filePath)

	s.logger.Info("attempting upload",
		"url", url,
		"bucket", bucket,
		"supabaseURL", s.supabaseURL,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true") // Overwrite if exists

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
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
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, filePath)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, reader)
	if err != nil {
		return fmt.Errorf("failed to create upload request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Content-Length", fmt.Sprintf("%d", size))
	req.Header.Set("x-upsert", "true")

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
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

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
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

	// The signedURL shape varies by Supabase Storage version: older versions
	// return "/storage/v1/object/sign/...", newer ones return "/object/sign/..."
	// (relative to the storage API root, without the /storage/v1 prefix).
	// Concatenating the newer shape verbatim yields a URL that 404s.
	signedPath := response.SignedURL
	if strings.HasPrefix(signedPath, "http://") || strings.HasPrefix(signedPath, "https://") {
		return signedPath, nil
	}
	if !strings.HasPrefix(signedPath, "/storage/v1/") {
		signedPath = "/storage/v1" + signedPath
	}
	fullURL := strings.TrimSuffix(s.supabaseURL, "/") + signedPath

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
func (s *StorageService) ExtractStoragePath(rawURL, bucket string) (string, bool) {
	if rawURL == "" {
		return "", false
	}

	for _, marker := range []string{
		"/storage/v1/object/sign/" + bucket + "/",
		"/storage/v1/object/public/" + bucket + "/",
		"/storage/v1/object/" + bucket + "/",
		// Newer Supabase versions issue signed URLs relative to the storage API
		// root (no /storage/v1 prefix). URLs persisted before the prefix fix
		// carry this shape and must still resolve back to a storage path.
		"/object/sign/" + bucket + "/",
		"/object/public/" + bucket + "/",
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

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
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

// extractSignedURL parses the signedURL from the JSON response
func extractSignedURL(jsonResponse string) string {
	// Simple extraction without external JSON library
	// Response: {"signedURL":"/storage/v1/object/sign/..."}
	prefix := `"signedURL":"`
	start := bytes.Index([]byte(jsonResponse), []byte(prefix))
	if start == -1 {
		return ""
	}
	start += len(prefix)

	end := bytes.Index([]byte(jsonResponse[start:]), []byte(`"`))
	if end == -1 {
		return ""
	}

	return jsonResponse[start : start+end]
}
