Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\paulo\.gemini\antigravity\brain\afc427bd-7081-4b7d-92a4-250bfb5f8566\.user_uploaded\media_1792016732833_d187708b.jpg"
$origLogo = "c:\Users\paulo\Documents\GitHub\studySP\img\logo.png"

$img1 = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Uploaded: $($img1.Width) x $($img1.Height)"
$img1.Dispose()

$img2 = [System.Drawing.Image]::FromFile($origLogo)
Write-Output "Logo orig: $($img2.Width) x $($img2.Height)"
$img2.Dispose()
