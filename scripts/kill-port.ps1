param(
  [int]$Port = 3000
)

$pids = @()
try {
  $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)
} catch {
  $pids = @()
}

if (-not $pids.Length) {
  $lines = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
  foreach ($line in $lines) {
    $parts = ($line -replace '\s+', ' ').ToString().Trim().Split(' ')
    if ($parts.Length -ge 5) {
      $pids += [int]$parts[-1]
    }
  }
  $pids = $pids | Select-Object -Unique
}

foreach ($procId in $pids) {
  if ($procId -gt 0) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}
