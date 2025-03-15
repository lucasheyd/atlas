// app/api/agent-diagnostics/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get environment variables
    const LOCAL_AGENT_URL = process.env.NEXT_LOCAL_AGENT_URL;
    const API_KEY = process.env.NEXT_AGENT_API_KEY;
    const ENV = process.env.NODE_ENV;
    const IS_VERCEL = process.env.VERCEL;
    const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
    
    // Test connectivity to agent
    let agentConnectivity = 'Not tested';
    let agentResponse = null;
    
    if (LOCAL_AGENT_URL) {
      try {
        // Use POST method with proper JSON body
        const testResponse = await fetch(LOCAL_AGENT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
          },
          body: JSON.stringify({ 
            message: "Hello from diagnostics", 
            userId: "system-check" 
          })
        });
        
        if (testResponse.ok) {
          agentConnectivity = 'Connected successfully';
          try {
            agentResponse = await testResponse.json();
          } catch (e) {
            agentResponse = 'Response received but not valid JSON';
          }
        } else {
          agentConnectivity = `Failed with status: ${testResponse.status}`;
          try {
            agentResponse = await testResponse.text();
          } catch (e) {
            agentResponse = 'Could not read response text';
          }
        }
      } catch (error) {
        agentConnectivity = `Connection error: ${error.message || 'Unknown error'}`;
      }
    }
    
    // Return diagnostics information
    return NextResponse.json({
      environment: {
        nodeEnv: ENV,
        isVercel: IS_VERCEL === '1',
        vercelUrl: VERCEL_URL
      },
      configuration: {
        agentUrlConfigured: !!LOCAL_AGENT_URL,
        agentUrl: LOCAL_AGENT_URL || 'Not configured',
        apiKeyConfigured: !!API_KEY
      },
      connectivity: {
        status: agentConnectivity,
        response: agentResponse
      },
      systemInfo: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Diagnostics error', details: error.message },
      { status: 500 }
    );
  }
}