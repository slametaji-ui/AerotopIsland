[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

try {
    $sessionManager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

    if (-not $sessionManager) {
        Write-Output '{"status":"none"}'
        exit
    }

    $currentSession = $sessionManager.GetCurrentSession()

    if (-not $currentSession) {
        # Check all sessions
        $sessions = $sessionManager.GetSessions()
        if ($sessions.Count -gt 0) {
            $currentSession = $sessions[0]
        }
    }

    if (-not $currentSession) {
        Write-Output '{"status":"none"}'
        exit
    }

    $mediaPropertiesTask = $currentSession.TryGetMediaPropertiesAsync()
    $mediaProperties = Await $mediaPropertiesTask ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])

    $playbackInfo = $currentSession.GetPlaybackInfo()
    $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

    $result = [PSCustomObject]@{
        status = $status
        app    = $currentSession.SourceAppUserModelId
        title  = if ($mediaProperties) { $mediaProperties.Title } else { "" }
        artist = if ($mediaProperties) { $mediaProperties.Artist } else { "" }
        album  = if ($mediaProperties) { $mediaProperties.AlbumTitle } else { "" }
    }

    $result | ConvertTo-Json -Compress
} catch {
    Write-Output '{"status":"none"}'
}
