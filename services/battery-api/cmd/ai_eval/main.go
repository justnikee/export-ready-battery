package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/anvayalabs/battery-api/internal/ai"
	"github.com/anvayalabs/battery-api/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../../.env")
	godotenv.Load("../.env")
	godotenv.Load(".env")

	fmt.Println("=========================================================================")
	fmt.Println("              AI CORE EVAL HARNESS - LIVE PROVIDERS TEST                  ")
	fmt.Println("=========================================================================")

	aiCfg := ai.Load()
	if aiCfg.GroqAPIKey == "" && aiCfg.GeminiAPIKey == "" {
		fmt.Fprintln(os.Stderr, "Error: Both GROQ_API_KEY and GEMINI_API_KEY are empty. Please configure at least one live provider in your environment.")
		os.Exit(1)
	}

	fmt.Printf("Configured Providers: %v\n", aiCfg.Providers)
	if aiCfg.GroqAPIKey != "" {
		fmt.Println("- Groq: Configured")
	}
	if aiCfg.GeminiAPIKey != "" {
		fmt.Println("- Gemini: Configured")
	}
	fmt.Println("=========================================================================")

	gw := ai.NewGateway(aiCfg)
	svc := services.NewAIService(gw, nil) // no repository needed for eval runner

	goldenDir := filepath.Join("internal", "services", "testdata", "golden")
	files, err := os.ReadDir(goldenDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: Failed to read golden directory: %v\n", err)
		os.Exit(1)
	}

	var totalFields, correctFields int
	var totalDuration time.Duration
	var processedCount int

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".txt") {
			continue
		}

		base := strings.TrimSuffix(file.Name(), ".txt")
		txtPath := filepath.Join(goldenDir, file.Name())
		jsonPath := filepath.Join(goldenDir, base+".expected.json")

		txtContent, err := os.ReadFile(txtPath)
		if err != nil {
			fmt.Printf("Error: Failed to read %s: %v\n", txtPath, err)
			continue
		}

		expectedBytes, err := os.ReadFile(jsonPath)
		if err != nil {
			fmt.Printf("Error: Failed to read expected json %s: %v\n", jsonPath, err)
			continue
		}

		var expected map[string]interface{}
		if err := json.Unmarshal(expectedBytes, &expected); err != nil {
			fmt.Printf("Error: Failed to unmarshal expected json %s: %v\n", jsonPath, err)
			continue
		}

		fmt.Printf("\n[TEST] Running evaluation for: %s.txt\n", base)
		start := time.Now()
		res, err := svc.ParseDatasheet(context.Background(), string(txtContent))
		duration := time.Since(start)
		totalDuration += duration
		processedCount++

		if err != nil {
			fmt.Printf("  -> FAILURE: %v\n", err)
			continue
		}

		fmt.Printf("  -> Method: %s | Provider: %s | Model: %s | Latency: %v\n", res.Method, res.Method, "llm-provider", duration)

		// Compare parsed fields
		resBytes, _ := json.Marshal(res)
		var actual map[string]interface{}
		json.Unmarshal(resBytes, &actual)

		fmt.Println("  Field Comparisons:")
		for k, expVal := range expected {
			// skip noise fields
			if k == "method" || k == "confidence" || k == "processing_time_ms" || k == "field_sources" || k == "created_at" {
				continue
			}

			actVal := actual[k]
			totalFields++

			// Normalize nil arrays/values
			if expVal == nil {
				expVal = ""
			}
			if actVal == nil {
				actVal = ""
			}

			// Convert slice/array comparisons
			expStr := fmt.Sprintf("%v", expVal)
			actStr := fmt.Sprintf("%v", actVal)

			if expStr == actStr {
				correctFields++
				fmt.Printf("    %-25s : ✓ Matches (%q)\n", k, actStr)
			} else {
				fmt.Printf("    %-25s : ✗ MISMATCH (expected %q, got %q)\n", k, expStr, actStr)
			}
		}
	}

	if processedCount == 0 {
		fmt.Println("\nNo golden set files found to evaluate.")
		return
	}

	accuracy := 0.0
	if totalFields > 0 {
		accuracy = float64(correctFields) / float64(totalFields) * 100
	}

	fmt.Println("\n=========================================================================")
	fmt.Println("                           EVALUATION SUMMARY                            ")
	fmt.Println("=========================================================================")
	fmt.Printf("Processed Files:   %d\n", processedCount)
	fmt.Printf("Total Fields:      %d\n", totalFields)
	fmt.Printf("Correct Fields:    %d\n", correctFields)
	fmt.Printf("Overall Accuracy:  %.2f%%\n", accuracy)
	fmt.Printf("Average Latency:   %v\n", totalDuration/time.Duration(processedCount))
	fmt.Println("=========================================================================")
}
