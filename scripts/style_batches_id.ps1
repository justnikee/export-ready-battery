$f = "D:\ExportReady-Battery\frontend\app\(dashboard)\dashboard\batches\[id]\page.tsx"
$c = Get-Content -LiteralPath $f -Raw

$sl = [System.Text.RegularExpressions.RegexOptions]::Singleline

$corners = "`n          <span className=`"absolute -top-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -top-0.5 -right-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border`" />"

# Step 1: Add `relative` to block-level card elements with bg-card + border border-border but no relative
$c = [regex]::Replace($c,
  '(<(?:div|form|section|article|motion\.div|main|aside)\b[^>]*?)className="(?![^"]*\brelative\b)(?=[^"]*\bbg-card\b)(?=[^"]*\bborder border-border\b)([^"]*)"',
  '$1className="relative $2"',
  $sl
)

# Step 2: bg-card -> bg-transparent
$c = $c -replace '\bbg-card\b', 'bg-transparent'

# Step 3: Fix modal components
$c = [regex]::Replace($c,
  '(<(?:DialogContent|DropdownMenuContent|AlertDialogContent|CommandDialog)\b[^>]*?)bg-transparent',
  '$1bg-background',
  $sl
)

# Step 4: Remove rounded variants
$c = $c -replace '\s+rounded-(?:md|sm|lg|xl|2xl|3xl)\b', ''

# Step 5: overflow-hidden -> overflow-visible on card elements
$c = [regex]::Replace($c,
  '(<(?:div|form|section|article|motion\.div)[^>]*?)className="((?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*)\boverflow-hidden\b([^"]*)"',
  '$1className="$2overflow-visible$3"',
  $sl
)

# Step 6: Insert corner spans
$c = [regex]::Replace($c,
  '(<(?:div|form|section|article|motion\.div)\b[^>]*?className="(?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*"[^>]*>)',
  { param($m) $m.Value + $corners },
  $sl
)

# Step 7: Clean up double spaces
$c = [regex]::Replace($c, 'className="[^"]*"', {
  param($m)
  [regex]::Replace($m.Value, ' {2,}', ' ')
})

Set-Content -LiteralPath $f $c -Encoding UTF8 -NoNewline
Write-Host "Done: batches/[id]"
Write-Host "bg-card remaining: $(([regex]::Matches($c, '\bbg-card\b')).Count)"
Write-Host "corners: $(([regex]::Matches($c, 'absolute -top-0\.5 -left-0\.5 w-1 h-1 bg-border')).Count)"
