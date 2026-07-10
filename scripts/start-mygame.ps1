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

node scripts\check-node.js
if ($LASTEXITCODE -ne 0) {
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

Write-Host 'Building frontend...'
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'Frontend build failed.' -ForegroundColor Red
    Write-Host ''
    Read-Host 'Press Enter to exit'
    exit 1
}

$Port = [int](node (Join-Path $PSScriptRoot 'resolve-port.js'))
if ($Port -le 0) { $Port = 3000 }

Write-Host "Stopping old service on port $Port..."
Stop-PortListener $Port
Start-Sleep -Seconds 2

Write-Host 'Starting MyGame... (Ctrl+R restart, Ctrl+C quit)'
Start-Job -ScriptBlock {
    param($ListenPort)
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$ListenPort/"
} -ArgumentList $Port | Out-Null

node scripts\run-server.js
$code = $LASTEXITCODE

Write-Host ''
if ($code -ne 0) {
    Write-Host "[ERROR] MyGame failed. Exit code: $code" -ForegroundColor Red
    Write-Host 'Possible causes:'
    Write-Host '  - Node.js version too old (need 22.5+). Run: node -v'
    Write-Host '  - Port in use. Change port: set PORT in .env (e.g. PORT=3001).'
    Write-Host 'Logs: data\logs\'
} else {
    Write-Host 'MyGame stopped.'
}
Write-Host ''
Read-Host 'Press Enter to close'
