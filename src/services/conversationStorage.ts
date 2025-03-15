// src/services/conversationStorage.ts
// This version is meant to run only on the server side

import { createClient } from 'redis';

// Type definitions
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
async function connectRedis() {
  // Safety check to ensure this only runs server-side
  if (typeof window !== 'undefined') {
    console.warn('Warning: Attempted to connect to Redis from browser environment');
    return;
  }
  
  if (!redisClient.isOpen) {
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
}

// Handle conversation request (load, save, clear)
export async function handleConversationRequest(
  walletAddress: string,
  action: 'load' | 'save' | 'clear',
  messages?: Message[]
) {
  try {
    // Ensure Redis is connected
    await connectRedis();
    
    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();
    const key = `conversation:${normalizedAddress}`;
    
    // Perform the requested action
    switch (action) {
      case 'load':
        const data = await redisClient.get(key);
        return {
          success: true,
          messages: data ? JSON.parse(data) : []
        };
        
      case 'save':
        if (!messages || !Array.isArray(messages)) {
          return {
            success: false,
            error: 'No valid messages provided for saving'
          };
        }
        await redisClient.set(key, JSON.stringify(messages));
        return { success: true };
        
      case 'clear':
        await redisClient.del(key);
        return { success: true };
        
      default:
        return {
          success: false,
          error: 'Invalid action'
        };
    }
  } catch (error) {
    console.error(`Error in conversation storage (${action}):`, error);
    return {
      success: false,
      error: 'Operation failed due to server error'
    };
  }
}

// The following functions are kept for backward compatibility but now use the API
// These are only safe to use server-side, not in client components

export async function loadConversation(walletAddress: string): Promise<Message[]> {
  if (typeof window !== 'undefined') {
    console.warn('Warning: Direct Redis call attempted from browser. Use API endpoint instead.');
    return [];
  }
  
  const result = await handleConversationRequest(walletAddress, 'load');
  return result.success ? result.messages : [];
}

export async function saveConversation(walletAddress: string, messages: Message[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    console.warn('Warning: Direct Redis call attempted from browser. Use API endpoint instead.');
    return false;
  }
  
  const result = await handleConversationRequest(walletAddress, 'save', messages);
  return result.success;
}

export async function clearConversation(walletAddress: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    console.warn('Warning: Direct Redis call attempted from browser. Use API endpoint instead.');
    return false;
  }
  
  const result = await handleConversationRequest(walletAddress, 'clear');
  return result.success;
}