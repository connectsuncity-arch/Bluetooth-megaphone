# AeroVox PowerShell Static File Web Server
$port = 8000
$currentDir = Get-Location

# Create HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host " AeroVox Local Web Server Running!" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "Open this URL in your web browser:" -ForegroundColor Yellow
    Write-Host "--> http://localhost:$port/ <--" -ForegroundColor White -NoNewline
    Write-Host " (Ctrl+Click to open)" -ForegroundColor DarkGray
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "Keep this window open while using the app."
    Write-Host "Press Ctrl+C in this console to stop the server."
    Write-Host ""
} catch {
    Write-Host "ERROR: Could not start listener on port $port." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Exit 1
}

# Run the server loop
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }
        
        # Clean path and join with base directory
        $cleanPath = $urlPath.Replace("/", "\").TrimStart("\")
        $filePath = Join-Path $currentDir $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content Type Mapping
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".svg" { "image/svg+xml" }
                ".png" { "image/png" }
                ".jpg" { "image/jpeg" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Catch connection aborts and other minor exceptions during request processing
    }
}
