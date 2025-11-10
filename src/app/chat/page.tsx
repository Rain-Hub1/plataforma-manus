'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parse';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = Parse.User.current();
    if (!user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const userMessage = { role: 'user' as const, text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error('A resposta da rede não foi OK.');
      }

      const data = await response.json();
      const modelMessage = { role: 'model' as const, text: data.reply };
      setChatHistory(prev => [...prev, modelMessage]);

    } catch (error) {
      const errorMessage = { role: 'model' as const, text: 'Desculpe, ocorreu um erro ao me comunicar com a IA.' };
      setChatHistory(prev => [...prev, errorMessage]);
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 border-b border-gray-700 text-center">
        <h1 className="text-xl font-bold">Manus IA</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <textarea
            className="flex-1 bg-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite seu comando para a IA..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-semibold disabled:bg-gray-500"
            disabled={isSending || !message.trim()}
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </footer>
    </div>
  );
}
