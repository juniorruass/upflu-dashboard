-- Tabela de template de contrato padrão
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS contract_templates (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL DEFAULT 'Padrão',
  content    TEXT        NOT NULL DEFAULT '',
  is_default BOOLEAN     DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas extras na tabela proposals
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS type               TEXT    DEFAULT 'proposal',  -- proposal | contract
  ADD COLUMN IF NOT EXISTS payment_day        INTEGER,
  ADD COLUMN IF NOT EXISTS contract_start     DATE,
  ADD COLUMN IF NOT EXISTS duration_months    INTEGER;

-- Template padrão inicial (personalize depois no painel)
INSERT INTO contract_templates (name, content, is_default)
VALUES ('Padrão', $TEMPLATE$CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS

Pelo presente instrumento particular, as partes:

CONTRATADA: UPFLU Soluções Digitais, com endereço em [SEU ENDEREÇO].

CONTRATANTE: {{client_name}}, representado(a) por {{signer_name}}, e-mail {{signer_email}}, doravante denominado CONTRATANTE.

Têm entre si justo e acordado o presente Contrato de Prestação de Serviços Digitais, mediante as seguintes cláusulas:

─────────────────────────────────────────────
CLÁUSULA 1 – DO OBJETO
─────────────────────────────────────────────

A CONTRATADA prestará ao CONTRATANTE os seguintes serviços:

{{service_list}}

─────────────────────────────────────────────
CLÁUSULA 2 – DO PRAZO
─────────────────────────────────────────────

O presente contrato vigorará pelo período de {{duration_months}} meses, com início em {{contract_start}}, podendo ser renovado mediante acordo entre as partes.

─────────────────────────────────────────────
CLÁUSULA 3 – DO VALOR E FORMA DE PAGAMENTO
─────────────────────────────────────────────

3.1. O valor mensal pelos serviços é de {{total_value}}.

3.2. O pagamento deverá ser realizado todo dia {{payment_day}} de cada mês, via PIX, transferência bancária ou boleto.

3.3. O atraso no pagamento sujeitará o CONTRATANTE à multa de 2% sobre o valor devido, acrescida de juros de 1% ao mês.

─────────────────────────────────────────────
CLÁUSULA 4 – DAS OBRIGAÇÕES DA CONTRATADA
─────────────────────────────────────────────

4.1. Executar os serviços com qualidade e dentro dos prazos acordados.

4.2. Manter sigilo sobre todas as informações confidenciais do CONTRATANTE.

4.3. Apresentar relatórios mensais de desempenho.

─────────────────────────────────────────────
CLÁUSULA 5 – DAS OBRIGAÇÕES DO CONTRATANTE
─────────────────────────────────────────────

5.1. Fornecer acesso e informações necessárias para a execução dos serviços.

5.2. Efetuar os pagamentos nas datas acordadas.

5.3. Responsabilizar-se pelo conteúdo aprovado para veiculação.

─────────────────────────────────────────────
CLÁUSULA 6 – DA RESCISÃO
─────────────────────────────────────────────

6.1. O contrato poderá ser rescindido por qualquer das partes mediante notificação prévia de 30 dias.

6.2. Em caso de rescisão antecipada pelo CONTRATANTE, será devida multa equivalente a 1 (uma) mensalidade.

─────────────────────────────────────────────
CLÁUSULA 7 – DO FORO
─────────────────────────────────────────────

As partes elegem o foro da comarca de [SUA CIDADE] para dirimir quaisquer dúvidas oriundas do presente contrato.

Por estarem justos e acordados, assinam eletronicamente em {{today}}.


________________________________
UPFLU Soluções Digitais
CONTRATADA


________________________________
{{signer_name}}
CONTRATANTE$TEMPLATE$, true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
