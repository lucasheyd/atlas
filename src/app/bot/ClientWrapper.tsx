'use client';

import dynamic from 'next/dynamic';

const TokenGate = dynamic(() => import('@/components/bot/TokenGate'), { 
  ssr: false 
});
const BotComponent = dynamic(() => import('@/components/bot/BotComponent'), { 
  ssr: false 
});

export default function ClientWrapper() {
  return (
    <TokenGate>
      <BotComponent />
    </TokenGate>
  );
}