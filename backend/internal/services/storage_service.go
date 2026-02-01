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

// UploadFile uploads data to Supabase Storage and returns the file path
func (s *StorageService) UploadFile(ctx context.Context, data []byte, filePath string, contentType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, s.bucketName, filePath)

	// Debug logging
	s.logger.Info("attempting upload",
		"url", url,
		"bucket", s.bucketName,
		"supabaseURL", s.supabaseURL,
		"keyPrefix", s.serviceRoleKey[:20]+"...",
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
		"size", len(data),
		"contentType", contentType,
	)

	return nil
}

// UploadReader uploads from an io.Reader to Supabase Storage
func (s *StorageService) UploadReader(ctx context.Context, reader io.Reader, size int64, filePath string, contentType string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, s.bucketName, filePath)

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
		"size", size,
		"contentType", contentType,
	)

	return nil
}

// CreateSignedURL creates a presigned download URL that expires after the specified duration
func (s *StorageService) CreateSignedURL(ctx context.Context, filePath string, expiresIn time.Duration) (string, error) {
	// Construct URL properly using net/url to handle special characters (spaces, etc.)
	u, err := url.Parse(s.supabaseURL)
	if err != nil {
		return "", fmt.Errorf("invalid supabase URL: %w", err)
	}

	// Join paths. Note: path.Join handles the slashes
	// We manually append the path to the existing path in SupabaseURL (if any)
	// But ensure accessing /storage/v1...
	u.Path = path.Join(u.Path, "storage/v1/object/sign", s.bucketName, filePath)

	// The path.Join might strip trailing slashes or clean path.
	// Also if filePath has slashes, path.Join preserves them as separators.
	// But wait, path.Join is for file paths, path.Join (path package) uses forward slashes.
	// We should verify if filePath segments need individual escaping.
	// net/url URL.String() will escape the path.

	destURL := u.String()

	s.logger.Info("creating signed URL request",
		"url", destURL,
		"filePath", filePath,
		"bucket", s.bucketName,
	)

	// Request body for signed URL
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

	// Parse response using encoding/json
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

	// The signed URL returned by Supabase is a path relative to the domain
	// e.g., /storage/v1/object/sign/bucket/path?token=...
	signedPath := response.SignedURL

	// Ensure we handle potential full URLs or relative paths correctly
	fullURL := s.supabaseURL + signedPath

	s.logger.Info("created signed URL successfully",
		"path", filePath,
		"signedPath", signedPath,
		"fullURL", fullURL,
	)

	return fullURL, nil
}

// DeleteFile removes a file from Supabase Storage
func (s *StorageService) DeleteFile(ctx context.Context, filePath string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, s.bucketName, filePath)

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

	s.logger.Info("file deleted from storage", "path", filePath)
	return nil
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
