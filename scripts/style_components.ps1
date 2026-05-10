$sl = [System.Text.RegularExpressions.RegexOptions]::Singleline
$corners = "`n          <span className=`"absolute -top-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -top-0.5 -right-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border`" />`n          <span className=`"absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border`" />"

function Transform-ComponentFile($f) {
  $c = Get-Content -LiteralPath $f -Raw
  $c = [regex]::Replace($c, '(<(?:div|form|section|article|motion\.div)\b[^>]*?)className="(?![^"]*\brelative\b)(?=[^"]*\bbg-card\b)(?=[^"]*\bborder border-border\b)([^"]*)"', '$1className="relative $2"', $sl)
  $c = $c -replace '\bbg-card\b', 'bg-transparent'
  $c = [regex]::Replace($c, '(<(?:DialogContent|DropdownMenuContent|AlertDialogContent|CommandDialog)\b[^>]*?)bg-transparent', '$1bg-background', $sl)
  $c = $c -replace '\s+rounded-(?:md|sm|lg|xl|2xl|3xl)\b', ''
  $c = [regex]::Replace($c, '(<(?:div|form|section|article|motion\.div)[^>]*?)className="((?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*)\boverflow-hidden\b([^"]*)"', '$1className="$2overflow-visible$3"', $sl)
  $c = [regex]::Replace($c, '(<(?:div|form|section|article|motion\.div)\b[^>]*?className="(?=[^"]*\brelative\b)(?=[^"]*\bbg-transparent\b)(?=[^"]*\bborder border-border\b)[^"]*"[^>]*>)', { param($m) $m.Value + $corners }, $sl)
  $c = [regex]::Replace($c, 'className="[^"]*"', { param($m) [regex]::Replace($m.Value, ' {2,}', ' ') })
  Set-Content -LiteralPath $f $c -Encoding UTF8 -NoNewline
  $remaining = ([regex]::Matches($c, '\bbg-card\b')).Count
  Write-Host "Done: $([System.IO.Path]::GetFileName($f)) (bg-card remaining=$remaining)"
}

$dashComponents = Get-ChildItem "D:\ExportReady-Battery\frontend\components\dashboard" -Filter "*.tsx"
$batchComponents = Get-ChildItem "D:\ExportReady-Battery\frontend\components\batches" -Filter "*.tsx"
$billingComponents = Get-ChildItem "D:\ExportReady-Battery\frontend\components\billing" -Filter "*.tsx"

foreach ($cf in ($dashComponents + $batchComponents + $billingComponents)) {
  $c = Get-Content -LiteralPath $cf.FullName -Raw
  if ($c -match '\bbg-card\b') {
    Transform-ComponentFile $cf.FullName
  }
}

Write-Host "All components done!"
