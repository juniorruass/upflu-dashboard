const ENDPOINT = "https://api.autentique.com.br/v2/graphql";

function apiKey() {
  const key = process.env.AUTENTIQUE_API_KEY;
  if (!key) throw new Error("AUTENTIQUE_API_KEY não configurada");
  return key;
}

const CREATE_DOCUMENT = `
  mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
    createDocument(document: $document, signers: $signers, file: $file) {
      id
      name
      created_at
      signatures {
        public_id
        name
        email
        action { name }
        link { short_link }
      }
    }
  }
`;

const DOCUMENT_QUERY = `
  query GetDocument($id: UUID!) {
    document(id: $id) {
      id
      name
      created_at
      signatures {
        public_id
        name
        email
        signed
        signed_at
        action { name }
        link { short_link }
      }
    }
  }
`;

export type AutentiqueSignature = {
  public_id: string;
  name: string;
  email: string;
  signed?: boolean;
  signed_at?: string;
  action: { name: string };
  link?: { short_link: string };
};

export type AutentiqueDocument = {
  id: string;
  name: string;
  created_at: string;
  signatures: AutentiqueSignature[];
};

export async function createDocument(params: {
  title: string;
  pdfBuffer: Buffer;
  signerName: string;
  signerEmail: string;
  message?: string;
}): Promise<AutentiqueDocument> {
  const formData = new FormData();

  formData.append("operations", JSON.stringify({
    query: CREATE_DOCUMENT,
    variables: {
      document: {
        name: params.title,
        message: params.message ?? `Olá ${params.signerName}, segue proposta comercial da UPFLU para sua análise e assinatura.`,
        reminder: true,
        sortable: false,
        refusable: true,
      },
      signers: [
        {
          name: params.signerName,
          email: params.signerEmail,
          action: "SIGN",
          delivery_method: "DELIVERY_METHOD_EMAIL",
          positions: [],
        },
      ],
      file: null,
    },
  }));

  formData.append("map", JSON.stringify({ "0": ["variables.file"] }));
  formData.append("0", new Blob([params.pdfBuffer.buffer as ArrayBuffer], { type: "application/pdf" }), "proposta.pdf");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: formData,
  });

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data.createDocument as AutentiqueDocument;
}

export async function getDocument(id: string): Promise<AutentiqueDocument | null> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: DOCUMENT_QUERY, variables: { id } }),
  });

  const json = await res.json();
  if (json.errors?.length) return null;
  return json.data.document as AutentiqueDocument;
}
