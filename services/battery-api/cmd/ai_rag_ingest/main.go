package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/db"
	"github.com/anvayalabs/battery-api/internal/models"
	"github.com/anvayalabs/battery-api/internal/repository"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load(".env")
	godotenv.Load("../.env")
	godotenv.Load("../../.env")

	fmt.Println("=========================================================================")
	fmt.Println("              AI CORE REGULATORY RAG INGESTION TOOL                       ")
	fmt.Println("=========================================================================")

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "Error: DATABASE_URL is not set.")
		os.Exit(1)
	}

	geminiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if geminiKey == "" {
		fmt.Fprintln(os.Stderr, "Warning: GEMINI_API_KEY is not set. Ingesting will run in OFFLINE mock fallback mode.")
	}

	// Connect to database
	database, err := db.Connect(dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	repo := repository.New(database)
	gemini := ai.NewGeminiProvider(geminiKey, 30*time.Second)

	corpusDir := filepath.Join("internal", "regulatory", "corpus")
	files, err := os.ReadDir(corpusDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: Failed to read corpus directory: %v\n", err)
		os.Exit(1)
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".txt") {
			continue
		}

		filePath := filepath.Join(corpusDir, file.Name())
		fmt.Printf("\n[INGEST] Processing file: %s\n", file.Name())

		contentBytes, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Printf("  Error reading file: %v\n", err)
			continue
		}

		// Split file contents by frontmatter separator "---"
		blocks := strings.Split(string(contentBytes), "---")

		// With "---" delimiters at start and between sections:
		// block[0] is empty or prefix whitespace
		// block[i] (odd) is metadata
		// block[i+1] (even) is chunk content
		for i := 1; i < len(blocks)-1; i += 2 {
			metadataRaw := blocks[i]
			contentRaw := strings.TrimSpace(blocks[i+1])

			if contentRaw == "" {
				continue
			}

			// Parse metadata headers
			var title, source, section string
			lines := strings.Split(metadataRaw, "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				parts := strings.SplitN(line, ":", 2)
				if len(parts) < 2 {
					continue
				}
				key := strings.ToLower(strings.TrimSpace(parts[0]))
				val := strings.TrimSpace(parts[1])
				switch key {
				case "title":
					title = val
				case "source":
					source = val
				case "section":
					section = val
				}
			}

			if title == "" || source == "" || section == "" {
				fmt.Printf("  Warning: Skipping block due to missing metadata headers (Title=%q, Source=%q, Section=%q)\n", title, source, section)
				continue
			}

			// Chunk content to handle large regulations (~1000 chars, 200 char overlap)
			chunks := chunkText(contentRaw, 1000, 200)
			fmt.Printf("  -> Ingesting Section %q (%d chunks)\n", section, len(chunks))

			for idx, chunkStr := range chunks {
				// Get Embedding from Gemini
				emb, err := gemini.Embed(context.Background(), chunkStr)
				if err != nil {
					fmt.Printf("    [ERROR] Failed to fetch embedding for chunk %d: %v\n", idx+1, err)
					continue
				}

				modelChunk := &models.AIRegulationChunk{
					SourceDoc: source,
					Title:     title,
					Section:   section,
					Content:   chunkStr,
					Embedding: emb,
				}

				err = repo.SaveRegulationChunk(context.Background(), modelChunk)
				if err != nil {
					fmt.Printf("    [ERROR] Failed to save chunk %d to database: %v\n", idx+1, err)
					continue
				}
				fmt.Printf("    ✓ Chunk %d successfully saved\n", idx+1)
			}
		}
	}

	fmt.Println("\n=========================================================================")
	fmt.Println("              INGESTION COMPLETED SUCCESSFULLY                           ")
	fmt.Println("=========================================================================")
}

// chunkText splits text into segments of max chunkSize runes, overlapping by overlap runes.
func chunkText(text string, chunkSize, overlap int) []string {
	runes := []rune(text)
	if len(runes) <= chunkSize {
		return []string{text}
	}

	var chunks []string
	for i := 0; i < len(runes); {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
		if end == len(runes) {
			break
		}
		i += chunkSize - overlap
	}
	return chunks
}
