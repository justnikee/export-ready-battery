package fetchers

import (
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// RSSFetcher fetches and parses RSS/Atom feeds using stdlib xml.
type RSSFetcher struct {
	client *http.Client
}

// NewRSSFetcher creates a fetcher with a 30s timeout.
func NewRSSFetcher() *RSSFetcher {
	return &RSSFetcher{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Fetch retrieves the feed and returns regulatory items.
func (f *RSSFetcher) Fetch(ctx context.Context, source *models.RegulatorySource) ([]models.RegulatoryItem, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, source.URL, nil)
	if err != nil {
		return nil, err
	}
	if source.LastETag != "" {
		req.Header.Set("If-None-Match", source.LastETag)
	}

	resp, err := f.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return nil, nil
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("RSS feed returned %d", resp.StatusCode)
	}

	// Store etag for next fetch
	if etag := resp.Header.Get("ETag"); etag != "" {
		source.LastETag = etag
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return nil, err
	}

	// Try RSS 2.0 first, then Atom
	var rss rssFeed
	if err := xml.Unmarshal(body, &rss); err == nil && len(rss.Channel.Items) > 0 {
		return f.parseRSS(source, &rss), nil
	}

	var atom atomFeed
	if err := xml.Unmarshal(body, &atom); err == nil && len(atom.Entries) > 0 {
		return f.parseAtom(source, &atom), nil
	}

	return nil, fmt.Errorf("unable to parse RSS or Atom from %s", source.URL)
}

func (f *RSSFetcher) parseRSS(source *models.RegulatorySource, feed *rssFeed) []models.RegulatoryItem {
	var items []models.RegulatoryItem
	for _, entry := range feed.Channel.Items {
		item := models.RegulatoryItem{
			ExternalID: entry.Link,
			Title:      strings.TrimSpace(entry.Title),
			Summary:    stripHTML(entry.Description),
			URL:        entry.Link,
			RawContent: entry.Description,
		}
		if t, err := time.Parse(time.RFC1123, entry.PubDate); err == nil {
			item.PublishedAt = &t
		} else if t, err := time.Parse(time.RFC1123Z, entry.PubDate); err == nil {
			item.PublishedAt = &t
		} else if t, err := time.Parse(time.RFC3339, entry.PubDate); err == nil {
			item.PublishedAt = &t
		}
		items = append(items, item)
	}
	return items
}

func (f *RSSFetcher) parseAtom(source *models.RegulatorySource, feed *atomFeed) []models.RegulatoryItem {
	var items []models.RegulatoryItem
	for _, entry := range feed.Entries {
		item := models.RegulatoryItem{
			ExternalID: entry.ID,
			Title:      strings.TrimSpace(entry.Title),
			Summary:    stripHTML(entry.Summary),
			URL:        entry.Link.Href,
			RawContent: entry.Content,
		}
		if t, err := time.Parse(time.RFC3339, entry.Updated); err == nil {
			item.PublishedAt = &t
		}
		items = append(items, item)
	}
	return items
}

// Simple RSS 2.0 structs
type rssFeed struct {
	XMLName xml.Name   `xml:"rss"`
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
}

// Simple Atom structs
type atomFeed struct {
	XMLName xml.Name    `xml:"feed"`
	Entries []atomEntry `xml:"entry"`
}

type atomEntry struct {
	ID      string    `xml:"id"`
	Title   string    `xml:"title"`
	Updated string    `xml:"updated"`
	Summary string    `xml:"summary"`
	Content string    `xml:"content"`
	Link    atomLink  `xml:"link"`
}

type atomLink struct {
	Href string `xml:"href,attr"`
}

func stripHTML(s string) string {
	// Very basic HTML tag stripper for summaries
	out := s
	for {
		start := strings.Index(out, "<")
		if start == -1 {
			break
		}
		end := strings.Index(out[start:], ">")
		if end == -1 {
			break
		}
		out = out[:start] + " " + out[start+end+1:]
	}
	return strings.TrimSpace(out)
}
