package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/regulatory"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	godotenv.Load("../.env")
	godotenv.Load("../../.env")

	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Usage: go run ./cmd/ai_rag_query \"<query string>\"")
		os.Exit(1)
	}
	queryStr := os.Args[1]

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "Error: DATABASE_URL is not set.")
		os.Exit(1)
	}

	geminiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if geminiKey == "" {
		fmt.Fprintln(os.Stderr, "Warning: GEMINI_API_KEY is not set. Querying will run in OFFLINE mock fallback mode.")
	}

	database, err := db.Connect(dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	repo := repository.New(database)
	gemini := ai.NewGeminiProvider(geminiKey, 30*time.Second)

	fmt.Println("=========================================================================")
	fmt.Printf("Querying regulations for: %q\n", queryStr)
	fmt.Println("=========================================================================")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	chunks, err := regulatory.QueryRegulations(ctx, gemini, repo, queryStr, 3)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error performing search: %v\n", err)
		os.Exit(1)
	}

	if len(chunks) == 0 {
		fmt.Println("No matching legislative chunks found.")
		return
	}

	for idx, chunk := range chunks {
		fmt.Printf("\n[%d] Citation: %s (Section: %s)\n", idx+1, chunk.Title, chunk.Section)
		fmt.Printf("    Source: %s\n", chunk.SourceDoc)
		fmt.Printf("    Content:\n%s\n", indentText(chunk.Content, "    "))
		fmt.Println("-------------------------------------------------------------------------")
	}
}

func indentText(text, indent string) string {
	lines := strings.Split(text, "\n")
	for i, line := range lines {
		lines[i] = indent + line
	}
	return strings.Join(lines, "\n")
}
