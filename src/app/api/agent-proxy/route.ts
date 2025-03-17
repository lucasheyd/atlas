// app/api/agent-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '../../pages/api/agent';

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
    
    // Don't modify the URL
    const agentUrl = LOCAL_AGENT_URL;
    
    console.log('🌐 Attempting to connect to agent at:', agentUrl);
    console.log('📦 Sending payload:', JSON.stringify(body).substring(0, 200));
    
    // Set a more robust timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increase to 30 seconds

    try {
      // Make the POST request
      const response = await fetch(agentUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
          'X-Agent-Request-Source': 'vercel-proxy',
          'X-Timeout': '30000'
        },
        body: JSON.stringify({
          // Ensure we send data in the format your agent expects
          message: body.message,
          userId: body.walletAddress || 'anonymous',
          // Pass any additional fields from the original request
          ...body
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
      
      // Successful response - try to parse JSON
      let data;
      try {
        const responseText = await response.text();
        console.log('📬 Raw response:', responseText.substring(0, 200));
        
        try {
          data = JSON.parse(responseText);
          console.log('✅ Successfully parsed JSON response');
        } catch (jsonError) {
          console.log('⚠️ Response is not valid JSON. Creating fallback response object.');
          // If not valid JSON, create a fallback response
          data = {
            success: true,
            message: responseText
          };
        }
      } catch (textError) {
        console.error('❌ Error reading response text:', textError);
        return NextResponse.json({
          success: false,
          message: "I received your message but had trouble processing the response.",
          retryAvailable: false
        }, { status: 200 }); // Return 200 to avoid triggering retries
      }
      
      return NextResponse.json(data);
      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Connection error:', error);
      
      // Determine if it's a timeout or another network error
      const isTimeout = error.name === 'AbortError';
      
      return NextResponse.json({
        success: false,
        message: isTimeout 
          ? "Sorry, the connection timed out. Please try again later." 
          : "I'm having trouble connecting to my knowledge base right now. Please try again later.",
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

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Agent proxy is running',
    timestamp: new Date().toISOString()
  });
}