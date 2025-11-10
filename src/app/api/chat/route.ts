import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Parse from 'parse/node';

// Inicializa o Parse para uso no backend
Parse.initialize(
  process.env.NEXT_PUBLIC_BACK4APP_APP_ID!,
  process.env.NEXT_PUBLIC_BACK4APP_JS_KEY!,
  process.env.BACK4APP_MASTER_KEY!
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// Inicializa o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Simples função para descriptografar (em um projeto real, use uma biblioteca como 'crypto-js')
function decrypt(encryptedText: string, key: string): string {
  const parts = encryptedText.split('::');
  const text = Buffer.from(parts[0], 'base64').toString('utf8');
  const storedKey = Buffer.from(parts[1], 'base64').toString('utf8');
  if (storedKey !== key) {
    throw new Error("Invalid decryption key");
  }
  return text;
}

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get('parse_session_token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // Autentica o usuário e busca a conexão com o Supabase
    const userQuery = new Parse.Query('_User');
    const currentUser = await userQuery.first({ sessionToken });
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
    }

    const SupabaseConnection = Parse.Object.extend('SupabaseConnection');
    const connQuery = new Parse.Query(SupabaseConnection);
    connQuery.equalTo('owner', currentUser);
    const connection = await connQuery.first({ useMasterKey: true });

    if (!connection) {
      return NextResponse.json({ error: 'Supabase connection not found for this user.' }, { status: 403 });
    }
    
    // AQUI: Futuramente, vamos descriptografar os tokens e usá-los.
    // Por enquanto, apenas confirmamos que a conexão existe.

    // Prepara o prompt para o Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const fullPrompt = `Você é Manus, uma IA especialista em Supabase. O usuário te deu o seguinte comando: "${prompt}". Por enquanto, apenas responda ao comando de forma teórica, sem executar nada. Explique o que você faria no Supabase para atender ao pedido.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error: any) {
    console.error('API Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
