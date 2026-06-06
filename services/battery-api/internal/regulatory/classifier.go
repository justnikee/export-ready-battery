package regulatory

import (
	"regexp"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/models"
)

// Classifier performs rule-based NLP tagging on regulatory items.
type Classifier struct {
	productRules  []classificationRule
	regionRules   []classificationRule
	urgencyRules  []classificationRule
	deadlineRegex *regexp.Regexp
}

type classificationRule struct {
	keywords []string
	value    string
}

// NewClassifier builds the rule engine.
func NewClassifier() *Classifier {
	return &Classifier{
		productRules: []classificationRule{
			{[]string{"battery", "cell", "lithium", "cobalt", "nickel", "ev", "portable", "industrial"}, "BATTERY"},
			{[]string{"textile", "fabric", "garment", "apparel", "fibre", "yarn", "clothing"}, "TEXTILE"},
		},
		regionRules: []classificationRule{
			{[]string{"eu", "european", "2023/1542", "battery passport", "ce mark", "nando"}, "EU"},
			{[]string{"india", "bis", "moef", "cpcb", "dgft", "epr", "pli", "make in india"}, "INDIA"},
		},
		urgencyRules: []classificationRule{
			{[]string{"deadline", "by", "before", "must", "shall", "mandatory", "enforceable", "enters into force"}, "high"},
			{[]string{"draft", "consultation", "proposed", "seeking comment"}, "normal"},
			{[]string{"urgent", "immediate", "emergency", "critical"}, "critical"},
		},
		deadlineRegex: regexp.MustCompile(`(?i)\b(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b`),
	}
}

// Classify mutates the item with product_type, market_region, urgency, tags, and deadline.
func (c *Classifier) Classify(item *models.RegulatoryItem) {
	text := strings.ToLower(item.Title + " " + item.Summary + " " + item.RawContent)

	// Product type
	item.ProductType = c.matchRule(c.productRules, text)
	if item.ProductType == "" {
		item.ProductType = "GENERAL"
	}

	// Market region
	item.MarketRegion = c.matchRule(c.regionRules, text)
	if item.MarketRegion == "" {
		item.MarketRegion = "GLOBAL"
	}

	// Urgency
	item.Urgency = c.matchRule(c.urgencyRules, text)
	if item.Urgency == "" {
		item.Urgency = "normal"
	}

	// Tags
	item.Tags = c.extractTags(text)

	// Deadline extraction
	if m := c.deadlineRegex.FindStringSubmatch(item.Title + " " + item.Summary); len(m) > 1 {
		if t, err := time.Parse("2 January 2006", m[1]); err == nil {
			item.Deadline = &t
		} else if t, err := time.Parse("2 January 2006", m[1]); err == nil {
			item.Deadline = &t
		}
	}

	now := time.Now()
	item.ClassifiedAt = &now
}

func (c *Classifier) matchRule(rules []classificationRule, text string) string {
	for _, rule := range rules {
		for _, kw := range rule.keywords {
			if strings.Contains(text, kw) {
				return rule.value
			}
		}
	}
	return ""
}

func (c *Classifier) extractTags(text string) []string {
	tagMap := map[string]string{
		"battery": "battery", "lithium": "lithium", "cobalt": "cobalt",
		"textile": "textile", "fabric": "fabric",
		"epc": "epc", "carbon": "carbon", "recycling": "recycling",
		"due diligence": "due-diligence", "supply chain": "supply-chain",
		"svhc": "svhc", "reach": "reach", "rohs": "rohs",
		"bis": "bis", "cpcb": "cpcb", "dgft": "dgft",
	}
	var tags []string
	seen := make(map[string]bool)
	for phrase, tag := range tagMap {
		if strings.Contains(text, phrase) && !seen[tag] {
			tags = append(tags, tag)
			seen[tag] = true
		}
	}
	return tags
}
