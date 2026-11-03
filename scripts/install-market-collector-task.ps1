[CmdletBinding()]
param(
    [string]$NodePath,
    [switch]$DryRun,
    [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# No provider credentials are read by this installer. Node loads the private
# .env itself when the scheduled one-shot collector runs.
function ConvertTo-WindowsArgument {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)
    $escaped = [regex]::Replace($Value, '(\\*)"', '$1$1\"')
    $escaped = [regex]::Replace($escaped, '(\\+)$', '$1$1')
    return '"' + $escaped + '"'
}

function ConvertTo-PowerShellLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)
    return "'" + $Value.Replace("'", "''") + "'"
}

$repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workingDirectory = Join-Path $repository 'server\market-api'
$environmentFile = Join-Path $workingDirectory '.env'
$workerFile = Join-Path $workingDirectory 'supabase-collector.mjs'
$logDirectory = Join-Path $workingDirectory '.collector-logs'
$stdoutFile = Join-Path $logDirectory 'latest.stdout.log'
$stderrFile = Join-Path $logDirectory 'latest.stderr.log'
$taskName = 'LEGOFinder-SupabaseCollector'
$taskPath = '\'
$description = 'LEGO Finder Supabase collector; repository=' + $repository + '; version=1'
$actionId = 'LEGOFinder-SupabaseCollector-v1'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$currentUser = $identity.Name
$currentSid = $identity.User.Value

foreach ($requiredFile in @($environmentFile, $workerFile)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw 'Required collector source or private environment file is missing.'
    }
}

if (-not $NodePath) {
    $candidates = @()
    if ($env:USERPROFILE) {
        $candidates += Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    }
    $installedNode = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($installedNode) { $candidates += $installedNode.Source }
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $candidateVersion = (& $candidate --version 2>$null | Out-String).Trim()
            if ($candidateVersion -match '^v(\d+)\.\d+\.\d+$' -and [int]$Matches[1] -ge 24) {
                $NodePath = $candidate
                break
            }
        }
    }
}
if (-not $NodePath -or -not (Test-Path -LiteralPath $NodePath -PathType Leaf)) {
    throw 'Node.js 24 or newer is required; provide its executable with -NodePath.'
}
$NodePath = (Resolve-Path -LiteralPath $NodePath).ProviderPath
if ([IO.Path]::GetFileName($NodePath) -ine 'node.exe') { throw 'NodePath must identify node.exe.' }
$nodeVersion = (& $NodePath --version 2>$null | Out-String).Trim()
if ($nodeVersion -notmatch '^v(\d+)\.\d+\.\d+$' -or [int]$Matches[1] -lt 24) {
    throw 'The selected executable must be Node.js 24 or newer.'
}

$powerShellExecutable = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
if (-not (Test-Path -LiteralPath $powerShellExecutable -PathType Leaf)) {
    throw 'Windows PowerShell is required to launch the collector without a visible console.'
}
$nodeArguments = (@(('--env-file=' + $environmentFile), $workerFile, '--once') | ForEach-Object {
    ConvertTo-WindowsArgument -Value $_
}) -join ' '
$nodeLiteral = ConvertTo-PowerShellLiteral $NodePath
$argumentLiteral = ConvertTo-PowerShellLiteral $nodeArguments
$directoryLiteral = ConvertTo-PowerShellLiteral $workingDirectory
$stdoutLiteral = ConvertTo-PowerShellLiteral $stdoutFile
$stderrLiteral = ConvertTo-PowerShellLiteral $stderrFile

# This wrapper contains only fixed executable/source/log paths. It does not
# interpolate any value from .env. The latest two files are overwritten per run.
# --once is bounded by the worker lease; the wrapper also terminates its own
# child after 170 seconds, before the task's three-minute execution limit.
$wrapper = @"
`$ErrorActionPreference = 'Stop'
try {
    `$process = Start-Process -FilePath $nodeLiteral -ArgumentList $argumentLiteral -WorkingDirectory $directoryLiteral -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLiteral -RedirectStandardError $stderrLiteral
    `$null = `$process.Handle
    if (-not `$process.WaitForExit(170000)) {
        if (-not `$process.HasExited) { `$process.Kill(); `$process.WaitForExit() }
        exit 124
    }
    `$process.Refresh()
    exit `$process.ExitCode
} catch {
    [Console]::Error.WriteLine('Collector launch failed.')
    exit 1
}
"@
$encodedWrapper = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($wrapper))
$actionArguments = '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ' + $encodedWrapper

$metadata = [ordered]@{
    taskName = $taskName
    repository = $repository
    nodePath = $NodePath
    nodeVersion = $nodeVersion
    workingDirectory = $workingDirectory
    environmentFile = $environmentFile
    workerFile = $workerFile
    currentUser = $currentUser
    logonType = 'Interactive'
    runLevel = 'Limited'
    intervalSeconds = 60
    logonTrigger = $true
    maximumRunSeconds = 180
    multipleInstances = 'IgnoreNew'
    hidden = $true
    stdoutFile = $stdoutFile
    stderrFile = $stderrFile
    startRequested = [bool]$StartNow
    dryRun = [bool]$DryRun
}
if ($DryRun) {
    $metadata | ConvertTo-Json -Depth 3
    return
}

foreach ($command in @('Get-ScheduledTask', 'New-ScheduledTaskAction', 'New-ScheduledTaskTrigger',
    'New-ScheduledTaskPrincipal', 'New-ScheduledTaskSettingsSet', 'Register-ScheduledTask', 'Start-ScheduledTask')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw 'Windows ScheduledTasks support is unavailable.' }
}
$existing = $null
try { $existing = Get-ScheduledTask -TaskName $taskName -TaskPath $taskPath -ErrorAction Stop }
catch {
    if ($_.FullyQualifiedErrorId -notlike 'CmdletizationQuery_NotFound*') {
        throw 'The existing collector task could not be verified; no task was changed.'
    }
}
if ($existing) {
    $actions = @($existing.Actions)
    $principal = $existing.Principal
    $sameUser = $principal.UserId -eq $currentSid -or $principal.UserId -ieq $currentUser
    if ($existing.Description -cne $description -or $actions.Count -ne 1 -or
        $actions[0].Id -cne $actionId -or $actions[0].Execute -ine $powerShellExecutable -or
        $actions[0].Arguments -cne $actionArguments -or $actions[0].WorkingDirectory -ine $workingDirectory -or
        -not $sameUser -or [string]$principal.LogonType -ne 'Interactive') {
        throw 'A task with this name has a different owner or action; inspect it manually. No task was changed.'
    }
}

# Avoid redirecting logs through pre-existing junctions or symlink files.
foreach ($logPath in @($logDirectory, $stdoutFile, $stderrFile)) {
    if (Test-Path -LiteralPath $logPath) {
        $item = Get-Item -LiteralPath $logPath -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw 'Collector log paths must not be junctions or symbolic links.'
        }
    }
}
[IO.Directory]::CreateDirectory($logDirectory) | Out-Null
$action = New-ScheduledTaskAction -Execute $powerShellExecutable -Argument $actionArguments -WorkingDirectory $workingDirectory -Id $actionId
$triggers = @(
    (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval ([TimeSpan]::FromMinutes(1))),
    (New-ScheduledTaskTrigger -AtLogOn -User $currentUser)
)
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::FromMinutes(3)) -Hidden -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$registration = @{ TaskName = $taskName; TaskPath = $taskPath; Action = $action; Trigger = $triggers;
    Principal = $principal; Settings = $settings; Description = $description }
if ($existing) { $registration.Force = $true }
Register-ScheduledTask @registration | Out-Null
if ($StartNow) { Start-ScheduledTask -TaskName $taskName -TaskPath $taskPath }
$metadata | ConvertTo-Json -Depth 3
