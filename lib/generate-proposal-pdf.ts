import PDFDocument from "pdfkit";

export type ProposalService = {
  name: string;
  description: string;
  value: number;
};

export type ProposalData = {
  title: string;
  clientName: string;
  clientEmail: string;
  services: ProposalService[];
  totalValue: number;
  validUntil: string;
  description?: string;
};

export type ContractData = {
  title: string;
  signerName: string;
  signerEmail: string;
  clientName: string;
  services: ProposalService[];
  totalValue: number;
  paymentDay: number;
  contractStart: string;
  durationMonths: number;
  templateContent: string;
};

function currency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function buildServiceList(services: ProposalService[]): string {
  return services
    .filter(s => s.name)
    .map(s => `• ${s.name}${s.description ? ` — ${s.description}` : ""}: ${currency(s.value)}/mês`)
    .join("\n");
}

function substituteVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function generateContractPdf(data: ContractData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 72, size: "A4", autoFirstPage: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const DARK = "#080808";
    const CYAN = "#00CFFF";
    const TEXT = "#111111";

    const todayStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const vars: Record<string, string> = {
      client_name:      data.clientName,
      signer_name:      data.signerName,
      signer_email:     data.signerEmail,
      total_value:      currency(data.totalValue),
      payment_day:      String(data.paymentDay),
      contract_start:   formatDate(data.contractStart),
      duration_months:  String(data.durationMonths),
      service_list:     buildServiceList(data.services),
      today:            todayStr,
    };

    const rendered = substituteVars(data.templateContent, vars);

    // ── Cover strip ──────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(DARK);
    doc.fill("#FFFFFF").fontSize(20).font("Helvetica-Bold").text("UPFLU", 72, 28);
    doc.fill(CYAN).fontSize(7.5).font("Helvetica").text("IA & AUTOMAÇÃO PARA NEGÓCIOS", 72, 52, { characterSpacing: 1.5 });
    doc.fill("#FFFFFF").fontSize(10).font("Helvetica-Bold")
      .text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 0, 34, { align: "right", width: doc.page.width - 72 });
    doc.fill("rgba(255,255,255,0.5)").fontSize(8).font("Helvetica")
      .text(todayStr, 0, 50, { align: "right", width: doc.page.width - 72 });

    // ── Contract body ────────────────────────────────────────────────
    doc.y = 110;

    const lines = rendered.split("\n");
    const contentWidth = doc.page.width - 144; // 72 margin each side

    for (const line of lines) {
      const trimmed = line.trim();

      // Section separator lines (─────)
      if (/^─{3,}/.test(trimmed)) {
        doc.moveDown(0.3);
        doc.rect(72, doc.y, contentWidth, 0.5).fill("#D0CCC8");
        doc.moveDown(0.5);
        continue;
      }

      // All-caps headings (CLÁUSULA, etc.)
      if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\d–—-]{8,}$/.test(trimmed) && trimmed.length < 80) {
        doc.moveDown(0.4);
        doc.fill(TEXT).fontSize(9).font("Helvetica-Bold").text(trimmed, 72, doc.y, { width: contentWidth, characterSpacing: 0.5 });
        doc.moveDown(0.3);
        continue;
      }

      // Empty line
      if (trimmed === "") {
        doc.moveDown(0.5);
        continue;
      }

      // Signature lines
      if (/^_{10,}/.test(trimmed)) {
        doc.moveDown(0.8);
        doc.rect(72, doc.y, 180, 0.5).fill("#777068");
        doc.moveDown(0.3);
        continue;
      }

      // Normal paragraph
      doc.fill(TEXT).fontSize(10).font("Helvetica").text(line, 72, doc.y, { width: contentWidth, lineGap: 2, paragraphGap: 0 });
    }

    // ── Footer on every page ─────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const bottom = doc.page.height - 36;
      doc.rect(0, bottom, doc.page.width, 36).fill(DARK);
      doc.fill("#FFFFFF").fontSize(7.5).font("Helvetica").text("upflu.digital", 72, bottom + 12);
      doc.fill("rgba(255,255,255,0.4)").fontSize(7.5)
        .text(`Página ${i + 1} de ${range.count}`, 0, bottom + 12, { align: "right", width: doc.page.width - 72 });
    }

    doc.end();
  });
}

export function generateProposalPdf(proposal: ProposalData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const DARK   = "#080808";
    const CYAN   = "#00CFFF";
    const TEXT   = "#1A1A1A";
    const MUTED  = "#777068";
    const BORDER = "#E0DDD8";

    // ── Header background strip ──────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(DARK);

    // Brand name
    doc
      .fill("#FFFFFF")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("UPFLU", 60, 36);

    doc
      .fill(CYAN)
      .fontSize(8)
      .font("Helvetica")
      .text("IA & AUTOMAÇÃO PARA NEGÓCIOS", 60, 62, { characterSpacing: 1.5 });

    // Proposal label on the right
    doc
      .fill("#FFFFFF")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("PROPOSTA COMERCIAL", 0, 36, { align: "right", width: doc.page.width - 60 });

    doc
      .fill(MUTED)
      .fontSize(9)
      .font("Helvetica")
      .text(`Válida até ${formatDate(proposal.validUntil)}`, 0, 54, { align: "right", width: doc.page.width - 60 });

    // ── Client info block ─────────────────────────────────────────────
    doc.y = 130;
    doc.fill(TEXT).fontSize(9).font("Helvetica").text("PARA", 60, 130, { characterSpacing: 1 });
    doc.fill(TEXT).fontSize(14).font("Helvetica-Bold").text(proposal.clientName, 60, 144);
    doc.fill(MUTED).fontSize(9).font("Helvetica").text(proposal.clientEmail, 60, 162);

    // Cyan accent line
    doc.rect(60, 182, 420, 1).fill(CYAN);

    // ── Title ─────────────────────────────────────────────────────────
    doc.y = 198;
    doc.fill(TEXT).fontSize(15).font("Helvetica-Bold").text(proposal.title, 60, 198);

    if (proposal.description) {
      doc.y += 6;
      doc.fill(MUTED).fontSize(10).font("Helvetica").text(proposal.description, 60, doc.y, { width: 420, lineGap: 3 });
    }

    // ── Services table ────────────────────────────────────────────────
    const tableTop = doc.y + 28;

    // Table header
    doc.rect(60, tableTop, 420, 26).fill("#F5F3F0");
    doc.fill(MUTED).fontSize(8).font("Helvetica-Bold")
      .text("SERVIÇO", 70, tableTop + 9, { characterSpacing: 0.8 });
    doc.text("VALOR", 390, tableTop + 9, { width: 80, align: "right", characterSpacing: 0.8 });

    let rowY = tableTop + 26;

    proposal.services.forEach((service, i) => {
      const isEven = i % 2 === 0;
      const rowHeight = service.description ? 46 : 30;

      if (isEven) doc.rect(60, rowY, 420, rowHeight).fill("#FAFAF9");

      doc.fill(TEXT).fontSize(10).font("Helvetica-Bold")
        .text(service.name, 70, rowY + 9, { width: 290 });

      if (service.description) {
        doc.fill(MUTED).fontSize(8.5).font("Helvetica")
          .text(service.description, 70, rowY + 23, { width: 290 });
      }

      doc.fill(TEXT).fontSize(10).font("Helvetica-Bold")
        .text(currency(service.value), 370, rowY + 9, { width: 100, align: "right" });

      // Row border
      doc.rect(60, rowY + rowHeight - 1, 420, 0.5).fill(BORDER);

      rowY += rowHeight;
    });

    // ── Total ─────────────────────────────────────────────────────────
    doc.rect(60, rowY, 420, 36).fill(DARK);
    doc.fill("#FFFFFF").fontSize(10).font("Helvetica").text("INVESTIMENTO TOTAL", 70, rowY + 12);
    doc.fill(CYAN).fontSize(12).font("Helvetica-Bold")
      .text(currency(proposal.totalValue), 370, rowY + 10, { width: 100, align: "right" });

    rowY += 36;

    // ── Footer note ───────────────────────────────────────────────────
    const footerTop = rowY + 32;
    doc.fill(MUTED).fontSize(8.5).font("Helvetica")
      .text(
        "Esta proposta é válida até a data indicada acima. Após assinatura, os serviços serão iniciados conforme cronograma acordado. Dúvidas: agupflu@gmail.com",
        60, footerTop, { width: 420, lineGap: 3 }
      );

    // Bottom brand line
    const pageBottom = doc.page.height - 40;
    doc.rect(0, pageBottom - 1, doc.page.width, 40).fill(DARK);
    doc.fill("#FFFFFF").fontSize(8).font("Helvetica")
      .text("upflu.digital", 60, pageBottom + 12);
    doc.fill(MUTED).fontSize(8).font("Helvetica")
      .text("IA & Automação para Negócios", 0, pageBottom + 12, { align: "right", width: doc.page.width - 60 });

    doc.end();
  });
}
