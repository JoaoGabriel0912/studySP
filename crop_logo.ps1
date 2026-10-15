Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$outPath = "c:\Users\paulo\Documents\GitHub\studySP\img\logo-light.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# Rect: X=35, Y=498, W=950, H=252
$cropRect = New-Object System.Drawing.Rectangle(35, 498, 950, 252)
$target = New-Object System.Drawing.Bitmap(950, 252, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$g = [System.Drawing.Graphics]::FromImage($target)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$destRect = New-Object System.Drawing.Rectangle(0, 0, 950, 252)
$g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)

# Let's inspect the top 20 rows of $target:
# The dark background sample color is at (10, 10):
$bgCol = $target.GetPixel(10, 10)

# Any stray blue pixels from the book in the top 18 rows between X=430 and 520
# will be filled with the dark background color
for ($y = 0; $y -lt 18; $y++) {
    for ($x = 420; $x -le 520; $x++) {
        $c = $target.GetPixel($x, $y)
        # If it's blueish book remnant
        if ($c.B -gt 50 -and $c.R -lt 50) {
            $target.SetPixel($x, $y, $bgCol)
        }
    }
}

$g.Dispose()
$src.Dispose()

$target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$target.Dispose()

Write-Output "Cleaned logo-light.png successfully created!"
