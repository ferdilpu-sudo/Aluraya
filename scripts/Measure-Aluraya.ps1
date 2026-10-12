param([Parameter(Mandatory = $true)][int]$RootProcessId)
$ErrorActionPreference = 'Stop'
$processes = @(Get-CimInstance Win32_Process)
if (-not ($processes | Where-Object ProcessId -eq $RootProcessId)) { throw 'Proses Aluraya tidak ditemukan.' }
$ids = [System.Collections.Generic.HashSet[int]]::new()
$null = $ids.Add($RootProcessId)
do {
    $previous = $ids.Count
    foreach ($process in $processes) {
        if ($ids.Contains([int]$process.ParentProcessId)) { $null = $ids.Add([int]$process.ProcessId) }
    }
} while ($ids.Count -gt $previous)
$members = @($processes | Where-Object { $ids.Contains([int]$_.ProcessId) })
$workingSet = ($members | Measure-Object -Property WorkingSetSize -Sum).Sum
$os = Get-CimInstance Win32_OperatingSystem
[pscustomobject]@{
    CheckedAt = (Get-Date).ToUniversalTime().ToString('o')
    ProcessCount = $members.Count
    WorkingSetSumMiB = [math]::Round($workingSet / 1MB, 2)
    AvailableMemoryMiB = [math]::Round($os.FreePhysicalMemory / 1024, 2)
    Note = 'Satu sampel; bukan peak/p95. Working set dapat menghitung halaman bersama lebih dari sekali.'
    Processes = @($members | Select-Object Name, ProcessId, ParentProcessId, WorkingSetSize)
} | ConvertTo-Json -Depth 4
