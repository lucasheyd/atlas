// Este arquivo será o ponto de entrada da rota /murmuration
'use client';

// Usamos cliente direto aqui - isso resolve problemas com build-time
import dynamic from 'next/dynamic';
import { Container } from "@/components/Container";

// Loading placeholder
function LoadingPlaceholder() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-gray-600 mb-4">Carregando...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    </Container>
  );
}

// Importação dinâmica do componente guardião sem SSR
const Guard = dynamic(() => import('@/components/MurmurationPageGuard'), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function MurmurationPage() {
  return <Guard />;
}