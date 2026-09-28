<#
  Sobe, para e acompanha um ambiente do RachaAi (dev, homolog ou prod).

  O ambiente vem do 1º argumento ou, se ele for omitido, da variável AMBIENTE:
    $env:AMBIENTE = "homolog"          # vale para este terminal
    .\scripts\ambiente.ps1 up           # sobe o homolog

  Uso (na pasta do projeto):
    .\scripts\ambiente.ps1 dev up        # constrói e sobe
    .\scripts\ambiente.ps1 dev down      # para e remove os containers (os DADOS do banco ficam)
    .\scripts\ambiente.ps1 dev logs      # acompanha os logs do backend
    .\scripts\ambiente.ps1 dev ps        # mostra o que está rodando
    .\scripts\ambiente.ps1 dev seed      # cria os dados de exemplo (só dev e homolog)
    .\scripts\ambiente.ps1 dev <qualquer comando do docker compose>

  Cada ambiente lê o seu arquivo .env.<ambiente> (copie de .env.<ambiente>.example).
#>
param(
    [Parameter(Position = 0)]
    [string]$Ambiente,

    [Parameter(Position = 1)]
    [string]$Comando,

    [Parameter(Position = 2, ValueFromRemainingArguments = $true)]
    [string[]]$Resto = @()
)

$ambientes = @('dev', 'homolog', 'prod')
# Sem o nome do ambiente no 1º argumento ("ambiente.ps1 up"), usa a variável AMBIENTE.
if ($Ambiente -and $ambientes -notcontains $Ambiente) {
    if ($Comando) { $Resto = @($Comando) + $Resto }
    $Comando = $Ambiente
    $Ambiente = $env:AMBIENTE
}
if (-not $Ambiente) { $Ambiente = $env:AMBIENTE }
if (-not $Comando) { $Comando = 'up' }
if ($ambientes -notcontains $Ambiente) {
    Write-Host "Ambiente inválido: '$Ambiente'. Use dev, homolog ou prod (no 1º argumento ou em `$env:AMBIENTE)." -ForegroundColor Red
    exit 1
}
Write-Host "Ambiente: $Ambiente" -ForegroundColor Cyan

# 'Continue' de propósito: o docker escreve o progresso no stderr, e com 'Stop' o Windows
# PowerShell 5.1 trata isso como erro quando a saída é redirecionada. O resultado vem do exit code.
$ErrorActionPreference = 'Continue'
$raiz = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $raiz ".env.$Ambiente"

if (-not (Test-Path $envFile)) {
    Write-Host "Arquivo .env.$Ambiente não encontrado. Crie a partir do modelo:" -ForegroundColor Red
    Write-Host "  Copy-Item .env.$Ambiente.example .env.$Ambiente   # e troque as senhas"
    exit 1
}

$compose = @('compose', '--project-directory', $raiz, '--env-file', $envFile, '-f', (Join-Path $raiz 'docker-compose.yml'))
if ($Ambiente -eq 'prod') {
    $compose += @('-f', (Join-Path $raiz 'docker-compose.prod.yml'))
}

switch ($Comando) {
    'up'   { & docker @compose up --build -d @Resto }
    'logs' { & docker @compose logs -f backend @Resto }
    'seed' {
        if ($Ambiente -eq 'prod') {
            Write-Host 'Dados de exemplo não são criados em produção.' -ForegroundColor Red
            exit 1
        }
        $sitePort = (Select-String -Path $envFile -Pattern '^SITE_PORT=(\d+)').Matches[0].Groups[1].Value
        $env:BASE = "http://localhost:$sitePort/api"
        $gitBash = 'C:\Program Files\Git\bin\bash.exe'
        $bash = if (Test-Path $gitBash) { $gitBash } else { 'bash' }
        & $bash (Join-Path $raiz 'scripts/seed-demo.sh')
    }
    default { & docker @compose $Comando @Resto }
}
exit $LASTEXITCODE
