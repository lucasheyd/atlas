// src/services/conversationStorage.ts
import { createClient } from 'redis';

// Configuração do Redis
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Conectar ao Redis
async function connectRedis() {
  if (!redisClient.isOpen) {
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
}

// Tipo de Mensagem
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
};

// Chave para armazenamento
const getConversationKey = (userAddress: string) => 
  `conversation:${userAddress.toLowerCase()}`;

// Carregar conversa
export async function loadConversation(userAddress: string): Promise<Message[]> {
  try {
    await connectRedis();
    const key = getConversationKey(userAddress);
    const conversationJson = await redisClient.get(key);
    return conversationJson ? JSON.parse(conversationJson) : [];
  } catch (error) {
    console.error('Erro ao carregar conversa:', error);
    return [];
  }
}

// Salvar conversa
export async function saveConversation(userAddress: string, messages: Message[]): Promise<boolean> {
  try {
    await connectRedis();
    const key = getConversationKey(userAddress);
    
    // Limitar para últimas 50 mensagens
    const limitedMessages = messages.slice(-50);
    
    // Salvar como JSON
    await redisClient.set(key, JSON.stringify(limitedMessages));
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    return false;
  }
}

// Limpar conversa
export async function clearConversation(userAddress: string): Promise<boolean> {
  try {
    await connectRedis();
    const key = getConversationKey(userAddress);
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Erro ao limpar conversa:', error);
    return false;
  }
}

// Manipulador unificado de solicitações
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
          return { success: false, error: 'Nenhuma mensagem fornecida para salvar' };
        }
        const saveResult = await saveConversation(userAddress, messages);
        return { success: saveResult };
        
      case 'clear':
        const clearResult = await clearConversation(userAddress);
        return { success: clearResult };
        
      default:
        return { success: false, error: 'Ação inválida' };
    }
  } catch (error) {
    console.error('Erro no armazenamento de conversas:', error);
    return { success: false, error: 'Falha na operação de armazenamento' };
  }
}

// Garantir desconexão quando o processo terminar
process.on('SIGINT', async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
});