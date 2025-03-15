import { createClient } from 'redis';

// Verifica se está no navegador
const isBrowser = typeof window !== 'undefined';

// Configuração do Redis
const redisClient = isBrowser 
  ? null 
  : createClient({
      url: process.env.REDIS_URL,
      // Configurações adicionais para ambientes não-navegador
    });

// Função de conexão
async function connectRedis() {
  // Se estiver no navegador, não faça nada
  if (isBrowser) return null;

  if (!redisClient.isOpen) {
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

// Modificar funções para lidar com o navegador
export async function loadConversation(userAddress: string): Promise<Message[]> {
  // Se estiver no navegador, retorne um array vazio ou implemente uma estratégia alternativa
  if (isBrowser) {
    return [];
  }

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

// Faça modificações similares para saveConversation e clearConversation
export async function saveConversation(userAddress: string, messages: Message[]): Promise<boolean> {
  if (isBrowser) {
    // Implemente um método de armazenamento alternativo, como localStorage
    try {
      localStorage.setItem(
        `conversation:${userAddress.toLowerCase()}`, 
        JSON.stringify(messages)
      );
      return true;
    } catch (error) {
      console.error('Erro ao salvar conversa no localStorage:', error);
      return false;
    }
  }

  // Resto do código de salvamento no servidor
  try {
    await connectRedis();
    const key = getConversationKey(userAddress);
    const limitedMessages = messages.slice(-50);
    await redisClient.set(key, JSON.stringify(limitedMessages));
    return true;
  } catch (error) {
    console.error('Erro ao salvar conversa:', error);
    return false;
  }
}