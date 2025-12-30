$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Say hello" }
            )
        }
    )
} | ConvertTo-Json -Depth 5

$key = "AIzaSyD8_qypza4q93e-hjgs6PKzr9islTLrSjo"
$uri = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$key"

Write-Host "Testing API key: $($key.Substring(0,10))..."

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "SUCCESS: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody"
}
