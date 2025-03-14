// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  handleConversationRequest, 
  Message 
} from '../../../services/conversationStorage';

// Verify wallet address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Use the handleConversationRequest to load conversation
    const result = await handleConversationRequest(walletAddress, 'load');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversation API GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract data from request body
    const body = await request.json();
    const { walletAddress, action, messages } = body;

    // Validate parameters
    if (!walletAddress || !action) {
      return NextResponse.json(
        { success: false, error: 'Wallet address and action are required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (!['load', 'save', 'clear'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be one of: load, save, clear' },
        { status: 400 }
      );
    }

    if (action === 'save' && (!messages || !Array.isArray(messages))) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required for save action' },
        { status: 400 }
      );
    }

    // Process the request
    const result = await handleConversationRequest(
      walletAddress,
      action as 'load' | 'save' | 'clear',
      messages as Message[]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversation API POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to clear the conversation (DELETE method)
export async function DELETE(request: NextRequest) {
  try {
    // Get wallet address from query string
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    // Check if address was provided and is valid
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Clear conversation for specific address
    const result = await handleConversationRequest(walletAddress, 'clear');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in conversation API DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}