'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parse';

async function setSessionCookie(sessionToken: string | undefined) {
  if (sessionToken) {
    document.cookie = `parse_session_token=${sessionToken}; path=/; SameSite=Lax;`;
  } else {
    document.cookie = 'parse_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  }
}

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<Parse.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSupabaseConnection, setHasSupabaseConnection] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const user = Parse.User.current();
      setCurrentUser(user || null);
      await setSessionCookie(user?.getSessionToken());

      if (user) {
        const SupabaseConnection = Parse.Object.extend('SupabaseConnection');
        const query = new Parse.Query(SupabaseConnection);
        query.equalTo('owner', user);
        const connection = await query.first();
        setHasSupabaseConnection(!!connection);
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const handleSignUp = async () => {
    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    try {
      const signedUpUser = await user.signUp();
      setCurrentUser(signedUpUser);
      await setSessionCookie(signedUpUser.getSessionToken());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      const user = await Parse.User.logIn(username, password);
      setCurrentUser(user);
      await setSessionCookie(user.getSessionToken());
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await Parse.User.logOut();
    setCurrentUser(null);
    await setSessionCookie(undefined);
  };

  const handleConnectSupabase = () => {
    const supabaseAuthUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
    supabaseAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_SUPABASE_OAUTH_CLIENT_ID!);
    supabaseAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/supabase`);
    supabaseAuthUrl.searchParams.set('response_type', 'code');
    window.location.href = supabaseAuthUrl.toString();
  };

  if (isLoading) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (currentUser) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo, {currentUser.get('username')}</h1>
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-xs">
        <h1 className="text-3xl text-white text-center mb-6">Plataforma Manus</h1>
        <div className="bg-gray-800 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="mb-6">
            <input className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline">
              Entrar
            </button>
            <button onClick={handleSignUp} className="bg-transparent text-sm text-blue-400 hover:text-blue-600">
              Criar Conta
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
