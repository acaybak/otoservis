# Generates Windows app icons (icon.png 512x512 + multi-size icon.ico) from the OtoServis logo.
# Crops the wrench symbol from the left side of the wide logo and renders it on a transparent square.
param(
  [string]$SourcePng = (Join-Path $PSScriptRoot "..\..\web\public\logo.png"),
  [string]$OutDir = (Join-Path $PSScriptRoot "..\build"),
  [int]$SymbolMaxX = 0
)

Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path $SourcePng).Path
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1) Detect the symbol region: the leftmost block of content columns, terminated by a
#    vertical gap (>= 8 empty columns) that separates the symbol from the wordmark text.
$scanLimit = [Math]::Min(600, $src.Width)
$colHas = New-Object 'bool[]' $scanLimit
for ($y = 0; $y -lt $src.Height; $y++) {
  for ($x = 0; $x -lt $scanLimit; $x++) {
    if (-not $colHas[$x] -and $src.GetPixel($x, $y).A -gt 16) { $colHas[$x] = $true }
  }
}
$firstCol = -1
for ($x = 0; $x -lt $scanLimit; $x++) { if ($colHas[$x]) { $firstCol = $x; break } }
if ($firstCol -lt 0) { throw "Logo pixels not found in $srcPath" }
$gapRun = 0; $lastCol = $firstCol
for ($x = $firstCol; $x -lt $scanLimit; $x++) {
  if ($colHas[$x]) { $gapRun = 0; $lastCol = $x } else { $gapRun++; if ($gapRun -ge 8) { break } }
}
if ($SymbolMaxX -gt 0 -and $lastCol -gt $SymbolMaxX) { $lastCol = $SymbolMaxX }

# Bounding box of non-transparent pixels within the symbol columns
$minX = [int]::MaxValue; $minY = [int]::MaxValue; $maxX = -1; $maxY = -1
for ($y = 0; $y -lt $src.Height; $y++) {
  for ($x = $firstCol; $x -le $lastCol; $x++) {
    if ($src.GetPixel($x, $y).A -gt 16) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
if ($maxX -lt 0) { throw "Symbol pixels not found in $srcPath" }
Write-Host "Symbol region columns: $firstCol-$lastCol"
Write-Host "Symbol bbox: ($minX,$minY)-($maxX,$maxY)"

# 2) Square crop centered on the symbol with 6% padding
$w = $maxX - $minX + 1; $h = $maxY - $minY + 1
$side = [Math]::Max($w, $h)
$pad = [int]($side * 0.06)
$sideWithPad = $side + 2 * $pad
$cx = ($minX + $maxX) / 2; $cy = ($minY + $maxY) / 2
$cropX = [int][Math]::Round($cx - $sideWithPad / 2)
$cropY = [int][Math]::Round($cy - $sideWithPad / 2)
# Never let the square bleed into the wordmark: keep the right edge inside the gap.
if ($cropX + $sideWithPad -gt $lastCol + 1) { $cropX = [Math]::Max(0, $lastCol + 1 - $sideWithPad) }

# 3) Render 512x512 transparent square
$dst512 = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dst512)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $sideWithPad, $sideWithPad)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, 512, 512)
$g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$dst512.Save((Join-Path $OutDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# 4) Multi-size .ico with PNG-compressed entries (Vista+ format)
$sizes = @(256, 128, 64, 48, 32, 16)
$pngBlobs = @()
foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gs = [System.Drawing.Graphics]::FromImage($bmp)
  $gs.Clear([System.Drawing.Color]::Transparent)
  $gs.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gs.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $r = New-Object System.Drawing.Rectangle(0, 0, $s, $s)
  $gs.DrawImage($dst512, $r)
  $gs.Dispose()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $pngBlobs += , $ms.ToArray()
  $bmp.Dispose()
  $ms.Dispose()
}

$icoPath = Join-Path $OutDir 'icon.ico'
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)                      # reserved
$bw.Write([UInt16]1)                      # type: icon
$bw.Write([UInt16]$sizes.Count)           # image count
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]
  $dim = [byte]$(if ($s -ge 256) { 0 } else { $s })
  $bw.Write($dim)                         # width
  $bw.Write($dim)                         # height
  $bw.Write([byte]0)                      # palette
  $bw.Write([byte]0)                      # reserved
  $bw.Write([UInt16]1)                    # planes
  $bw.Write([UInt16]32)                   # bpp
  $bw.Write([UInt32]$pngBlobs[$i].Length) # size of PNG blob
  $bw.Write([UInt32]$offset)              # offset
  $offset += $pngBlobs[$i].Length
}
foreach ($blob in $pngBlobs) { $bw.Write($blob) }
$bw.Close(); $fs.Close()
$src.Dispose()

Write-Host "OK: icon.png (512x512) + icon.ico ($($sizes.Count) sizes: $($sizes -join ',')) written to $OutDir"
