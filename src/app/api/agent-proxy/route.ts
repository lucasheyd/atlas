// app/api/agent-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Log de diagnóstico
    console.log('Proxy Request:', {
      method: request.method,
      url: request.url,
      localAgentUrl: process.env.NEXT_LOCAL_AGENT_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    });

    // Importe o handler do agente diretamente
    const { default: agentHandler } = await import('@/pages/api/agent');

    // Recria o objeto de resposta do Next.js
    const res = {
      status: (statusCode) => ({
        json: (data) => ({ status: statusCode, data })
      })
    };

    // Chama o handler do agente diretamente
    const result = await agentHandler(request, res);
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Proxy Critical Error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}