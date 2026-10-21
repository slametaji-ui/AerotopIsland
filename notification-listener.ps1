param(
    [uint32]$LastKnownId = 0
)

[Windows.UI.Notifications.Management.UserNotificationListener,Windows.UI.Notifications,ContentType=WindowsRuntime] | Out-Null
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(1200) | Out-Null
    return $netTask.Result
}

try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
    if (-not $listener) {
        Write-Output '{"hasNew":false}'
        exit
    }

    $notifs = Await ($listener.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast)) ([System.Collections.Generic.IReadOnlyList[Windows.UI.Notifications.UserNotification]])
    if (-not $notifs -or $notifs.Count -eq 0) {
        Write-Output '{"hasNew":false}'
        exit
    }

    $latest = $notifs[-1]
    if ($latest.Id -eq $LastKnownId) {
        Write-Output "{`"hasNew`":false,`"lastId`":$($latest.Id)}"
        exit
    }

    $appName = if ($latest.AppInfo -and $latest.AppInfo.DisplayInfo) { $latest.AppInfo.DisplayInfo.DisplayName } else { "Notification" }
    $title = ""
    $body = ""

    $binding = $latest.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
    if ($binding) {
        $texts = $binding.GetTextElements()
        if ($texts.Count -gt 0) { $title = $texts[0].Text }
        if ($texts.Count -gt 1) { $body = $texts[1].Text }
    }

    $result = [PSCustomObject]@{
        hasNew = $true
        id     = $latest.Id
        app    = $appName
        title  = $title
        body   = $body
    }

    $result | ConvertTo-Json -Compress
} catch {
    Write-Output '{"hasNew":false}'
}
