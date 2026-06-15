#!/bin/bash
# Configura todos os cron jobs do upflu-dashboard na VPS
# Uso: bash scripts/setup-crons.sh
#
# Horários comentados em BRT (UTC-3).
# Se o servidor estiver em UTC, os horários aqui já estão em UTC.

# Lê CRON_SECRET do .env.local se existir, senão usa fallback
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"
if [ -f "$ENV_FILE" ]; then
  SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r')
fi
SECRET="${SECRET:-upflu2026}"

APP="http://localhost:3000"

# Remove TODAS as entradas antigas relacionadas ao upflu (por URL e por comentário)
crontab -l 2>/dev/null \
  | grep -v "localhost:3000/api" \
  | grep -v "upflu-dashboard" \
  | grep -v "prospecting.log" \
  | grep -v "upflu-cron.log" \
  | crontab -

(crontab -l 2>/dev/null; cat <<CRONS
# ── upflu-dashboard crons ─────────────────────────────────────────

# Envio de mensagens agendadas para grupos (a cada minuto)
* * * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/send-group-messages >> /var/log/upflu-cron.log 2>&1

# Lembretes de agenda 30 min antes (a cada minuto)
* * * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/check-agenda >> /var/log/upflu-cron.log 2>&1

# Resumo diário Meta Ads + métricas (09:00 BRT = 12:00 UTC)
0 12 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/daily-summary >> /var/log/upflu-cron.log 2>&1

# Resumo semanal (Sex 17:00 BRT = 20:00 UTC)
0 20 * * 5 curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/weekly-summary >> /var/log/upflu-cron.log 2>&1

# Verifica pagamentos de clientes (09:00 BRT = 12:00 UTC)
0 12 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/check-payments >> /var/log/upflu-cron.log 2>&1

# Verifica campanhas Meta Ads (09:00 BRT = 12:00 UTC)
0 12 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/check-campaigns >> /var/log/upflu-cron.log 2>&1

# Verifica contas de anúncio (06:00 BRT = 09:00 UTC)
0 9 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/check-ad-accounts >> /var/log/upflu-cron.log 2>&1

# Snapshot Instagram (07:00 BRT = 10:00 UTC)
0 10 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/instagram-snapshot >> /var/log/upflu-cron.log 2>&1

# Prospecção automática Brasil.io (Seg-Sex 09:00 BRT = 12:00 UTC)
0 12 * * 1-5 curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/prospecting >> /var/log/upflu-cron.log 2>&1

# Follow-up de prospecção WhatsApp (Seg-Sex 10:00 BRT = 13:00 UTC)
0 13 * * 1-5 curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/prospecting-followup >> /var/log/upflu-cron.log 2>&1

# Prospecção Google Maps (Seg-Sex 09:00 BRT = 12:00 UTC)
0 12 * * 1-5 curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/prospecting-google >> /var/log/upflu-cron.log 2>&1

# Alertas de renovação de contrato (08:00 BRT = 11:00 UTC)
0 11 * * * curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/check-renewals >> /var/log/upflu-cron.log 2>&1

# Sequência de follow-up (Seg-Sex 10:00 e 16:00 BRT = 13:00 e 19:00 UTC)
0 13,19 * * 1-5 curl -sf -H "Authorization: Bearer $SECRET" $APP/api/cron/followup-sequence >> /var/log/upflu-cron.log 2>&1
CRONS
) | crontab -

echo ""
echo "Crons configurados (SECRET=${SECRET:0:4}****):"
crontab -l | grep -v "^#" | grep "upflu"
