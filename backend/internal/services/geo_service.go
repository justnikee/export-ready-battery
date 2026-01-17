package services

import (
	"log"
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
		log.Printf("⚠️  GeoIP database not found at %s, running in fallback mode", dbPath)
		return &GeoIPService{fallback: true}
	}
	log.Println("✅ GeoIP database loaded successfully")
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
	City    string
	Country string
}

// Lookup returns the city and country for an IP address
func (s *GeoIPService) Lookup(ipStr string) GeoLookupResult {
	// Handle localhost/development IPs
	if ipStr == "127.0.0.1" || ipStr == "::1" || ipStr == "" {
		return GeoLookupResult{City: "Local", Country: "Development"}
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
		return GeoLookupResult{City: "Unknown", Country: "Unknown"}
	}

	ip := net.ParseIP(ipStr)
	if ip == nil {
		return GeoLookupResult{City: "Unknown", Country: "Unknown"}
	}

	record, err := s.db.City(ip)
	if err != nil {
		return GeoLookupResult{City: "Unknown", Country: "Unknown"}
	}

	city := record.City.Names["en"]
	if city == "" {
		city = "Unknown"
	}

	country := record.Country.Names["en"]
	if country == "" {
		country = "Unknown"
	}

	return GeoLookupResult{City: city, Country: country}
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

// GetClientIP extracts the real client IP from request headers
func GetClientIP(remoteAddr string, xForwardedFor string, xRealIP string) string {
	// Priority: X-Real-IP > X-Forwarded-For > RemoteAddr
	if xRealIP != "" {
		return strings.TrimSpace(xRealIP)
	}

	if xForwardedFor != "" {
		// X-Forwarded-For can contain multiple IPs, take the first one
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// RemoteAddr might include port
	if strings.Contains(remoteAddr, ":") {
		host, _, err := net.SplitHostPort(remoteAddr)
		if err == nil {
			return host
		}
	}

	return remoteAddr
}
