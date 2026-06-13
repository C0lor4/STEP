[CmdletBinding()]
param(
    [string]$InputPdf = "STEP 3 Papers 1998-2019.pdf",
    [string]$OutputDir = ".\STEP III Split",
    [string]$StepLabel = "STEP III"
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

function Get-PageText {
    param(
        [int]$PageNumber
    )

    $raw = & $ghostscript `
        -q `
        -dNOPAUSE `
        -dBATCH `
        -sDEVICE=txtwrite `
        "-dFirstPage=$PageNumber" `
        "-dLastPage=$PageNumber" `
        -sOutputFile=- `
        $inputPath 2>$null

    return (($raw -join "`n") -replace '\s+', ' ').Trim()
}

# These segment starts are specific to the combined STEP III 1998-2019 PDF in this folder.
# The script keeps content pages, skips blank pages, and drops year-cover pages only when
# the first page is clearly a standalone cover rather than the page that contains Questions 1 and 2.
$segments = @(
    @{ Year = 1998; Start = 1 },
    @{ Year = 1999; Start = 17 },
    @{ Year = 2000; Start = 27 },
    @{ Year = 2001; Start = 39 },
    @{ Year = 2002; Start = 49 },
    @{ Year = 2003; Start = 61 },
    @{ Year = 2004; Start = 73 },
    @{ Year = 2005; Start = 89 },
    @{ Year = 2006; Start = 103 },
    @{ Year = 2007; Start = 117 },
    @{ Year = 2008; Start = 135 },
    @{ Year = 2009; Start = 149 },
    @{ Year = 2010; Start = 163 },
    @{ Year = 2011; Start = 179 },
    @{ Year = 2012; Start = 195 },
    @{ Year = 2013; Start = 211 },
    @{ Year = 2014; Start = 231 },
    @{ Year = 2015; Start = 249 },
    @{ Year = 2016; Start = 267 },
    @{ Year = 2017; Start = 283 },
    @{ Year = 2018; Start = 299 },
    @{ Year = 2019; Start = 319 }
)

$forcedFirstContentPage = @{
    2008 = 137
    2018 = 301
    2019 = 321
}

for ($i = 0; $i -lt $segments.Count; $i++) {
    $year = [int]$segments[$i].Year
    $segmentStart = [int]$segments[$i].Start
    $segmentEnd = if ($i -lt $segments.Count - 1) {
        [int]$segments[$i + 1].Start - 1
    } else {
        338
    }

    $pagesToKeep = New-Object System.Collections.Generic.List[int]
    $forcedStart = $null

    if ($forcedFirstContentPage.ContainsKey($year)) {
        $forcedStart = [int]$forcedFirstContentPage[$year]
    }

    for ($page = $segmentStart; $page -le $segmentEnd; $page++) {
        if ($null -ne $forcedStart -and $page -lt $forcedStart) {
            continue
        }

        $pageText = Get-PageText -PageNumber $page

        if ([string]::IsNullOrWhiteSpace($pageText)) {
            continue
        }

        if ($page -eq $segmentStart) {
            $isContentFirstPage = $pageText -match 'Section\s+A' -or $pageText -match '(^|\s)1(\s|$)'
            if (-not $isContentFirstPage) {
                continue
            }
        }

        $pagesToKeep.Add($page)
    }

    if ($pagesToKeep.Count -eq 0) {
        for ($page = $segmentStart + 2; $page -le $segmentEnd; $page += 2) {
            $pagesToKeep.Add($page)
        }
    }

    if ($pagesToKeep.Count -eq 0) {
        Write-Warning "No non-blank pages found for $year."
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
