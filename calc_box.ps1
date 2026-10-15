Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

$minX = 1024
$maxX = 0
$minY = 1024
$maxY = 0

for ($y = 485; $y -le 740; $y++) {
    for ($x = 0; $x -lt 1024; $x++) {
        $col = $img.GetPixel($x, $y)
        # Check if pixel is not dark background
        if ($col.R -gt 35 -or $col.G -gt 35 -or $col.B -gt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Bounds: X = $minX to $maxX (width = $($maxX - $minX + 1))"
Write-Output "Bounds: Y = $minY to $maxY (height = $($maxY - $minY + 1))"

$img.Dispose()
