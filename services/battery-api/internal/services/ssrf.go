package services

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// SSRF protection for tenant-controlled outbound URLs (webhooks, etc.).
//
// Defense in depth:
//  1. Validate URL shape + scheme + host blocklist at register time.
//  2. Resolve DNS and reject private / link-local / loopback / metadata ranges.
//  3. Custom DialContext re-checks the connected IP (DNS rebinding).
//  4. Redirects re-run the full validation on the new URL.

// blockedWebhookHostnames are never allowed as webhook targets (case-insensitive).
var blockedWebhookHostnames = map[string]struct{}{
	"localhost":                 {},
	"metadata":                  {},
	"metadata.google.internal":  {},
	"metadata.goog":             {},
	"kubernetes.default":        {},
	"kubernetes.default.svc":    {},
	"host.docker.internal":      {},
}

// skipSSRFValidateForTest disables SSRF checks when set from unit tests that
// use httptest (loopback). Production code must never set this.
var skipSSRFValidateForTest bool

// TestingOnlyBypassSSRF enables/disables SSRF validation for unit tests that
// use loopback httptest servers. Do not call from production code.
func TestingOnlyBypassSSRF(enable bool) {
	skipSSRFValidateForTest = enable
}

// ValidateOutboundWebhookURL checks that rawURL is safe for the server to POST to.
// Call at registration and again immediately before delivery.
func ValidateOutboundWebhookURL(rawURL string) error {
	if skipSSRFValidateForTest {
		// Still require a parseable http(s) URL so tests don't silently accept junk.
		u, err := url.Parse(strings.TrimSpace(rawURL))
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			return fmt.Errorf("url must use http or https")
		}
		return nil
	}

	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return fmt.Errorf("url is required")
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid url")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return fmt.Errorf("url must use http or https")
	}
	if os.Getenv("APP_ENV") == "production" && u.Scheme != "https" {
		return fmt.Errorf("url must use https in production")
	}
	if u.Host == "" {
		return fmt.Errorf("url host is required")
	}
	// user:pass@host can obscure intent / confuse some parsers
	if u.User != nil {
		return fmt.Errorf("url must not contain userinfo")
	}
	// Fragments never sent on request; reject oddities
	if u.Fragment != "" {
		return fmt.Errorf("url must not contain a fragment")
	}

	host := strings.ToLower(u.Hostname())
	if host == "" {
		return fmt.Errorf("url host is required")
	}
	if _, blocked := blockedWebhookHostnames[host]; blocked {
		return fmt.Errorf("url host is not allowed")
	}
	if strings.HasSuffix(host, ".localhost") || strings.HasSuffix(host, ".local") || strings.HasSuffix(host, ".internal") {
		return fmt.Errorf("url host is not allowed")
	}

	// If host is already an IP literal, check it directly.
	if ip := net.ParseIP(host); ip != nil {
		if isBlockedIP(ip) {
			return fmt.Errorf("url resolves to a private or reserved address")
		}
		return nil
	}

	// Resolve DNS and ensure every address is public.
	addrs, err := net.DefaultResolver.LookupIPAddr(context.Background(), host)
	if err != nil {
		return fmt.Errorf("url host could not be resolved")
	}
	if len(addrs) == 0 {
		return fmt.Errorf("url host could not be resolved")
	}
	for _, a := range addrs {
		if isBlockedIP(a.IP) {
			return fmt.Errorf("url resolves to a private or reserved address")
		}
	}
	return nil
}

// isBlockedIP reports whether ip is unsuitable as an outbound webhook target.
func isBlockedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	// Normalize IPv4-mapped IPv6
	if v4 := ip.To4(); v4 != nil {
		ip = v4
	}

	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsMulticast() || ip.IsUnspecified() {
		return true
	}

	// Carrier-grade NAT (RFC 6598) — often internal cloud/VPC edges
	if ip4 := ip.To4(); ip4 != nil {
		if ip4[0] == 100 && ip4[1] >= 64 && ip4[1] <= 127 {
			return true
		}
		// 0.0.0.0/8
		if ip4[0] == 0 {
			return true
		}
		// IETF protocol assignments 192.0.0.0/24 (partial) — block 192.0.0.0/24 broadly
		if ip4[0] == 192 && ip4[1] == 0 && ip4[2] == 0 {
			return true
		}
		// TEST-NET and documentation ranges
		if ip4[0] == 192 && ip4[1] == 0 && ip4[2] == 2 {
			return true
		}
		if ip4[0] == 198 && (ip4[1] == 51) && ip4[2] == 100 {
			return true
		}
		if ip4[0] == 203 && ip4[1] == 0 && ip4[2] == 113 {
			return true
		}
		// Benchmarking 198.18.0.0/15
		if ip4[0] == 198 && (ip4[1] == 18 || ip4[1] == 19) {
			return true
		}
	}

	// IPv6 unique local (fc00::/7) — IsPrivate covers this in Go 1.17+ for some,
	// but be explicit for older mappings.
	if ip.To4() == nil && len(ip) == net.IPv6len {
		if ip[0]&0xfe == 0xfc {
			return true
		}
	}

	return false
}

// safeDialer resolves and connects only to non-blocked IPs (DNS rebinding guard).
var safeDialer = &net.Dialer{
	Timeout:   10 * time.Second,
	KeepAlive: 30 * time.Second,
}

func dialContextSSRF(ctx context.Context, network, addr string) (net.Conn, error) {
	if skipSSRFValidateForTest {
		return safeDialer.DialContext(ctx, network, addr)
	}
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return nil, err
	}
	// addr may be IP or hostname
	if ip := net.ParseIP(host); ip != nil {
		if isBlockedIP(ip) {
			return nil, fmt.Errorf("connection to private or reserved address blocked")
		}
		return safeDialer.DialContext(ctx, network, addr)
	}

	ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return nil, err
	}
	var lastErr error
	for _, ipa := range ips {
		if isBlockedIP(ipa.IP) {
			lastErr = fmt.Errorf("connection to private or reserved address blocked")
			continue
		}
		target := net.JoinHostPort(ipa.IP.String(), port)
		conn, err := safeDialer.DialContext(ctx, network, target)
		if err == nil {
			return conn, nil
		}
		lastErr = err
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("no allowed addresses for host")
	}
	return nil, lastErr
}

// NewSafeWebhookHTTPClient returns an HTTP client hardened against SSRF.
// Redirects are followed only if the next URL also passes ValidateOutboundWebhookURL.
func NewSafeWebhookHTTPClient() *http.Client {
	transport := &http.Transport{
		Proxy:                 nil, // never honor HTTP_PROXY for tenant webhooks
		DialContext:           dialContextSSRF,
		ForceAttemptHTTP2:     true,
		MaxIdleConns:          20,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		ResponseHeaderTimeout: 10 * time.Second,
	}

	return &http.Client{
		Timeout:   10 * time.Second,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return fmt.Errorf("too many redirects")
			}
			if skipSSRFValidateForTest {
				return nil
			}
			if err := ValidateOutboundWebhookURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %w", err)
			}
			return nil
		},
	}
}
