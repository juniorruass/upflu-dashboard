# ─────────────────────────────────────────────────────────────────
# deploy.ps1  —  Deploy upflu-dashboard → VPS
#
# Uso:
#   .\deploy.ps1              deploy completo (código + build + pm2 + crons)
#   .\deploy.ps1 -CronsOnly   só reconfigura crons
#   .\deploy.ps1 -NoBuild     envia código mas pula npm build
#   .\deploy.ps1 -Restart     só reinicia o PM2
#   .\deploy.ps1 -Status      mostra status do PM2
#   .\deploy.ps1 -Logs        abre logs em tempo real (Ctrl+C para sair)
#   .\deploy.ps1 -Ssh         abre terminal interativo no VPS
# ─────────────────────────────────────────────────────────────────
param(
    [string]$VpsHost  = "2.25.168.207",
    [string]$VpsUser  = "root",
    [string]$Remote   = "/opt/upflu-dashboard",
    [string]$KeyFile  = "$env:USERPROFILE\.ssh\id_upflu",
    [switch]$CronsOnly,
    [switch]$NoBuild,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Logs,
    [switch]$Ssh
)

$VPS       = "${VpsUser}@${VpsHost}"
$LocalPath = $PSScriptRoot

# ── helpers ───────────────────────────────────────────────────────
function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "`nERRO: $msg" -ForegroundColor Red; exit 1 }
function Invoke-Remote { param($cmd); ssh -i $KeyFile -o StrictHostKeyChecking=no $VPS $cmd }

function Check-SSH {
    Step "Conectando em $VPS..."
    $r = ssh -i $KeyFile -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS "echo ok" 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "SSH falhou. Chave: $KeyFile" }
    Ok "Conectado."
}

# ── -Ssh: terminal interativo ─────────────────────────────────────
if ($Ssh) {
    Write-Host "`nAbrindo terminal VPS..." -ForegroundColor Cyan
    ssh -i $KeyFile -o StrictHostKeyChecking=no $VPS
    exit 0
}

# ── -Status ───────────────────────────────────────────────────────
if ($Status) {
    Write-Host "`n==> Status do servidor" -ForegroundColor Cyan
    Invoke-Remote "pm2 list && echo '' && echo '--- Crons ativos ---' && crontab -l | grep -v '^#' | grep 'localhost'"
    exit 0
}

# ── -Logs ─────────────────────────────────────────────────────────
if ($Logs) {
    Write-Host "`n==> Logs em tempo real (Ctrl+C para sair)" -ForegroundColor Cyan
    ssh -i $KeyFile -o StrictHostKeyChecking=no $VPS "pm2 logs upflu-dashboard --lines 50"
    exit 0
}

# ── -Restart ──────────────────────────────────────────────────────
if ($Restart) {
    Check-SSH
    Step "Reiniciando PM2..."
    Invoke-Remote "pm2 restart upflu-dashboard && pm2 list"
    Ok "Reiniciado."
    exit 0
}

# ── -CronsOnly ────────────────────────────────────────────────────
if ($CronsOnly) {
    Check-SSH
    Step "Enviando setup-crons.sh..."
    scp -i $KeyFile "$LocalPath\scripts\setup-crons.sh" "${VPS}:${Remote}/scripts/setup-crons.sh"
    if ($LASTEXITCODE -ne 0) { Fail "scp falhou." }
    Step "Configurando crons..."
    Invoke-Remote "bash $Remote/scripts/setup-crons.sh"
    Ok "Crons configurados."
    exit 0
}

# ── deploy completo ───────────────────────────────────────────────
Check-SSH

$Items = @(
    "app", "components", "lib", "public", "scripts",
    "types", "supabase",
    "middleware.ts", "next.config.mjs", "package.json", "package-lock.json",
    "tailwind.config.ts", "tsconfig.json", "postcss.config.mjs", "components.json"
)
$Existing = $Items | Where-Object { Test-Path (Join-Path $LocalPath $_) }

Step "Empacotando código ($($Existing.Count) itens)..."
$TmpTar = [System.IO.Path]::Combine($env:TEMP, "upflu-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz")
& tar @("-czf", $TmpTar, "-C", $LocalPath) $Existing
if ($LASTEXITCODE -ne 0) { Fail "tar falhou." }
$sizeMB = [math]::Round((Get-Item $TmpTar).Length / 1MB, 1)
Ok "$sizeMB MB"

Step "Enviando para VPS..."
scp -i $KeyFile $TmpTar "${VPS}:/tmp/upflu-deploy.tar.gz"
if ($LASTEXITCODE -ne 0) { Remove-Item $TmpTar -EA SilentlyContinue; Fail "scp falhou." }
Remove-Item $TmpTar -EA SilentlyContinue
Ok "Enviado."

$buildCmd = if ($NoBuild) { 'echo "Build pulado."' } else { 'npm run build 2>&1 | tail -20' }

$remoteScript = @"
set -e
echo '-- Extraindo...'
tar -xzf /tmp/upflu-deploy.tar.gz -C $Remote
rm -f /tmp/upflu-deploy.tar.gz
cd $Remote
echo '-- Instalando dependencias...'
npm install 2>&1 | tail -5
echo '-- Buildando...'
$buildCmd
echo '-- Permissões...'
chmod 755 $Remote/scripts
chmod 644 $Remote/scripts/setup-crons.sh
echo '-- Reiniciando PM2...'
pm2 restart upflu-dashboard
echo '-- Configurando crons...'
bash $Remote/scripts/setup-crons.sh
echo ''
echo 'Deploy concluido!'
pm2 list
"@

Step "Buildando e reiniciando no VPS..."
ssh -i $KeyFile -o StrictHostKeyChecking=no $VPS $remoteScript
if ($LASTEXITCODE -ne 0) { Fail "Falha no servidor." }

Ok "Deploy finalizado."
