// Package events provides a lightweight in-memory publish/subscribe event bus
// for broadcasting domain events (e.g. batch.activated) between internal services.
//
// Handlers are dispatched asynchronously in goroutines. Panics in handlers are
// recovered and logged so a misbehaving subscriber cannot crash the application.
package events

import (
	"log/slog"
	"sync"
)

// EventType identifies a domain event.
type EventType string

const (
	// BatchActivated fires after a batch transitions to ACTIVE status.
	// Subscribers: compliance engine runner, blockchain sync (future), email notifier (future).
	BatchActivated EventType = "batch.activated"
)

// Event is the carrier interface for all domain events.
type Event interface {
	Type() EventType
}

// BatchActivatedPayload carries context about a newly activated batch.
// The compliance engine subscriber uses BatchID and MarketRegion to run
// validation and then stores the resulting score and gaps back in the DB.
type BatchActivatedPayload struct {
	BatchID      string
	TenantID     string
	ProductType  string
	MarketRegion string
}

func (b *BatchActivatedPayload) Type() EventType { return BatchActivated }

// Handler is a function that processes a domain event.
// Handlers must be goroutine-safe and should not retain references to the event
// beyond their own execution.
type Handler func(event Event)

// Bus is a non-blocking, in-memory publish/subscribe event bus.
// Subscribe and Publish are safe for concurrent use.
type Bus struct {
	mu       sync.RWMutex
	handlers map[EventType][]Handler
}

// NewBus returns an initialised, empty event bus.
func NewBus() *Bus {
	return &Bus{handlers: make(map[EventType][]Handler)}
}

// Subscribe registers h as a handler for events of type t.
// Multiple handlers may be registered for the same event type;
// they are all invoked when an event of that type is published.
func (b *Bus) Subscribe(t EventType, h Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.handlers[t] = append(b.handlers[t], h)
}

// Publish dispatches e to all handlers registered for e.Type().
// Each handler runs in its own goroutine and cannot block the caller.
// Panics inside handlers are caught and logged.
func (b *Bus) Publish(e Event) {
	b.mu.RLock()
	handlers := make([]Handler, len(b.handlers[e.Type()]))
	copy(handlers, b.handlers[e.Type()])
	b.mu.RUnlock()

	for _, h := range handlers {
		h := h // capture for goroutine
		go func() {
			defer func() {
				if r := recover(); r != nil {
					slog.Error("event bus: handler panicked",
						"event_type", e.Type(),
						"panic", r,
					)
				}
			}()
			h(e)
		}()
	}
}
