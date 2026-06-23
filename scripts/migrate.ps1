# PowerShell migration helper
# Usage: .\scripts\migrate.ps1 [up|down|version|verify|force]
# Uses the repo-native Go migration runner so it works against pooled Postgres connections.
# DB URL: reads from backend\.env (DATABASE_URL)

param(
    [ValidateSet("up", "down", "version", "verify", "force")]
    [string]$Action = "up",
    [int]$Version = -1
)

# Load DATABASE_URL from backend/.env
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*DATABASE_URL\s*=\s*(.+)$') {
            $env:DATABASE_URL = $Matches[1].Trim('"').Trim("'")
        }
    }
}

if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL not found. Set it in backend/.env"
    exit 1
}

switch ($Action) {
    "up" {
        Write-Host "Applying all pending migrations..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migration_runner up
        Pop-Location
    }
    "down" {
        Write-Host "Rolling back last migration..." -ForegroundColor Yellow
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migration_runner down
        Pop-Location
    }
    "version" {
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migration_runner version
        Pop-Location
    }
    "verify" {
        Write-Host "Running schema verification..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migrate
        Pop-Location
    }
    "force" {
        if ($Version -lt 0) {
            Write-Error "Provide -Version <n> when using force"
            exit 1
        }
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migration_runner force $Version
        Pop-Location
    }
}
