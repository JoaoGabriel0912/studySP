Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

# Check X around 450 to 550, Y from 490 to 520
for ($y = 495; $y -le 520; $y++) {
    $found = $false
    for ($x = 450; $x -le 550; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.B -gt 100 -and $c.R -lt 100) {
            Write-Output "Blue pixel at X=$x, Y=$y (R=$($c.R), G=$($c.G), B=$($c.B))"
            $found = $true
            break
        }
    }
}
$img.Dispose()
