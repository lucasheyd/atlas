'use client';

import React, { Suspense } from 'react';
import MazeGame from '@/components/MazeGame';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Um componente de loading simples
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-400 mx-auto mb-4"></div>
      <p className="text-lg">Carregando jogo...</p>
    </div>
  </div>
);

const GamePage = () => {
  const router = useRouter();
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Simple header */}
      <header className="py-4 px-6 flex justify-between items-center bg-black/20">
        <div>
          <Link href="/" className="text-teal-400 hover:text-teal-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
        <div>
          <h1 className="text-xl font-bold">Maze Puzzle NFT</h1>
        </div>
        <div className="w-[100px]">
          {/* Empty div to balance the layout */}
        </div>
      </header>
      
      {/* Game container with Suspense */}
      <main>
        <Suspense fallback={<Loading />}>
          <MazeGame />
        </Suspense>
      </main>
      
      {/* Simple footer */}
      <footer className="py-4 px-6 text-center text-gray-400 text-sm mt-auto">
        <p>© {new Date().getFullYear()} Maze Puzzle NFT. Powered by the Base network.</p>
      </footer>
    </div>
  );
};

export default GamePage;