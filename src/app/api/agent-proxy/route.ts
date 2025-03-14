import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Detect environment
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    // Determine which agent URL to use
    let AGENT_URL;
    let API_KEY = process.env.NEXT_AGENT_API_KEY;
    
    if (isVercel && isProduction) {
      // In production on Vercel, use the internal API route
      AGENT_URL = `${process.env.VERCEL_URL || 'https://' + process.env.NEXT_PUBLIC_VERCEL_URL}/api/agent`;
      console.log('Using production internal API route:', AGENT_URL);
    } else {
      // In development, use the ngrok URL
      AGENT_URL = process.env.NEXT_LOCAL_AGENT_URL;
      
      // Check if agent URL is configured in development
      if (!AGENT_URL && !isProduction) {
        return NextResponse.json(
          { error: 'Agent not configured. Please set NEXT_LOCAL_AGENT_URL in .env.local' },
          { status: 503 }
        );
      }
    }
    
    // In production without explicit agent URL, provide a fallback response
    if (!AGENT_URL && isProduction) {
      return NextResponse.json({
        success: true,
        message: "I'm Synthesis, the CEO and visionary behind several innovative NFT collections including Fractal Swarm, Lunar Chronicles, Maze Puzzle, Murmuration 666, and Fractal Tree. I also created the SYNTH token on the Base network. How can I assist you today?"
      });
    }
    
    // Try connecting to the agent
    try {
      const response = await fetch(AGENT_URL, {
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
      
      // Fallback response for production or when agent is unavailable
      return NextResponse.json({
        success: true,
        message: "I'm Synthesis, the CEO and visionary behind several innovative NFT collections. While my connection to my knowledge base is temporarily limited, I can still assist with general questions about NFTs, blockchain technology, or digital art."
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