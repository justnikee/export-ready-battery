$base = "D:\ExportReady-Battery\frontend\app\(dashboard)\dashboard"
$pages = @("analytics", "batches", "billing", "compliance", "developer", "dispatch", "exports", "lifecycle", "partners", "rewards", "settings", "team", "templates")

$corners = "`n          <span className=`"absolute -top-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -top-0.5 -right-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border`" />"

$sl = [System.Text.RegularExpressions.RegexOptions]::Singleline
$slci = [System.Text.RegularExpressions.RegexOptions]::Singleline -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase

foreach ($p in $pages) {
  $f = "$base\$p\page.tsx"
  if (-not (Test-Path $f)) { Write-Host "SKIP $p (not found)"; continue }
  $c = Get-Content $f -Raw

  # Step 1: Add `relative` to block-level card elements that have bg-card + border border-border, but no relative yet
  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div|main|aside)\b[^>]*?)className="(?![^"]*\brelative\b)(?=[^"]*\bbg-card\b)(?=[^"]*\bborder border-border\b)([^"]*)"',
    '$1className="relative $2"',
    $sl
  )

  # Step 2: bg-card -> bg-transparent (global - handles all remaining elements too)
  $c = $c -replace '\bbg-card\b', 'bg-transparent'

  # Step 3: Restore modal/overlay components to solid background
  $c = [regex]::Replace($c,
    '(<(?:DialogContent|DropdownMenuContent|AlertDialogContent|CommandDialog)\b[^>]*?)bg-transparent',
    '$1bg-background',
    $sl
  )

  # Step 4: Remove rounded variants (keep rounded-full for circular elements)
  $c = $c -replace '\s+rounded-(?:md|sm|lg|xl|2xl|3xl)\b', ''

  # Step 5: overflow-hidden -> overflow-visible on card-level elements (has relative + bg-transparent + border border-border)
  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div)[^>]*?)className="((?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*)\boverflow-hidden\b([^"]*)"',
    '$1className="$2overflow-visible$3"',
    $sl
  )

  # Step 6: Insert corner spans after opening tag of card-level elements
  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div)\b[^>]*?className="(?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*"[^>]*>)',
    { param($m) $m.Value + $corners },
    $sl
  )

  # Step 7: Clean up double spaces inside className strings (from rounded removal)
  $c = [regex]::Replace($c, 'className="[^"]*"', {
    param($m)
    [regex]::Replace($m.Value, ' {2,}', ' ')
  })

  Set-Content $f $c -Encoding UTF8 -NoNewline
  Write-Host "Done: $p"
}

# Also handle batches/[id]/page.tsx
$idFile = "$base\batches\[id]\page.tsx"
if (Test-Path $idFile) {
  $c = Get-Content $idFile -Raw

  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div|main|aside)\b[^>]*?)className="(?![^"]*\brelative\b)(?=[^"]*\bbg-card\b)(?=[^"]*\bborder border-border\b)([^"]*)"',
    '$1className="relative $2"', $sl)

  $c = $c -replace '\bbg-card\b', 'bg-transparent'
  $c = [regex]::Replace($c, '(<(?:DialogContent|DropdownMenuContent|AlertDialogContent|CommandDialog)\b[^>]*?)bg-transparent', '$1bg-background', $sl)
  $c = $c -replace '\s+rounded-(?:md|sm|lg|xl|2xl|3xl)\b', ''

  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div)[^>]*?)className="((?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*)\boverflow-hidden\b([^"]*)"',
    '$1className="$2overflow-visible$3"', $sl)

  $c = [regex]::Replace($c,
    '(<(?:div|form|section|article|motion\.div)\b[^>]*?className="(?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*"[^>]*>)',
    { param($m) $m.Value + $corners }, $sl)

  $c = [regex]::Replace($c, 'className="[^"]*"', {
    param($m)
    [regex]::Replace($m.Value, ' {2,}', ' ')
  })

  Set-Content $idFile $c -Encoding UTF8 -NoNewline
  Write-Host "Done: batches/[id]"
}

Write-Host "All done!"
