Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "src\assets\logo.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $PSScriptRoot "public\logo.png"
}
$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

# Emblem is centered at (512, 288), crop 450x450 square to provide perfect margin and PWA maskable compliance
$cropSize = 450
$cropX = [int](512 - ($cropSize / 2))
$cropY = [int](288 - ($cropSize / 2))
$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)

$cropped = New-Object System.Drawing.Bitmap($cropSize, $cropSize)
$gCrop = [System.Drawing.Graphics]::FromImage($cropped)
$gCrop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gCrop.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gCrop.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gCrop.DrawImage($srcBmp, (New-Object System.Drawing.Rectangle(0, 0, $cropSize, $cropSize)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()

function Resize-Icon($source, $targetSize, $outFilePath) {
    $dest = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($source, 0, 0, $targetSize, $targetSize)
    $dest.Save($outFilePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    Write-Host ('Generated: ' + $outFilePath + ' (' + $targetSize + 'x' + $targetSize + ')')
}

$publicDir = Join-Path $PSScriptRoot "public"
Resize-Icon $cropped 512 (Join-Path $publicDir "pwa-512x512.png")
Resize-Icon $cropped 192 (Join-Path $publicDir "pwa-192x192.png")
Resize-Icon $cropped 144 (Join-Path $publicDir "pwa-144x144.png")
Resize-Icon $cropped 512 (Join-Path $publicDir "logo.png")
Resize-Icon $cropped 180 (Join-Path $publicDir "apple-touch-icon.png")
Resize-Icon $cropped 64 (Join-Path $publicDir "favicon.png")

$cropped.Dispose()
$srcBmp.Dispose()
