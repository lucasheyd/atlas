// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleConversationRequest, Message } from '@/services/conversationStorage';

// Verificação básica de autenticação para proteção do endpoint
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function GET(request: NextRequest) {
  try {
    // Obter o endereço da carteira da query string
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    // Verificar se o endereço foi fornecido e é válido
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

    // Carregar conversas para o endereço específico
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
    // Extrair dados do corpo da solicitação
    const body = await request.json();
    const { walletAddress, action, messages } = body;

    // Validar parâmetros
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

    // Processar a solicitação
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

// Endpoint para limpar a conversa (método DELETE)
export async function DELETE(request: NextRequest) {
  try {
    // Obter o endereço da carteira da query string
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');

    // Verificar se o endereço foi fornecido e é válido
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

    // Limpar a conversa para o endereço específico
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