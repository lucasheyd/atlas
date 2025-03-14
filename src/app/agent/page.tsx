// app/agent/page.tsx
import React from 'react';
import { Container } from '@/components/Container';
import { SectionTitle } from '@/components/SectionTitle';
import { Bot, Sparkles, LineChart, PenTool, Palette, Layers } from 'lucide-react';
import dynamic from 'next/dynamic';
import { WalletProvider } from '@/components/WalletConnect';

// Importar componentes dinamicamente para evitar erros de SSR com window.ethereum
const AgentChatWrapper = dynamic(() => import('./AgentChatWrapper'), { ssr: false });
const ConnectWalletButton = dynamic(() => import('@/components/WalletConnect').then(mod => mod.ConnectWalletButton), { ssr: false });

export default function AgentPage() {
  return (
    <WalletProvider>
      <div className="py-12 bg-white dark:bg-gray-900">
        <Container>
          <div className="flex justify-between items-center mb-8">
            <SectionTitle
              preTitle="AI CEO/Artist"
              title="Your intelligent NFT advisor">
              Chat with our specialized assistant to get insights about NFTs, 
              blockchain, and digital art. Your conversations are securely stored 
              and linked to your wallet address.
            </SectionTitle>
            
            <div className="hidden md:block">
              <ConnectWalletButton />
            </div>
          </div>
          
          <div className="md:hidden mb-6 flex justify-center">
            <ConnectWalletButton />
          </div>
          
          <div className="max-w-4xl mx-auto mt-8">
            <AgentChatWrapper />
          </div>
          
          <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Marketing Strategies</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get detailed marketing plans to promote your NFT collections and reach the right audience.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <LineChart size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Market Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Understand current NFT market trends and receive insights about emerging opportunities.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4 text-pink-600 dark:text-pink-400">
                <PenTool size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Creative Direction</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get ideas and creative guidance for developing new NFT art concepts.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Technical Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get answers about technical aspects of NFTs, smart contracts, and blockchain integrations.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                <Palette size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Collection Ideation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Develop innovative concepts for new NFT collections with unique and appealing characteristics.
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Roadmap Planning</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get help creating detailed development roadmaps for your NFT projects.
              </p>
            </div>
          </div>
        </Container>
      </div>
    </WalletProvider>
  );
}