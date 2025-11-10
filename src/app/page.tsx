'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parse';
import { useRouter } from 'next/navigation';

async function setSessionCookie(sessionToken: string | undefined) {
  if (sessionToken) {
    document.cookie = `parse_session_token=${sessionToken}; path=/; SameSite=Lax;`;
  } else {
    document.cookie = 'parse_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  }
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<Parse.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSupabaseConnection, setHasSupabaseConnection] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const user = Parse.User.current();
      if (!user) {
        router.push('/login');
        return;
      }
      
      setCurrentUser(user);
      await setSessionCookie(user.getSessionToken());

      const SupabaseConnection = Parse.Object.extend('SupabaseConnection');
      const query = new Parse.Query(SupabaseConnection);
      query.equalTo('owner', user);
      const connection = await query.first();
      setHasSupabaseConnection(!!connection);
      
      setIsLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await Parse.User.logOut();
    setCurrentUser(null);
    await setSessionCookie(undefined);
    router.push('/login');
  };

  const handleConnectSupabase = () => {
    const supabaseAuthUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
    supabaseAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_SUPABASE_OAUTH_CLIENT_ID!);
    supabaseAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/supabase`);
    supabaseAuthUrl.searchParams.set('response_type', 'code');
    window.location.href = supabaseAuthUrl.toString();
  };

  if (isLoading || !currentUser) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white text-center">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="mb-8">Bem-vindo, {currentUser.get('username')}</p>
      
      {hasSupabaseConnection ? (
        <div className="bg-green-900 border border-green-700 p-4 rounded-lg mb-8">
          <p>✅ Conexão com Supabase ativa!</p>
          <a href="/chat" className="text-blue-400 hover:underline mt-2 inline-block">Ir para o Chat</a>
        </div>
      ) : (
        <>
          <p className="mb-8">Conecte seu projeto Supabase para começar.</p>
          <button onClick={handleConnectSupabase} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg mb-4 w-full max-w-xs">
            Conectar com Supabase
          </button>
        </>
      )}
      
      <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full max-w-xs mt-4">
        Sair
      </button>
    </main>
  );
}
