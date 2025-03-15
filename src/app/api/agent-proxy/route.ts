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
    
    // MODIFIED: Don't append /api/agent to the URL if it's a direct ngrok URL
    // The agent is expecting requests directly to its endpoint
    const agentUrl = LOCAL_AGENT_URL;
    
    console.log('🌐 Attempting to connect to agent at:', agentUrl);
    
    // Set a more robust timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds

    try {
      // Make the POST request
      const response = await fetch(agentUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
          'X-Agent-Request-Source': 'vercel-proxy',
          'X-Timeout': '15000'
        },
        body: JSON.stringify(body.message ? body : {
      message: "Hello from diagnostic check",
      userId: "system-check"
       }),
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Agent response status:', response.status);
      
      // If the response is not OK
      if (!response.ok) {
        console.log('❌ Agent returned error status code:', response.status);
        
        // Try to read the response text
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
      
      // Successful response
      const data = await response.json();
      console.log('✅ Successfully received agent response');
      return NextResponse.json(data);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Connection error:', error);
      
      // Determine if it's a timeout or another network error
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

// Add support for GET method (useful for diagnostics)
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Agent proxy is running',
    timestamp: new Date().toISOString()
  });
}