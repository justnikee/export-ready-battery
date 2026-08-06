package services

import (
	"log/slog"
	"net"
	"strings"

	"github.com/mssola/user_agent"
	"github.com/oschwald/geoip2-golang"
)

// GeoIPService handles IP to location lookups
type GeoIPService struct {
	db       *geoip2.Reader
	fallback bool // If true, db is nil and we use fallback
}

// NewGeoIPService creates a new GeoIP service
// If the database file is not found, it runs in fallback mode
func NewGeoIPService(dbPath string) *GeoIPService {
	db, err := geoip2.Open(dbPath)
	if err != nil {
		slog.Warn("GeoIP database not found, running in fallback mode", "path", dbPath)
		return &GeoIPService{fallback: true}
	}
	slog.Info("GeoIP database loaded successfully")
	return &GeoIPService{db: db}
}

// Close closes the GeoIP database
func (s *GeoIPService) Close() {
	if s.db != nil {
		s.db.Close()
	}
}

// GeoLookupResult contains the location lookup result
type GeoLookupResult struct {
	City      string
	Country   string
	Latitude  float64
	Longitude float64
}

// Lookup returns the city and country for an IP address
func (s *GeoIPService) Lookup(ipStr string) GeoLookupResult {
	// Handle localhost/development IPs
	if ipStr == "127.0.0.1" || ipStr == "::1" || ipStr == "" {
		return GeoLookupResult{City: "Local", Country: "Development", Latitude: 0, Longitude: 0}
	}

	// Strip port if present
	if strings.Contains(ipStr, ":") {
		host, _, err := net.SplitHostPort(ipStr)
		if err == nil {
			ipStr = host
		}
	}

	// If in fallback mode, return unknown
	if s.fallback || s.db == nil {
		return GeoLookupResult{City: "Unknown", Country: "Unknown", Latitude: 0, Longitude: 0}
	}

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return GeoLookupResult{City: "Unknown", Country: "Unknown", Latitude: 0, Longitude: 0}
	}

	record, err := s.db.City(ip)
	if err != nil {
		return GeoLookupResult{City: "Unknown", Country: "Unknown", Latitude: 0, Longitude: 0}
	}

	city := record.City.Names["en"]
	if city == "" {
		city = "Unknown"
	}

	country := record.Country.Names["en"]
	if country == "" {
		country = "Unknown"
	}

	return GeoLookupResult{
		City:      city,
		Country:   country,
		Latitude:  record.Location.Latitude,
		Longitude: record.Location.Longitude,
	}
}

// ParseDeviceType extracts the device type from User-Agent string
func ParseDeviceType(userAgentStr string) string {
	if userAgentStr == "" {
		return "Unknown"
	}

	ua := user_agent.New(userAgentStr)

	if ua.Mobile() {
		return "Mobile"
	}

	if ua.Bot() {
		return "Bot"
	}

	// Check for tablet indicators
	uaLower := strings.ToLower(userAgentStr)
	if strings.Contains(uaLower, "tablet") || strings.Contains(uaLower, "ipad") {
		return "Tablet"
	}

	return "Desktop"
}

// GetClientIP extracts the client IP for geo/rate-limit use (S-09).
// When trustProxy is false, only remoteAddr is used (ignores spoofable headers).
// When trustProxy is true, prefers rightmost X-Forwarded-For, then X-Real-IP.
func GetClientIP(remoteAddr string, xForwardedFor string, xRealIP string, trustProxy bool) string {
	if trustProxy {
		if xForwardedFor != "" {
			parts := strings.Split(xForwardedFor, ",")
			for i := len(parts) - 1; i >= 0; i-- {
				if ip := normalizeClientIP(parts[i]); ip != "" {
					return ip
				}
			}
		}
		if ip := normalizeClientIP(xRealIP); ip != "" {
			return ip
		}
	}
	return normalizeClientIP(remoteAddr)
}

func normalizeClientIP(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if host, _, err := net.SplitHostPort(raw); err == nil {
		raw = host
	}
	raw = strings.Trim(raw, "[]")
	if net.ParseIP(raw) == nil {
		return ""
	}
	return raw
}
