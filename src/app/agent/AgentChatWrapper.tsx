"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Bot } from 'lucide-react';
import { useWallet } from '@/components/WalletConnect';

// Importar o chat dinamicamente para evitar problemas de SSR
const AgentChat = dynamic(() => import('@/components/AgentChat'), { 
  ssr: false,
  loading: () => (
    <div className="h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center text-indigo-600 dark:text-indigo-400">
        <Bot size={40} className="animate-pulse mb-4" />
        <p>Loading assistant...</p>
      </div>
    </div>
  )
});

export default function AgentChatWrapper() {
  const { isConnected } = useWallet();

  // Simply render the AgentChat component
  return <AgentChat />;
}