# Cinematic Studio - Automated Startup Sequence
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  CINEMATIC STUDIO : AUTOMATED STARTUP SEQUENCE" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# [1/3] Path Initialization
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

# [2/3] Verification
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found in $PSScriptRoot" -ForegroundColor Red
    pause
    exit
}

# [3/3] Launch
Write-Host "[Launch] Activating HTTPS and Starting Modality Nexus..." -ForegroundColor Green
Write-Host "The studio will open at https://localhost:3000/studio" -ForegroundColor Gray

# Open browser in 3 seconds
Start-Sleep -Seconds 3
Start-Process "https://localhost:3000/studio"

# Execute dev command
npm.cmd run dev
