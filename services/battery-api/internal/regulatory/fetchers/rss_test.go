package fetchers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const sampleRSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<item>
<title>Sample Item</title>
<link>https://example.com/item-1</link>
<description>Sample description</description>
<pubDate>Mon, 02 Jan 2006 15:04:05 GMT</pubDate>
</item>
</channel></rss>`

func newTestSource(url string) *models.RegulatorySource {
	return &models.RegulatorySource{URL: url}
}

func TestRSSFetcher_Fetch_200OK(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(sampleRSS))
	}))
	defer srv.Close()

	f := NewRSSFetcher()
	items, err := f.Fetch(context.Background(), newTestSource(srv.URL))
	require.NoError(t, err)
	require.Len(t, items, 1)
	assert.Equal(t, "Sample Item", items[0].Title)
}

func TestRSSFetcher_Fetch_202AcceptedWithBody(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte(sampleRSS))
	}))
	defer srv.Close()

	f := NewRSSFetcher()
	items, err := f.Fetch(context.Background(), newTestSource(srv.URL))
	require.NoError(t, err)
	require.Len(t, items, 1)
	assert.Equal(t, "Sample Item", items[0].Title)
}

func TestRSSFetcher_Fetch_304NotModified(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotModified)
	}))
	defer srv.Close()

	f := NewRSSFetcher()
	items, err := f.Fetch(context.Background(), newTestSource(srv.URL))
	require.NoError(t, err)
	assert.Nil(t, items)
}

func TestRSSFetcher_Fetch_500ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer srv.Close()

	f := NewRSSFetcher()
	items, err := f.Fetch(context.Background(), newTestSource(srv.URL))
	assert.Error(t, err)
	assert.Nil(t, items)
}
