$indexPath = "index.html"
$farmkartImg = "C:\Users\ACB\.gemini\antigravity\brain\6c3d3423-2250-40cc-9edd-67f208d64b68\media__1776069776405.png"

# 1. Convert image to base64
$bytes = [IO.File]::ReadAllBytes($farmkartImg)
$base64 = [Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64,$base64"

# 2. Read index.html content
$content = Get-Content $indexPath -Raw

# 3. Use regex to update only the FARMKART seal property
# Look for 'FARMKART': { ... seal: '...'
$regex = "(?i)(['""]FARMKART['""]\s*:\s*\{.*?seal\s*:\s*['""]).*?(['""])"
$content = $content -replace $regex, "`$1$dataUri`$2"

# 4. Write content back to file
[IO.File]::WriteAllText($indexPath, $content, [System.Text.Encoding]::UTF8)

Write-Output "FARMKART stamp updated successfully."
