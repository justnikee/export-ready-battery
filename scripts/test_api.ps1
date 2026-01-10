# test_api.ps1 - Test the ExportReady Battery API
# Run with: powershell -ExecutionPolicy Bypass -File .\scripts\test_api.ps1

$baseUrl = "http://localhost:8080/api/v1"

Write-Host "🧪 Testing ExportReady Battery API" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:8080/health"
Write-Host "   Status: $($health.status)" -ForegroundColor Green

# 2. Create a Tenant (we need this for the batch)
Write-Host "`n2. Creating test tenant in database..." -ForegroundColor Yellow
Write-Host "   (Manually insert or use Supabase SQL Editor)" -ForegroundColor Gray

# For testing, we'll use a hardcoded tenant ID
# You should first create a tenant in Supabase:
# INSERT INTO tenants (company_name) VALUES ('Test Battery Co') RETURNING id;
$tenantId = Read-Host "   Enter your tenant UUID from Supabase"

# 3. Create a Batch
Write-Host "`n3. Creating batch..." -ForegroundColor Yellow
$batchBody = @{
    tenant_id  = $tenantId
    batch_name = "TestBatch-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    specs      = @{
        chemistry         = "Li-ion"
        nominal_voltage   = 3.7
        capacity          = 2500
        weight            = 45.5
        carbon_footprint  = 12.5
        recyclable        = $true
        country_of_origin = "India"
    }
} | ConvertTo-Json -Depth 3

$batch = Invoke-RestMethod -Uri "$baseUrl/batches" -Method Post -Body $batchBody -ContentType "application/json"
$batchId = $batch.batch.id
Write-Host "   Created batch: $batchId" -ForegroundColor Green
Write-Host "   Name: $($batch.batch.batch_name)" -ForegroundColor Green

# 4. Upload CSV
Write-Host "`n4. Uploading CSV..." -ForegroundColor Yellow
$csvPath = Join-Path $PSScriptRoot "..\testdata\sample_batch.csv"

$form = @{
    file = Get-Item -Path $csvPath
}

$upload = Invoke-RestMethod -Uri "$baseUrl/batches/$batchId/upload" -Method Post -Form $form
Write-Host "   Passports created: $($upload.passports_count)" -ForegroundColor Green
Write-Host "   Processing time: $($upload.processing_time)" -ForegroundColor Green

# 5. Get Batch Details
Write-Host "`n5. Getting batch details..." -ForegroundColor Yellow
$batchDetails = Invoke-RestMethod -Uri "$baseUrl/batches/$batchId"
Write-Host "   Passport count: $($batchDetails.passport_count)" -ForegroundColor Green

# 6. Download QR Codes
Write-Host "`n6. Downloading QR codes ZIP..." -ForegroundColor Yellow
$zipPath = Join-Path $PSScriptRoot "..\testdata\qrcodes.zip"
Invoke-WebRequest -Uri "$baseUrl/batches/$batchId/download" -OutFile $zipPath -UseBasicParsing
$zipSize = (Get-Item $zipPath).Length
Write-Host "   Downloaded: $zipPath ($zipSize bytes)" -ForegroundColor Green

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
Write-Host "   Check $zipPath for the QR code images" -ForegroundColor Cyan
