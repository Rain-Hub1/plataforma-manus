'use client';

import { useState } from 'react';
import Parse from '@/lib/parse';
import { useRouter } from 'next/navigation';

async function setSessionCookie(sessionToken: string | undefined) {
  if (sessionToken) {
    document.cookie = `parse_session_token=${sessionToken}; path=/; SameSite=Lax;`;
  } else {
    document.cookie = 'parse_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  }
}

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    try {
      const signedUpUser = await user.signUp();
      await setSessionCookie(signedUpUser.getSessionToken());
      router.push('/'); // Redireciona para a página principal após o cadastro
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-xs">
        <h1 className="text-3xl text-white text-center mb-6">Criar Conta - Plataforma Manus</h1>
        <div className="bg-gray-800 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <input className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline" type="text" placeholder="Escolha um usuário" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="mb-6">
            <input className="shadow appearance-none border rounded w-full py-3 px-4 bg-gray-700 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline" type="password" placeholder="Crie uma senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={handleSignUp} className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline">
              Cadastrar
            </button>
            <a href="/login" className="text-center bg-transparent text-sm text-blue-400 hover:text-blue-600">
              Já tem uma conta? Faça login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
