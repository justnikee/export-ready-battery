package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

type migrationFile struct {
	Version int
	Name    string
	Path    string
	Kind    string
}

func main() {
	flag.Parse()
	action := "up"
	if flag.NArg() > 0 {
		action = strings.ToLower(flag.Arg(0))
	}

	if err := godotenv.Overload(); err != nil {
		fmt.Fprintln(os.Stderr, "failed to load .env:", err)
		os.Exit(1)
	}

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL not set")
		os.Exit(1)
	}

	migrationsPath := filepath.Join("internal", "db", "migrations")
	files, err := discoverMigrationFiles(migrationsPath)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		fmt.Fprintln(os.Stderr, "parse database URL:", err)
		os.Exit(1)
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		fmt.Fprintln(os.Stderr, "connect:", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	if _, err := conn.Exec(ctx, "SET search_path TO public"); err != nil {
		fmt.Fprintln(os.Stderr, "set search_path:", err)
		os.Exit(1)
	}

	if err := ensureSchemaMigrationsTable(ctx, conn); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	version, dirty, err := currentVersion(ctx, conn)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	switch action {
	case "up":
		if dirty {
			fmt.Fprintf(os.Stderr, "schema_migrations is dirty at version %d; run force before applying new migrations\n", version)
			os.Exit(1)
		}
		applied, err := applyUpMigrations(ctx, conn, files, version)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		if len(applied) == 0 {
			fmt.Println("No pending migrations")
			return
		}
		for _, file := range applied {
			fmt.Printf("Applied %04d %s\n", file.Version, file.Name)
		}
	case "down":
		if dirty {
			fmt.Fprintf(os.Stderr, "schema_migrations is dirty at version %d; run force before rollback\n", version)
			os.Exit(1)
		}
		rolledBack, err := applyDownMigration(ctx, conn, files, version)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		fmt.Printf("Rolled back %04d %s\n", rolledBack.Version, rolledBack.Name)
	case "version":
		status := "clean"
		if dirty {
			status = "dirty"
		}
		fmt.Printf("%d (%s)\n", version, status)
	case "force":
		if flag.NArg() < 2 {
			fmt.Fprintln(os.Stderr, "usage: go run ./cmd/migration_runner force <version>")
			os.Exit(1)
		}
		forcedVersion, convErr := strconv.Atoi(flag.Arg(1))
		if convErr != nil || forcedVersion < 0 {
			fmt.Fprintln(os.Stderr, "force version must be a non-negative integer")
			os.Exit(1)
		}
		if err := setVersion(ctx, conn, forcedVersion, false); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		fmt.Printf("Forced schema_migrations to %d (clean)\n", forcedVersion)
	default:
		fmt.Fprintln(os.Stderr, "unknown action:", action)
		os.Exit(1)
	}
}

func discoverMigrationFiles(root string) ([]migrationFile, error) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, fmt.Errorf("read migrations directory: %w", err)
	}

	files := make([]migrationFile, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".up.sql") && !strings.HasSuffix(name, ".down.sql") {
			continue
		}
		baseName := strings.TrimSuffix(strings.TrimSuffix(name, ".sql"), ".up")
		baseName = strings.TrimSuffix(baseName, ".down")
		underscore := strings.Index(baseName, "_")
		if underscore <= 0 {
			continue
		}
		version, convErr := strconv.Atoi(baseName[:underscore])
		if convErr != nil {
			continue
		}
		kind := "up"
		if strings.HasSuffix(name, ".down.sql") {
			kind = "down"
		}
		if kind != "up" && kind != "down" {
			continue
		}
		files = append(files, migrationFile{
			Version: version,
			Name:    name,
			Path:    filepath.Join(root, name),
			Kind:    kind,
		})
	}

	sort.Slice(files, func(i, j int) bool {
		if files[i].Version == files[j].Version {
			return files[i].Kind < files[j].Kind
		}
		return files[i].Version < files[j].Version
	})

	return files, nil
}

func ensureSchemaMigrationsTable(ctx context.Context, conn *pgx.Conn) error {
	_, err := conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS public.schema_migrations (
			version BIGINT NOT NULL PRIMARY KEY,
			dirty BOOLEAN NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("ensure schema_migrations table: %w", err)
	}
	return nil
}

func currentVersion(ctx context.Context, conn *pgx.Conn) (int, bool, error) {
	var version int
	var dirty bool
	err := conn.QueryRow(ctx, `SELECT version, dirty FROM public.schema_migrations LIMIT 1`).Scan(&version, &dirty)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, false, nil
		}
		return 0, false, fmt.Errorf("read schema_migrations: %w", err)
	}
	return version, dirty, nil
}

func setVersion(ctx context.Context, conn *pgx.Conn, version int, dirty bool) error {
	_, err := conn.Exec(ctx, `TRUNCATE public.schema_migrations`)
	if err != nil {
		return fmt.Errorf("truncate schema_migrations: %w", err)
	}
	if version == 0 && !dirty {
		return nil
	}
	_, err = conn.Exec(ctx, `INSERT INTO public.schema_migrations (version, dirty) VALUES ($1, $2)`, version, dirty)
	if err != nil {
		return fmt.Errorf("write schema_migrations: %w", err)
	}
	return nil
}

func applyUpMigrations(ctx context.Context, conn *pgx.Conn, files []migrationFile, current int) ([]migrationFile, error) {
	upFiles := filterMigrations(files, "up")
	applied := make([]migrationFile, 0)
	for _, file := range upFiles {
		if file.Version <= current {
			continue
		}
		if err := setVersion(ctx, conn, file.Version, true); err != nil {
			return applied, err
		}
		if err := executeSQLFile(ctx, conn, file.Path); err != nil {
			return applied, fmt.Errorf("apply migration %s: %w", file.Name, err)
		}
		if err := setVersion(ctx, conn, file.Version, false); err != nil {
			return applied, err
		}
		applied = append(applied, file)
	}
	return applied, nil
}

func applyDownMigration(ctx context.Context, conn *pgx.Conn, files []migrationFile, current int) (migrationFile, error) {
	if current == 0 {
		return migrationFile{}, fmt.Errorf("no applied migrations to roll back")
	}

	downFiles := filterMigrations(files, "down")
	var target migrationFile
	found := false
	for _, file := range downFiles {
		if file.Version == current {
			target = file
			found = true
			break
		}
	}
	if !found {
		return migrationFile{}, fmt.Errorf("no down migration found for version %d", current)
	}

	if err := setVersion(ctx, conn, current, true); err != nil {
		return migrationFile{}, err
	}
	if err := executeSQLFile(ctx, conn, target.Path); err != nil {
		return migrationFile{}, fmt.Errorf("rollback migration %s: %w", target.Name, err)
	}
	nextVersion := previousVersion(filterMigrations(files, "up"), current)
	if err := setVersion(ctx, conn, nextVersion, false); err != nil {
		return migrationFile{}, err
	}

	return target, nil
}

func filterMigrations(files []migrationFile, kind string) []migrationFile {
	filtered := make([]migrationFile, 0)
	for _, file := range files {
		if file.Kind == kind {
			filtered = append(filtered, file)
		}
	}
	return filtered
}

func previousVersion(files []migrationFile, current int) int {
	previous := 0
	for _, file := range files {
		if file.Version >= current {
			break
		}
		previous = file.Version
	}
	return previous
}

func executeSQLFile(ctx context.Context, conn *pgx.Conn, path string) error {
	content, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return fmt.Errorf("missing file %s", path)
		}
		return err
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}