param(
    [string]$Action = "get",
    [double]$Value = 0
)

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(1500) | Out-Null
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
        $sessions = $sessionManager.GetSessions()
        if ($sessions.Count -gt 0) {
            $currentSession = $sessions[0]
        }
    }

    if (-not $currentSession) {
        Write-Output '{"status":"none"}'
        exit
    }

    # Execute control actions
    if ($Action -eq "toggle") {
        $playbackInfo = $currentSession.GetPlaybackInfo()
        if ($playbackInfo -and $playbackInfo.PlaybackStatus.ToString() -eq "Playing") {
            $currentSession.TryPauseAsync() | Out-Null
        } else {
            $currentSession.TryPlayAsync() | Out-Null
        }
    } elseif ($Action -eq "play") {
        $currentSession.TryPlayAsync() | Out-Null
    } elseif ($Action -eq "pause") {
        $currentSession.TryPauseAsync() | Out-Null
    } elseif ($Action -eq "next") {
        $currentSession.TrySkipNextAsync() | Out-Null
    } elseif ($Action -eq "prev") {
        $currentSession.TrySkipPreviousAsync() | Out-Null
    } elseif ($Action -eq "seek") {
        try {
            $ticks = [long]($Value * 10000000)
            $currentSession.TryChangePlaybackPositionAsync($ticks) | Out-Null
        } catch {}
    }

    # Fetch updated media metadata
    $mediaPropertiesTask = $currentSession.TryGetMediaPropertiesAsync()
    $mediaProperties = Await $mediaPropertiesTask ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])

    $playbackInfo = $currentSession.GetPlaybackInfo()
    $status = if ($playbackInfo) { $playbackInfo.PlaybackStatus.ToString() } else { "Unknown" }

    # Fetch playback timeline (Position and Duration)
    $tl = $currentSession.GetTimelineProperties()
    $pos = if ($tl) { [Math]::Round($tl.Position.TotalSeconds) } else { 0 }
    $dur = if ($tl) { [Math]::Round($tl.EndTime.TotalSeconds) } else { 0 }

    # Fetch thumbnail image
    $thumbB64 = ""
    if ($mediaProperties -and $mediaProperties.Thumbnail) {
        try {
            $stream = Await ($mediaProperties.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
            if ($stream) {
                $asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod("AsStreamForRead", [Type[]]@([Windows.Storage.Streams.IInputStream]))
                if ($asStreamMethod) {
                    $netStream = $asStreamMethod.Invoke($null, @($stream))
                    $mem = New-Object System.IO.MemoryStream
                    $netStream.CopyTo($mem)
                    $bytes = $mem.ToArray()
                    $cType = if ($stream.ContentType) { $stream.ContentType } else { "image/jpeg" }
                    $thumbB64 = "data:$cType;base64,$([Convert]::ToBase64String($bytes))"
                }
            }
        } catch {}
    }

    $result = [PSCustomObject]@{
        status    = $status
        app       = $currentSession.SourceAppUserModelId
        title     = if ($mediaProperties) { $mediaProperties.Title } else { "" }
        artist    = if ($mediaProperties) { $mediaProperties.Artist } else { "" }
        album     = if ($mediaProperties) { $mediaProperties.AlbumTitle } else { "" }
        position  = $pos
        duration  = $dur
        thumbnail = $thumbB64
    }

    $result | ConvertTo-Json -Compress
} catch {
    Write-Output '{"status":"none"}'
}
