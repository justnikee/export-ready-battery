# migrate.ps1 - Database migration helper for PowerShell
# Usage: .\scripts\migrate.ps1 up|down|version|reset

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("up", "down", "version", "reset")]
    [string]$Action
)

# Load .env file
$envFile = Join-Path $PSScriptRoot "..\\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim())
        }
    }
}
else {
    Write-Error ".env file not found!"
    exit 1
}

$databaseUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $databaseUrl) {
    Write-Error "DATABASE_URL not set in .env file!"
    exit 1
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$migrationsPath = "file://$projectRoot/migrations"
$migrationsPath = $migrationsPath -replace "\\", "/"

Write-Host "Running migration: $Action" -ForegroundColor Cyan
Write-Host "Migrations path: $migrationsPath" -ForegroundColor Gray

switch ($Action) {
    "up" {
        migrate -path $migrationsPath -database $databaseUrl -verbose up
    }
    "down" {
        migrate -path $migrationsPath -database $databaseUrl -verbose down 1
    }
    "version" {
        migrate -path $migrationsPath -database $databaseUrl version
    }
    "reset" {
        Write-Host "WARNING: This will drop ALL tables!" -ForegroundColor Red
        $confirm = Read-Host "Type 'yes' to confirm"
        if ($confirm -eq "yes") {
            migrate -path $migrationsPath -database $databaseUrl -verbose down -all
        }
        else {
            Write-Host "Aborted."
        }
    }
}
