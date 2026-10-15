Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

$topLetterY = 1000
for ($y = 480; $y -le 530; $y++) {
    for ($x = 0; $x -lt 1024; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200) {
            Write-Output "Top white letter pixel at X=$x, Y=$y"
            $topLetterY = $y
            break
        }
    }
    if ($topLetterY -ne 1000) { break }
}

$img.Dispose()
