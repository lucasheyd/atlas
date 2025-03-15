// app/api/agent-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log('📨 Request received:', JSON.stringify(body).substring(0, 100) + '...');
    
    // Get environment variables with detailed logging
    const LOCAL_AGENT_URL = process.env.NEXT_LOCAL_AGENT_URL;
    const API_KEY = process.env.NEXT_AGENT_API_KEY;
    const ENV = process.env.NODE_ENV;
    const IS_VERCEL = process.env.VERCEL;
    
    console.log('🔧 Environment:', {
      NODE_ENV: ENV,
      IS_VERCEL: IS_VERCEL,
      LOCAL_AGENT_URL_SET: !!LOCAL_AGENT_URL,
      API_KEY_SET: !!API_KEY
    });
    
    // Check if agent URL is configured
    if (!LOCAL_AGENT_URL) {
      console.log('⚠️ No agent URL configured!');
      return NextResponse.json(
        { 
          error: 'Agent not configured',
          details: 'NEXT_LOCAL_AGENT_URL is not set',
          retryAvailable: false
        },
        { status: 503 }
      );
    }
    
    // Ensure the URL ends with /api/agent
    const agentUrl = LOCAL_AGENT_URL.endsWith('/api/agent') 
      ? LOCAL_AGENT_URL 
      : `${LOCAL_AGENT_URL}/api/agent`;
    
    console.log('🌐 Attempting to connect to agent at:', agentUrl);
    
    // Configurar um timeout mais robusto
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    try {
      // Fazer a solicitação POST
      const response = await fetch(agentUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
          'X-Agent-Request-Source': 'vercel-proxy',
          'X-Timeout': '15000'
        },
        body: JSON.stringify(body),
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Agent response status:', response.status);
      
      // Se a resposta não for OK
      if (!response.ok) {
        console.log('❌ Agent returned error status code:', response.status);
        
        // Tenta ler o texto da resposta
        const errorText = await response.text();
        console.log('🔍 Error response text:', errorText);
        
        return NextResponse.json(
          { 
            error: 'Failed to connect to agent',
            details: errorText,
            retryAvailable: true
          },
          { status: response.status }
        );
      }
      
      // Resposta bem-sucedida
      const data = await response.json();
      console.log('✅ Successfully received agent response');
      return NextResponse.json(data);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Connection error:', error);
      
      // Determina se é um timeout ou outro erro de rede
      const isTimeout = error.name === 'AbortError';
      
      return NextResponse.json({
        success: false,
        message: isTimeout 
          ? "Sorry, the connection timed out. Please try again." 
          : "I'm Synthesis, the CEO and visionary behind several innovative NFT collections. While my connection to my knowledge base is temporarily limited, I can still assist with general questions about NFTs, blockchain technology, or digital art.",
        retryAvailable: true,
        isTimeout: isTimeout,
        errorDetails: error.message
      }, { status: isTimeout ? 408 : 500 });
    }
    
  } catch (error) {
    console.error('💥 Agent proxy critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'Unknown error in agent proxy',
        retryAvailable: false
      },
      { status: 500 }
    );
  }
}

// Adiciona suporte para método GET (útil para diagnóstico)
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Agent proxy is running',
    timestamp: new Date().toISOString()
  });
}