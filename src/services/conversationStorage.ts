import { createClient } from '@vercel/edge-config';

// Message type definition
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

// Ensure Edge Config client is created only on the server
let edgeConfig: ReturnType<typeof createClient> | null = null;

try {
  if (typeof window === 'undefined' && process.env.EDGE_CONFIG) {
    edgeConfig = createClient(process.env.EDGE_CONFIG);
  }
} catch (error) {
  console.error('Failed to initialize Edge Config:', error);
}

// Load conversation for a specific wallet address
export async function loadConversation(userAddress: string): Promise<Message[]> {
  try {
    // Server-side Edge Config storage
    if (edgeConfig) {
      const conversations = await edgeConfig.get('conversations') || {};
      return conversations[userAddress.toLowerCase()] || [];
    }
    
    // Fallback for client-side (browser)
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`conversation_${userAddress.toLowerCase()}`);
      return savedData ? JSON.parse(savedData) : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error loading conversation:', error);
    return [];
  }
}

// Save conversation for a specific wallet address
export async function saveConversation(userAddress: string, messages: Message[]): Promise<boolean> {
  try {
    // Limit messages to prevent storage overflow
    const limitedMessages = messages.slice(-50);
    
    // Server-side Edge Config storage
    if (edgeConfig) {
      const conversations = await edgeConfig.get('conversations') || {};
      conversations[userAddress.toLowerCase()] = limitedMessages;
      await edgeConfig.set('conversations', conversations);
      return true;
    }
    
    // Fallback for client-side (browser)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`conversation_${userAddress.toLowerCase()}`, JSON.stringify(limitedMessages));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return false;
  }
}

// Clear conversation for a specific wallet address
export async function clearConversation(userAddress: string): Promise<boolean> {
  try {
    // Server-side Edge Config storage
    if (edgeConfig) {
      const conversations = await edgeConfig.get('conversations') || {};
      delete conversations[userAddress.toLowerCase()];
      await edgeConfig.set('conversations', conversations);
      return true;
    }
    
    // Fallback for client-side (browser)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`conversation_${userAddress.toLowerCase()}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error clearing conversation:', error);
    return false;
  }
}

// Unified handler for conversation requests
export async function handleConversationRequest(
  userAddress: string, 
  action: 'load' | 'save' | 'clear',
  messages?: Message[]
): Promise<{ success: boolean, messages?: Message[], error?: string }> {
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