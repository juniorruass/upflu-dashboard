#!/bin/bash
# Setup crons do upflu-dashboard na VPS
# Roda uma vez: bash scripts/setup-crons.sh

SECRET="upflu2026"
APP="http://localhost:3000"

# Remove entradas antigas do upflu para evitar duplicatas
crontab -l 2>/dev/null | grep -v "upflu-dashboard" | crontab -

# Adiciona os novos crons
(crontab -l 2>/dev/null; cat <<EOF
# upflu-dashboard crons
* * * * * curl -s -H "Authorization: Bearer $SECRET" $APP/api/cron/send-group-messages >> /var/log/upflu-cron.log 2>&1
* * * * * curl -s -H "Authorization: Bearer $SECRET" $APP/api/cron/check-agenda >> /var/log/upflu-cron.log 2>&1
EOF
) | crontab -

echo "Crons configurados:"
crontab -l | grep upflu
