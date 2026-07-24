package services

import (
	"log/slog"
	"os"
	"testing"
)

func TestExtractStoragePath(t *testing.T) {
	svc := &StorageService{
		supabaseURL:    "https://testproject.supabase.co",
		serviceRoleKey: "dummy-key",
		bucketName:     "compliance-docs",
		logger:         slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	tests := []struct {
		name     string
		rawURL   string
		bucket   string
		wantPath string
		wantOK   bool
	}{
		{
			name:     "Standard Supabase V1 Signed URL",
			rawURL:   "https://testproject.supabase.co/storage/v1/object/sign/compliance-docs/tenant-123/logo.jpg?token=abc123xyz",
			bucket:   "compliance-docs",
			wantPath: "tenant-123/logo.jpg",
			wantOK:   true,
		},
		{
			name:     "Legacy /object/sign path without /storage/v1",
			rawURL:   "https://testproject.supabase.co/object/sign/compliance-docs/tenant-123/logo.jpg?token=abc123xyz",
			bucket:   "compliance-docs",
			wantPath: "tenant-123/logo.jpg",
			wantOK:   true,
		},
		{
			name:     "Canonical Public URL",
			rawURL:   "https://testproject.supabase.co/storage/v1/object/public/compliance-docs/tenant-123/logo.jpg",
			bucket:   "compliance-docs",
			wantPath: "tenant-123/logo.jpg",
			wantOK:   true,
		},
		{
			name:     "Unmatched Bucket",
			rawURL:   "https://testproject.supabase.co/storage/v1/object/sign/other-bucket/tenant-123/logo.jpg",
			bucket:   "compliance-docs",
			wantPath: "",
			wantOK:   false,
		},
		{
			name:     "Empty URL",
			rawURL:   "",
			bucket:   "compliance-docs",
			wantPath: "",
			wantOK:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotPath, gotOK := svc.ExtractStoragePath(tt.rawURL, tt.bucket)
			if gotOK != tt.wantOK {
				t.Errorf("ExtractStoragePath() ok = %v, wantOK %v", gotOK, tt.wantOK)
			}
			if gotPath != tt.wantPath {
				t.Errorf("ExtractStoragePath() path = %v, wantPath %v", gotPath, tt.wantPath)
			}
		})
	}
}
