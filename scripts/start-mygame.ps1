$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot\..

function Stop-PortListener([int]$Port) {
    & (Join-Path $PSScriptRoot 'kill-port.ps1') $Port
    $lines = netstat -ano | Select-String ":$Port\s" | Select-String 'LISTENING'
    foreach ($line in $lines) {
        $parts = ($line -replace '\s+', ' ').ToString().Trim().Split(' ')
        if ($parts.Length -ge 5) {
            $procId = [int]$parts[-1]
            if ($procId -gt 0) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host 'Node.js not found: https://nodejs.org/' -ForegroundColor Red
    Write-Host ''
    Read-Host 'Press Enter to exit'
    exit 1
}

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing npm packages...'
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Host 'npm install failed.' -ForegroundColor Red
        Write-Host ''
        Read-Host 'Press Enter to exit'
        exit 1
    }
}

Write-Host 'Stopping old service on port 3000...'
Stop-PortListener 3000
Start-Sleep -Seconds 2

Write-Host 'Starting MyGame... (Ctrl+R restart, Ctrl+C quit)'
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process 'http://localhost:3000/'
} | Out-Null

node scripts\run-server.js
$code = $LASTEXITCODE

Write-Host ''
if ($code -ne 0) {
    Write-Host "[ERROR] MyGame failed. Exit code: $code" -ForegroundColor Red
    Write-Host 'Port 3000 may be in use. Kill node.exe and retry.'
    Write-Host 'Logs: data\logs\'
} else {
    Write-Host 'MyGame stopped.'
}
Write-Host ''
Read-Host 'Press Enter to close'
