// app/api/agent-proxy/route.ts - Com logs de diagnóstico avançados
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
          error: 'Agent not configured. Please set NEXT_LOCAL_AGENT_URL in Vercel environment variables.',
          details: 'The deployment is missing the required environment variable to connect to the agent.'
        },
        { status: 503 }
      );
    }
    
    console.log('🌐 Attempting to connect to agent at:', LOCAL_AGENT_URL);
    
    // Try connecting to local agent with detailed error handling
    try {
      const response = await fetch(LOCAL_AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
          // Add a custom header for tracking
          'X-Agent-Request-Source': 'vercel-proxy'
        },
        body: JSON.stringify(body),
      });
      
      console.log('📡 Agent response status:', response.status);
      
      // If agent is not available
      if (!response.ok) {
        console.log('❌ Agent returned error status code:', response.status);
        
        // Try to read specific agent error
        try {
          const errorData = await response.json();
          console.log('🔍 Agent error details:', errorData);
          return NextResponse.json(
            { 
              error: errorData.error || 'Failed to connect to agent',
              details: 'The agent returned an error response.'
            },
            { status: response.status }
          );
        } catch (jsonError) {
          console.log('⚠️ Could not parse agent error response as JSON');
          // If can't read error, return generic error
          return NextResponse.json(
            { 
              error: 'Failed to connect to agent',
              details: 'Could not parse the agent error response.'
            },
            { status: response.status }
          );
        }
      }
      
      // Successful response
      const data = await response.json();
      console.log('✅ Successfully received agent response');
      return NextResponse.json(data);
      
    } catch (error) {
      console.error('❌ Connection error:', error);
      console.log('⚠️ Error details:', error.message || 'No error details available');
      
      // More detailed fallback response
      return NextResponse.json({
        success: true,
        message: "I'm Synthesis, the CEO and visionary behind several innovative NFT collections. While my connection to my knowledge base is temporarily limited, I can still assist with general questions about NFTs, blockchain technology, or digital art. (Error details: Failed to connect to agent at URL. Please check ngrok configuration and ensure agent is running.)"
      });
    }
    
  } catch (error) {
    console.error('💥 Agent proxy critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'Unknown error in agent proxy' 
      },
      { status: 500 }
    );
  }
}