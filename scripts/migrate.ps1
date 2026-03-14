# PowerShell migration helper
# Usage: .\scripts\migrate.ps1 [up|down|version|verify]
# Requires: golang-migrate CLI installed
# DB URL: reads from backend\.env (DATABASE_URL)

param(
    [ValidateSet("up", "down", "version", "verify")]
    [string]$Action = "up"
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

# Resolve to absolute path and convert backslashes → forward slashes (golang-migrate parses as URI)
$migrationsPath = (Resolve-Path (Join-Path $PSScriptRoot "..\backend\internal\db\migrations")).Path -replace '\\', '/'

switch ($Action) {
    "up" {
        Write-Host "Applying all pending migrations..." -ForegroundColor Cyan
        migrate -path $migrationsPath -database $env:DATABASE_URL -verbose up
    }
    "down" {
        Write-Host "Rolling back last migration..." -ForegroundColor Yellow
        migrate -path $migrationsPath -database $env:DATABASE_URL -verbose down 1
    }
    "version" {
        migrate -path $migrationsPath -database $env:DATABASE_URL version
    }
    "verify" {
        Write-Host "Running schema verification..." -ForegroundColor Cyan
        Push-Location (Join-Path $PSScriptRoot "..\backend")
        go run ./cmd/migrate
        Pop-Location
    }
}
