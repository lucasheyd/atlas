// Este arquivo será o ponto de entrada da rota /murmuration

// Essas exportações são críticas para garantir o comportamento correto no Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Importe o componente cliente diretamente (importante)
import MurmurationPageGuard from '@/components/MurmurationPageGuard';

export default function MurmurationPage() {
  // O componente deve retornar apenas o componente cliente
  // Isso evita qualquer tentativa de executar código no servidor
  return <MurmurationPageGuard />;
}