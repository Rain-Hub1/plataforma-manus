import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=No-code-provided', req.url));
  }

  try {
    const response = await fetch('https://api.supabase.com/v1/oauth/token', {
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

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description);
    }
    
    const redirectUrl = new URL('/?status=supabase-connected', req.url);
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    const errorUrl = new URL(`/?error=${encodeURIComponent(error.message)}`, req.url);
    return NextResponse.redirect(errorUrl);
  }
}
