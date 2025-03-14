// src/services/conversationStorage.ts
import { createClient } from '@vercel/edge-config';

// Definição do tipo de mensagem
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

// Interface para a resposta da API
export interface ConversationResponse {
  success: boolean;
  messages?: Message[];
  error?: string;
}

// Inicializa o cliente Edge Config se disponível
let edgeConfig: ReturnType<typeof createClient> | null = null;

try {
  if (process.env.EDGE_CONFIG) {
    edgeConfig = createClient(process.env.EDGE_CONFIG);
    console.log('Edge Config initialized');
  } else {
    console.log('Edge Config not available - using local storage fallback');
  }
} catch (error) {
  console.error('Failed to initialize Edge Config:', error);
}

// Função para salvar a conversa de um usuário
export async function saveConversation(userAddress: string, messages: Message[]): Promise<boolean> {
  try {
    // Adiciona timestamp às mensagens que não tiverem
    const timestampedMessages = messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || Date.now()
    }));
    
    // Tenta salvar no Edge Config
    if (edgeConfig) {
      // Limitamos a 50 mensagens para garantir que não excedemos o limite do Edge Config
      const limitedMessages = timestampedMessages.slice(-50);
      
      // No Edge Config, usamos um objeto "conversations" que mapeia endereços de carteira para conversas
      let conversations = {};
      try {
        conversations = await edgeConfig.get('conversations') || {};
      } catch (error) {
        console.log('No existing conversations found, creating new storage object');
        conversations = {};
      }
      
      // Atualiza as conversas com as mensagens deste usuário
      conversations[userAddress.toLowerCase()] = limitedMessages;
      
      // Salva o objeto atualizado
      await edgeConfig.set('conversations', conversations);
      console.log(`Saved conversation for ${userAddress} to Edge Config`);
      return true;
    }
    
    // Fallback para localStorage quando não estamos em produção
    if (typeof window !== 'undefined') {
      localStorage.setItem(`conversation_${userAddress.toLowerCase()}`, JSON.stringify(timestampedMessages));
      console.log(`Saved conversation for ${userAddress} to localStorage`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return false;
  }
}

// Função para carregar a conversa de um usuário
export async function loadConversation(userAddress: string): Promise<Message[]> {
  try {
    // Tenta carregar do Edge Config
    if (edgeConfig) {
      const conversations = await edgeConfig.get('conversations') || {};
      const userConversation = conversations[userAddress.toLowerCase()] || [];
      console.log(`Loaded ${userConversation.length} messages for ${userAddress} from Edge Config`);
      return userConversation;
    }
    
    // Fallback para localStorage quando não estamos em produção
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`conversation_${userAddress.toLowerCase()}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as Message[];
        console.log(`Loaded ${parsedData.length} messages for ${userAddress} from localStorage`);
        return parsedData;
      }
    }
    
    // Se não encontrar nada, retorna uma lista vazia
    return [];
  } catch (error) {
    console.error('Error loading conversation:', error);
    return [];
  }
}

// Função para limpar a conversa de um usuário
export async function clearConversation(userAddress: string): Promise<boolean> {
  try {
    // Tenta limpar no Edge Config
    if (edgeConfig) {
      const conversations = await edgeConfig.get('conversations') || {};
      delete conversations[userAddress.toLowerCase()];
      await edgeConfig.set('conversations', conversations);
      console.log(`Cleared conversation for ${userAddress} in Edge Config`);
      return true;
    }
    
    // Fallback para localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`conversation_${userAddress.toLowerCase()}`);
      console.log(`Cleared conversation for ${userAddress} in localStorage`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return false;
  }
}

// API para gerenciar conversas
export async function handleConversationRequest(
  userAddress: string, 
  action: 'load' | 'save' | 'clear',
  messages?: Message[]
): Promise<ConversationResponse> {
  try {
    switch (action) {
      case 'load':
        const loadedMessages = await loadConversation(userAddress);
        return { success: true, messages: loadedMessages };
        
      case 'save':
        if (!messages) {
          return { success: false, error: 'No messages provided for saving' };
        }
        const saveResult = await saveConversation(userAddress, messages);
        return { success: saveResult };
        
      case 'clear':
        const clearResult = await clearConversation(userAddress);
        return { success: clearResult };
        
      default:
        return { success: false, error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Conversation storage error:', error);
    return { success: false, error: 'Storage operation failed' };
  }
}