// app/api/agent-proxy/route.ts - Updated with English error messages
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Get environment variables
    const LOCAL_AGENT_URL = process.env.NEXT_LOCAL_AGENT_URL;
    const API_KEY = process.env.NEXT_AGENT_API_KEY;
    
    // Check if agent URL is configured
    if (!LOCAL_AGENT_URL) {
      return NextResponse.json(
        { error: 'Agent not configured. Please set NEXT_LOCAL_AGENT_URL in .env.local' },
        { status: 503 }
      );
    }
    
    // Try connecting to local agent
    try {
      const response = await fetch(LOCAL_AGENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
        },
        body: JSON.stringify(body),
      });
      
      // If agent is not available
      if (!response.ok) {
        // Try to read specific agent error
        try {
          const errorData = await response.json();
          return NextResponse.json(
            { error: errorData.error || 'Failed to connect to agent' },
            { status: response.status }
          );
        } catch {
          // If can't read error, return generic error
          return NextResponse.json(
            { error: 'Failed to connect to agent' },
            { status: response.status }
          );
        }
      }
      
      // Successful response
      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (error) {
      console.error('Error connecting to agent:', error);
      
      // Fallback response: for development without agent
      return NextResponse.json({
        success: true,
        message: "The agent is currently unavailable. This is a fallback response. To use the real agent, configure ngrok and update the NEXT_LOCAL_AGENT_URL variable in the .env.local file."
      });
    }
    
  } catch (error) {
    console.error('Agent proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}