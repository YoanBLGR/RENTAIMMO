import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { extractTextFromPdfBuffer } from '@/lib/pdf-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction de données d'annonces immobilières françaises.
Analyse le texte fourni et extrais les informations dans le format JSON suivant.
Pour chaque champ, mets null si l'information n'est pas trouvée dans le texte.

{
  "adresse": "string | null — adresse de la rue",
  "ville": "string | null — nom de la ville",
  "codePostal": "string | null — code postal",
  "description": "string | null — description courte du bien (1-2 phrases)",
  "prixAchat": "number | null — prix en euros (nombre entier, sans espaces)",
  "fraisAgence": "number | null — montant frais d'agence si mentionné",
  "fraisAgenceInclus": "boolean | null — true si le prix est FAI (frais d'agence inclus), false si net vendeur",
  "montantTravaux": "number | null — montant des travaux si mentionné",
  "detailTravaux": "string | null — description des travaux si mentionnés",
  "lots": [
    {
      "type": "string | null — T1, T2, T3, T4, T5, Studio, Commerce, Local",
      "surface": "number | null — surface en m²",
      "etage": "number | null — numéro d'étage (0 = RDC)",
      "loyerMensuel": "number | null — loyer mensuel si mentionné"
    }
  ],
  "taxeFonciere": "number | null — taxe foncière annuelle",
  "copropriete": "number | null — charges de copropriété annuelles",
  "strategie": "'longue_duree' | 'courte_duree' | null — longue_duree pour location nue ou meublé longue durée, courte_duree si Airbnb/saisonnier/meublé tourisme mentionné"
}

Règles :
- Si l'annonce mentionne un immeuble de rapport avec plusieurs lots/appartements, crée un objet par lot dans le tableau "lots".
- Si seul le nombre de lots est mentionné sans détails, crée autant d'objets avec les champs à null.
- Si aucun lot n'est distingué mais que c'est un seul bien, crée un seul lot.
- Convertis toujours les surfaces en nombre décimal (ex: "45,5 m²" → 45.5).
- Convertis les prix en entiers sans espaces ni séparateurs (ex: "350 000 €" → 350000).
- Pour l'étage : RDC = 0, 1er = 1, 2ème = 2, etc.
- Si les loyers sont indiqués "HC" (hors charges), utilise quand même le montant pour loyerMensuel.
- Réponds UNIQUEMENT avec le JSON, sans commentaires.`;

async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  if (fileName.endsWith('.pdf')) {
    return extractTextFromPdfBuffer(await file.arrayBuffer());
  }

  if (fileName.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Type de fichier non supporté : ${fileName}. Utilisez PDF, TXT ou DOCX.`);
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Clé API OpenAI non configurée. Ajoutez OPENAI_API_KEY dans .env.local.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const text = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;

    let annonceText: string;

    if (text && text.trim().length > 0) {
      annonceText = text.trim();
    } else if (file) {
      annonceText = await extractTextFromFile(file);
    } else {
      return NextResponse.json(
        { error: 'Veuillez fournir un texte ou un fichier.' },
        { status: 400 }
      );
    }

    if (annonceText.length < 20) {
      return NextResponse.json(
        { error: 'Le texte est trop court pour extraire des informations utiles.' },
        { status: 400 }
      );
    }

    // Limit input to avoid excessive token usage
    const truncatedText = annonceText.slice(0, 8000);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: truncatedText },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Aucune réponse de l\'API OpenAI.' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Import annonce error:', message);
    return NextResponse.json(
      { error: `Erreur lors de l'import : ${message}` },
      { status: 500 }
    );
  }
}
