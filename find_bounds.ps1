Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

# We want only the lettering "StudySP" and "ESTUDE • PRATIQUE • CONQUISTE"
# Let's inspect where the drawing ends and where the text starts.
# Let's find pixel intensities along the center column (X = 512)
for ($y = 450; $y -lt 850; $y += 10) {
    $col = $img.GetPixel(512, $y)
    Write-Output "Y=$y : R=$($col.R) G=$($col.G) B=$($col.B)"
}

$img.Dispose()
