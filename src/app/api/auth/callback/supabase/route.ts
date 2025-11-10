import { NextRequest, NextResponse } from 'next/server';
import Parse from 'parse/node';

Parse.initialize(
  process.env.NEXT_PUBLIC_BACK4APP_APP_ID!,
  process.env.NEXT_PUBLIC_BACK4APP_JS_KEY!,
  process.env.BACK4APP_MASTER_KEY! 
);
Parse.serverURL = 'https://parseapi.back4app.com/';

// Simples função de criptografia (em um projeto real, use uma biblioteca como 'crypto-js')
function encrypt(text: string, key: string): string {
  return Buffer.from(text).toString('base64') + '::' + Buffer.from(key).toString('base64');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const sessionToken = req.cookies.get('parse_session_token')?.value;

  if (!code || !sessionToken) {
    return NextResponse.redirect(new URL('/?error=Missing-code-or-session', req.url));
  }

  try {
    let currentUser;
    try {
      currentUser = await new Parse.Query('_User').first({ sessionToken });
      if (!currentUser) throw new Error('Invalid session token.');
    } catch (err) {
       return NextResponse.redirect(new URL('/?error=Invalid-session', req.url));
    }

    const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.SUPABASE_OAUTH_CLIENT_ID,
        client_secret: process.env.SUPABASE_OAUTH_CLIENT_SECRET,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/supabase`,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description);

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) throw new Error('Encryption key is not set.');

    const encryptedAccessToken = encrypt(tokenData.access_token, encryptionKey);
    const encryptedRefreshToken = encrypt(tokenData.refresh_token, encryptionKey);

    const SupabaseConnection = Parse.Object.extend('SupabaseConnection');
    const query = new Parse.Query(SupabaseConnection);
    query.equalTo('owner', currentUser);
    const existingConnection = await query.first({ useMasterKey: true });

    const connection = existingConnection || new SupabaseConnection();
    
    connection.set('owner', currentUser);
    connection.set('accessToken', encryptedAccessToken);
    connection.set('refreshToken', encryptedRefreshToken);
    
    await connection.save(null, { useMasterKey: true });

    const redirectUrl = new URL('/?status=supabase-connected-successfully', req.url);
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    const errorUrl = new URL(`/?error=${encodeURIComponent(error.message)}`, req.url);
    return NextResponse.redirect(errorUrl);
  }
}
