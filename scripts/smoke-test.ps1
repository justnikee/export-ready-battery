# Production Smoke Test Script
# Validates critical API endpoints and basic health after deployment
# Run with: .\scripts\smoke-test.ps1 -BaseUrl "https://api.anvayalabs.com"

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$FrontendUrl = "http://localhost:3000",
    [int]$TimeoutSeconds = 30,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatus = 200,
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = $TimeoutSeconds
            ErrorAction = "Stop"
        }
        if ($Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = $Body
        }

        if ($Verbose) {
            Write-Host "  [VERBOSE] $Method $Url" -ForegroundColor DarkGray
        }

        $response = Invoke-WebRequest @params
        $stopwatch.Stop()
        $elapsedMs = $stopwatch.ElapsedMilliseconds

        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  PASS $Name ($($response.StatusCode)) ${elapsedMs}ms" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  FAIL $Name (expected $ExpectedStatus, got $($response.StatusCode)) ${elapsedMs}ms" -ForegroundColor Red
            $script:failed++
        }

        if ($Verbose -and $response.Content) {
            $preview = ($response.Content | Out-String).Trim()
            if ($preview.Length -gt 300) { $preview = $preview.Substring(0, 300) + "..." }
            Write-Host "  [VERBOSE] Body: $preview" -ForegroundColor DarkGray
        }
    } catch {
        $stopwatch.Stop()
        $elapsedMs = $stopwatch.ElapsedMilliseconds

        # Handle expected error responses (e.g., 401, 400)
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        if ($statusCode -and ($statusCode -eq $ExpectedStatus)) {
            Write-Host "  PASS $Name ($statusCode) ${elapsedMs}ms" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  FAIL $Name ($($_.Exception.Message)) ${elapsedMs}ms" -ForegroundColor Red
            if ($Verbose -and $_.ErrorDetails.Message) {
                Write-Host "  [VERBOSE] ErrorDetails: $($_.ErrorDetails.Message)" -ForegroundColor DarkGray
            }
            $script:failed++
        }
    }
}

function Test-JsonField {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Field,
        [string]$ExpectedValue
    )

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        if ($Verbose) {
            Write-Host "  [VERBOSE] GET $Url" -ForegroundColor DarkGray
        }

        $response = Invoke-WebRequest -Uri $Url -Method "GET" -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        $stopwatch.Stop()
        $elapsedMs = $stopwatch.ElapsedMilliseconds
        $json = $response.Content | ConvertFrom-Json
        $actualValue = $json.$Field

        if ($response.StatusCode -eq 200 -and $actualValue -eq $ExpectedValue) {
            Write-Host "  PASS $Name (200, $Field=$actualValue) ${elapsedMs}ms" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  FAIL $Name (expected $Field='$ExpectedValue', got '$actualValue') ${elapsedMs}ms" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        $stopwatch.Stop()
        $elapsedMs = $stopwatch.ElapsedMilliseconds
        Write-Host "  FAIL $Name ($($_.Exception.Message)) ${elapsedMs}ms" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "`n=== AnvayaLabs Production Smoke Tests ===" -ForegroundColor Cyan
Write-Host "Backend: $BaseUrl"
Write-Host "Frontend: $FrontendUrl"
Write-Host ""

# 1. Health / root endpoints
Write-Host "--- Health Checks ---" -ForegroundColor Yellow
Test-Endpoint -Name "API Root" -Url "$BaseUrl/api/v1" -ExpectedStatus 404
Test-JsonField -Name "API Health JSON" -Url "$BaseUrl/health" -Field "status" -ExpectedValue "healthy"
Test-Endpoint -Name "Frontend Root" -Url $FrontendUrl

# 2. Public endpoints (no auth)
Write-Host "`n--- Public Endpoints ---" -ForegroundColor Yellow
Test-Endpoint -Name "Battery Login Page" -Url "$FrontendUrl/battery/login"
Test-Endpoint -Name "Textile Login Page" -Url "$FrontendUrl/textile/login"
Test-Endpoint -Name "Public Passport (sample)" -Url "$BaseUrl/api/v1/passports/00000000-0000-0000-0000-000000000000" -ExpectedStatus 404

# 3. Auth endpoints (no auth required, but validate structure)
Write-Host "`n--- Auth Endpoints ---" -ForegroundColor Yellow
Test-Endpoint -Name "Register endpoint (OPTIONS)" -Url "$BaseUrl/api/v1/auth/register" -Method "OPTIONS" -ExpectedStatus 405
Test-Endpoint -Name "Register invalid body" -Url "$BaseUrl/api/v1/auth/register" -Method "POST" -ExpectedStatus 400 -Body '{"email":"not-an-email","password":"123"}'
Test-Endpoint -Name "Login wrong password" -Url "$BaseUrl/api/v1/auth/login" -Method "POST" -ExpectedStatus 401 -Body '{"email":"test@example.com","password":"wrongpassword"}'

# 4. Protected endpoints (should 401 without auth)
Write-Host "`n--- Protected Endpoints (expect 401) ---" -ForegroundColor Yellow
Test-Endpoint -Name "Dashboard stats (no auth)" -Url "$BaseUrl/api/v1/dashboard/stats?tenant_id=00000000-0000-0000-0000-000000000000" -ExpectedStatus 401
Test-Endpoint -Name "List batches (no auth)" -Url "$BaseUrl/api/v1/batches?tenant_id=00000000-0000-0000-0000-000000000000" -ExpectedStatus 401
Test-Endpoint -Name "Create batch (no auth)" -Url "$BaseUrl/api/v1/batches" -Method "POST" -ExpectedStatus 401

# 5. Static assets
Write-Host "`n--- Static Assets ---" -ForegroundColor Yellow
Test-Endpoint -Name "Favicon" -Url "$FrontendUrl/favicon.ico" -ExpectedStatus 200

Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -gt 0) {
    Write-Host "`nSMOKE TEST FAILED" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nSMOKE TEST PASSED" -ForegroundColor Green
    exit 0
}
