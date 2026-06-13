[CmdletBinding()]
param(
    [string]$InputPdf = "STEP 1 Papers 1998-2018.pdf",
    [string]$OutputDir = ".\STEP I Split",
    [string]$StepLabel = "STEP I"
)

$ErrorActionPreference = "Stop"

$ghostscript = "C:\Program Files\gs\gs10.04.0\bin\gswin64c.exe"

if (-not (Test-Path -LiteralPath $ghostscript)) {
    throw "Ghostscript not found at '$ghostscript'."
}

if (-not (Test-Path -LiteralPath $InputPdf)) {
    throw "Input PDF not found: '$InputPdf'."
}

$inputPath = (Resolve-Path -LiteralPath $InputPdf).Path
$outputPath = Join-Path (Get-Location) $OutputDir
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null

# These are the first content pages for the combined STEP I 1998-2018 PDF in this folder.
# The source uses alternating blank pages, so the script keeps every second page from each start.
$segments = @(
    @{ Year = 1998; Start = 3 },
    @{ Year = 1999; Start = 13 },
    @{ Year = 2000; Start = 23 },
    @{ Year = 2001; Start = 33 },
    @{ Year = 2002; Start = 43 },
    @{ Year = 2003; Start = 57 },
    @{ Year = 2004; Start = 69 },
    @{ Year = 2005; Start = 83 },
    @{ Year = 2006; Start = 97 },
    @{ Year = 2007; Start = 113 },
    @{ Year = 2008; Start = 125 },
    @{ Year = 2009; Start = 137 },
    @{ Year = 2010; Start = 151 },
    @{ Year = 2011; Start = 165 },
    @{ Year = 2012; Start = 179 },
    @{ Year = 2013; Start = 195 },
    @{ Year = 2014; Start = 209 },
    @{ Year = 2015; Start = 223 },
    @{ Year = 2016; Start = 237 },
    @{ Year = 2017; Start = 253 },
    @{ Year = 2018; Start = 271 },
    @{ Year = 2019; Start = 287 }
)

for ($i = 0; $i -lt $segments.Count; $i++) {
    $year = [int]$segments[$i].Year
    $segmentStart = [int]$segments[$i].Start
    $segmentEnd = if ($i -lt $segments.Count - 1) {
        [int]$segments[$i + 1].Start - 1
    } else {
        298
    }

    $pagesToKeep = New-Object System.Collections.Generic.List[int]

    for ($page = $segmentStart; $page -le $segmentEnd; $page += 2) {
        $pagesToKeep.Add($page)
    }

    if ($pagesToKeep.Count -eq 0) {
        Write-Warning "No pages found for $year."
        continue
    }

    $pageList = ($pagesToKeep | ForEach-Object { $_.ToString() }) -join ","
    $outputFile = Join-Path $outputPath ("{0} {1}.pdf" -f $year, $StepLabel)

    & $ghostscript `
        -q `
        -dNOPAUSE `
        -dBATCH `
        -sDEVICE=pdfwrite `
        "-sPageList=$pageList" `
        "-sOutputFile=$outputFile" `
        $inputPath

    if ($LASTEXITCODE -ne 0) {
        throw "Ghostscript failed while creating '$outputFile'."
    }

    Write-Host ("Created {0}" -f (Split-Path -Leaf $outputFile))
}
