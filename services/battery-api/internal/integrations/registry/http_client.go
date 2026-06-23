package registry

import (
	"fmt"
	"net"
	"net/http"
	"time"
)

// newRegistryHTTPClient creates a resilient HTTP client for external registries.
func newRegistryHTTPClient(timeout time.Duration) *http.Client {
	if timeout == 0 {
		timeout = 15 * time.Second
	}
	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   5 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   5 * time.Second,
			ResponseHeaderTimeout: timeout,
			MaxIdleConns:          10,
			MaxIdleConnsPerHost:   5,
			IdleConnTimeout:       90 * time.Second,
		},
	}
}

// registryRequest builds an HTTP request with standard headers.
func registryRequest(method, url string) (*http.Request, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}
	req.Header.Set("User-Agent", "AnvayaLabs-Battery-Registry/1.0 (Compliance Verification)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	return req, nil
}
