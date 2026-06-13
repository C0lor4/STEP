[CmdletBinding()]
param(
    [string]$InputPdf = "STEP 2 Papers 1998-2019.pdf",
    [string]$OutputDir = ".\STEP II Split",
    [string]$StepLabel = "STEP II"
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

# These are the first content pages for the combined STEP II 1998-2019 PDF in this folder.
# The source uses alternating blank pages, so the script keeps every second page from each start.
$segments = @(
    @{ Year = 1998; Start = 3 },
    @{ Year = 1999; Start = 15 },
    @{ Year = 2000; Start = 27 },
    @{ Year = 2001; Start = 39 },
    @{ Year = 2002; Start = 51 },
    @{ Year = 2003; Start = 63 },
    @{ Year = 2004; Start = 73 },
    @{ Year = 2005; Start = 87 },
    @{ Year = 2006; Start = 99 },
    @{ Year = 2007; Start = 113 },
    @{ Year = 2008; Start = 125 },
    @{ Year = 2009; Start = 137 },
    @{ Year = 2010; Start = 151 },
    @{ Year = 2011; Start = 161 },
    @{ Year = 2012; Start = 179 },
    @{ Year = 2013; Start = 193 },
    @{ Year = 2014; Start = 207 },
    @{ Year = 2015; Start = 223 },
    @{ Year = 2016; Start = 237 },
    @{ Year = 2017; Start = 251 },
    @{ Year = 2018; Start = 265 },
    @{ Year = 2019; Start = 279 }
)

for ($i = 0; $i -lt $segments.Count; $i++) {
    $year = [int]$segments[$i].Year
    $segmentStart = [int]$segments[$i].Start
    $segmentEnd = if ($i -lt $segments.Count - 1) {
        [int]$segments[$i + 1].Start - 1
    } else {
        296
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
