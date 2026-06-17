package fetchers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// ScraperFetcher does basic HTML scraping with configurable regex selectors.
type ScraperFetcher struct {
	client *http.Client
}

// NewScraperFetcher creates a scraper with a 30s timeout.
func NewScraperFetcher() *ScraperFetcher {
	return &ScraperFetcher{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Fetch retrieves the page and extracts items using source.Config selectors.
// Expected config keys:
//   "item_regex"   — regex with named groups: title, url, date, summary
//   "base_url"     — prepend to relative URLs
//   "date_format"  — optional Go time layout (default RFC3339)
func (f *ScraperFetcher) Fetch(ctx context.Context, source *models.RegulatorySource) ([]models.RegulatoryItem, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, source.URL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("scraper returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return nil, err
	}

	pattern := source.Config["item_regex"]
	if pattern == "" {
		return nil, fmt.Errorf("scraper config missing item_regex")
	}

	re, err := regexp.Compile(pattern)
	if err != nil {
		return nil, fmt.Errorf("invalid item_regex: %w", err)
	}

	baseURL := source.Config["base_url"]
	dateFmt := source.Config["date_format"]
	if dateFmt == "" {
		dateFmt = time.RFC3339
	}

	var items []models.RegulatoryItem
	matches := re.FindAllStringSubmatchIndex(string(body), -1)
	for _, m := range matches {
		item := extractNamedGroups(string(body), m, re)
		rItem := models.RegulatoryItem{
			ExternalID:  item["url"],
			Title:       strings.TrimSpace(item["title"]),
			Summary:     strings.TrimSpace(item["summary"]),
			URL:         item["url"],
			RawContent:  item["title"] + "\n" + item["summary"],
		}
		if !strings.HasPrefix(rItem.URL, "http") && baseURL != "" {
			rItem.URL = strings.TrimRight(baseURL, "/") + "/" + strings.TrimLeft(rItem.URL, "/")
			rItem.ExternalID = rItem.URL
		}
		if d := item["date"]; d != "" {
			if t, err := time.Parse(dateFmt, d); err == nil {
				rItem.PublishedAt = &t
			}
		}
		items = append(items, rItem)
	}

	return items, nil
}

func extractNamedGroups(text string, match []int, re *regexp.Regexp) map[string]string {
	result := make(map[string]string)
	for i, name := range re.SubexpNames() {
		if name == "" || i >= len(match)/2 {
			continue
		}
		start := match[i*2]
		end := match[i*2+1]
		if start >= 0 && end >= 0 {
			result[name] = text[start:end]
		}
	}
	return result
}
