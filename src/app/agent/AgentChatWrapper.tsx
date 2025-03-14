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

  return (
    <div className="relative">
      <AgentChat />
      
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md">
            <Bot size={48} className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              To chat with the Synthesis agent and save your conversation history, 
              please connect your wallet using the button above.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your conversation history will be linked to your wallet address
              and securely stored.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}