$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$escapedRoot = [regex]::Escape($root)

$targets = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and
    $_.CommandLine -match $escapedRoot -and
    (
        $_.CommandLine -match "uvicorn app.main:app --reload --port 8000" -or
        $_.CommandLine -match "react-scripts start" -or
        $_.CommandLine -match "npm run dev"
    )
}

if (-not $targets) {
    Write-Host "No matching frontend/backend dev processes found."
    exit 0
}

$killed = 0
foreach ($proc in $targets) {
    try {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
        $killed++
    }
    catch {
    }
}

Write-Host "Stopped $killed process(es)."
