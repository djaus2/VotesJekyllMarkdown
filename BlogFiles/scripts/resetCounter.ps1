param(
  [Parameter(Mandatory=$true)]
  [string]$Secret,

  [ValidateSet('all','key')]
  [string]$Extent = 'all',

  [string]$emojiHost = 'https://djssurveyfn.azurewebsites.net',

  # Optional Azure Functions key (AuthorizationLevel.Function). Accepts raw key or full URL.
  [string]$Code,

  # Required only when Extent = 'key'
  [string]$Ns,
  [string]$Key
)

# bundle exec jekyll serve
#  $adminSecret  = 'freddy137'
#  $functionKey = 'kNPmcoDX5aMLqJOJa2WXNOSAg23j7WzRc2ceEI8cqcEBAzFuqU5fRw==' 
#  .\scripts\resetCounter.ps1 -Secret $adminSecret  -Extent all -Code $functionKey

$body = @{
  action = 'reset'
  secret = $Secret
}

if ($Extent -eq 'all') {
  $body.extent = 'all'
} else {
  if (-not $Ns -or -not $Key) {
    throw "When Extent='key', you must supply -Ns and -Key."
  }
  $body.ns  = $Ns
  $body.key = $Key
}

$uri = "$emojiHost/api/emoji"

Write-Host ("emojiHost=" + $emojiHost)
Write-Host ("uri=" + $uri)
 Write-Host("======")

# If -Code is a full URL, extract the ?code= value. Otherwise treat as raw key.
if ($Code -and $Code.Trim().Length -gt 0) {
  $codeValue = $Code.Trim()
  try {
    if ($codeValue -match '^https?://') {
      $u = [System.Uri]$codeValue
      Add-Type -AssemblyName System.Web -ErrorAction SilentlyContinue | Out-Null
      $qs = [System.Web.HttpUtility]::ParseQueryString($u.Query)
      $codeValue = $qs['code']
    }
  } catch {}
  if ([string]::IsNullOrWhiteSpace($codeValue)) { throw 'Could not determine function code from -Code input.' }
  $enc = [System.Uri]::EscapeDataString($codeValue)
  Write-Host ("uri=" + $uri)
  Write-Host ("enc=" + $enc)
  Write-Host("======")
  $uri = "$($uri)?code=$enc"
}

# Enforce TLS 1.2 for Invoke-RestMethod on older PowerShell
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

Write-Host ("POST " + $uri)
 Write-Host("======")
Write-Host ($body | ConvertTo-Json -Depth 5)
 Write-Host("======")

try {
  $json = $body | ConvertTo-Json -Depth 5
  $res = Invoke-RestMethod -Method Post -Uri $uri -Body $json -ContentType 'application/json' -TimeoutSec 30
  $res | ConvertTo-Json -Depth 5
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
    Write-Error ("HTTP " + [int]$_.Exception.Response.StatusCode + " - " + $_.Exception.Response.StatusDescription)
  } else {
    Write-Error $_
  }
  exit 1
}