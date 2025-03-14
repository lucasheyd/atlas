// src/services/conversationStorage.ts
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

export async function loadConversation(userAddress: string): Promise<Message[]> {
  try {
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

export async function saveConversation(userAddress: string, messages: Message[]): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`conversation_${userAddress.toLowerCase()}`, JSON.stringify(messages));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving conversation:', error);
    return false;
  }
}

export async function clearConversation(userAddress: string): Promise<boolean> {
  try {
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