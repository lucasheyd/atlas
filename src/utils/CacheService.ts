// src/utils/CacheService.ts

/**
 * Interface para item de cache com TTL (tempo de vida)
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Serviço de cache na memória e persistente
 * Implementa cache em dois níveis:
 * 1. Memória (mais rápido, perdido após recarregar a página)
 * 2. localStorage (persistente, mantido entre recargas)
 */
export class CacheService {
  private static CACHE_PREFIX = 'crypto_atlas_';
  private static memoryCache = new Map<string, CacheItem<any>>();
  
  // TTLs padrão para diferentes tipos de dados
  static readonly TTL = {
    TOKEN_EXISTS: 12 * 60 * 60 * 1000,  // 12 horas
    NFT_DATA: 30 * 60 * 1000,           // 30 minutos
    TERRITORY_DATA: 5 * 60 * 1000,      // 5 minutos
    NETWORK_DATA: 24 * 60 * 60 * 1000,  // 24 horas
    CONTRACT_INFO: 12 * 60 * 60 * 1000, // 12 horas
    METADATA: 60 * 60 * 1000            // 1 hora
  };
  
  /**
   * Obtém um item do cache (primeiro memória, depois localStorage)
   * @param key A chave do item
   * @returns O valor armazenado ou null se não encontrado ou expirado
   */
  static get<T>(key: string): T | null {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    
    // Primeiro, verificar memória
    const memItem = this.memoryCache.get(fullKey);
    if (memItem) {
      // Verificar expiração
      if (Date.now() < memItem.timestamp + memItem.ttl) {
        return memItem.data;
      }
      
      // Se expirou, remover da memória
      this.memoryCache.delete(fullKey);
    }
    
    // Se não estiver na memória ou expirou, verificar localStorage
    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) return null;
      
      const item = JSON.parse(stored) as CacheItem<T>;
      
      // Verificar expiração
      if (Date.now() > item.timestamp + item.ttl) {
        localStorage.removeItem(fullKey);
        return null;
      }
      
      // Armazenar na memória para acelerar próximos acessos
      this.memoryCache.set(fullKey, item);
      
      return item.data;
    } catch (err) {
      console.debug('Falha ao recuperar do localStorage:', err);
      return null;
    }
  }
  
  /**
   * Armazena um item no cache (memória e localStorage)
   * @param key A chave do item
   * @param data Os dados a serem armazenados
   * @param ttl O tempo de vida em milissegundos
   * @param persistToStorage Se deve persistir para localStorage (padrão: true)
   */
  static set<T>(key: string, data: T, ttl: number, persistToStorage = true): void {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // Armazenar na memória
    this.memoryCache.set(fullKey, item);
    
    // Armazenar no localStorage
    if (persistToStorage) {
      try {
        localStorage.setItem(fullKey, JSON.stringify(item));
      } catch (err) {
        console.debug('Falha ao armazenar no localStorage:', err);
        
        // Em caso de cota excedida, limpar itens antigos
        if (err instanceof DOMException && (err.code === 22 || err.name === 'QuotaExceededError')) {
          this.clearOldItems();
          
          // Tentar novamente
          try {
            localStorage.setItem(fullKey, JSON.stringify(item));
          } catch {
            // Ignorar se ainda falhar
          }
        }
      }
    }
  }
  
  /**
   * Remove um item do cache (memória e localStorage)
   * @param key A chave do item
   */
  static remove(key: string): void {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    this.memoryCache.delete(fullKey);
    
    try {
      localStorage.removeItem(fullKey);
    } catch (err) {
      console.debug('Falha ao remover do localStorage:', err);
    }
  }
  
  /**
   * Limpa todos os itens de cache
   */
  static clear(): void {
    this.memoryCache.clear();
    
    try {
      // Remover apenas os itens do nosso prefixo
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.debug('Falha ao limpar localStorage:', err);
    }
  }
  
  /**
   * Limpa itens expirados ou mais antigos para liberar espaço
   */
  private static clearOldItems(): void {
    try {
      // Primeiro, remover itens expirados
      const keysToCheck = [];
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToCheck.push(key);
        }
      }
      
      // Coletar informações sobre os itens
      const items: { key: string; timestamp: number; ttl: number; expiry: number }[] = [];
      
      keysToCheck.forEach(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.timestamp && item.ttl) {
            items.push({
              key,
              timestamp: item.timestamp,
              ttl: item.ttl,
              expiry: item.timestamp + item.ttl
            });
          }
        } catch {
          // Ignorar itens mal-formados
          localStorage.removeItem(key);
        }
      });
      
      // Remover itens já expirados
      items.filter(item => now > item.expiry).forEach(item => localStorage.removeItem(item.key));
      
      // Se precisarmos de mais espaço, remover os 25% mais antigos
      if (items.length > 20) { // Limitar apenas se houver muitos itens
        items
          .sort((a, b) => a.timestamp - b.timestamp) // Ordenar pelo timestamp (mais antigos primeiro)
          .slice(0, Math.ceil(items.length * 0.25)) // Pegar os 25% mais antigos
          .forEach(item => localStorage.removeItem(item.key));
      }
    } catch (err) {
      console.debug('Falha ao limpar itens antigos:', err);
    }
  }
  
  /**
   * Atualiza o TTL de um item já existente no cache
   * @param key A chave do item
   * @param newTTL O novo TTL em milissegundos
   */
  static updateTTL(key: string, newTTL: number): void {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    
    // Atualizar na memória
    const memItem = this.memoryCache.get(fullKey);
    if (memItem) {
      memItem.ttl = newTTL;
    }
    
    // Atualizar no localStorage
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored) {
        const item = JSON.parse(stored);
        item.ttl = newTTL;
        localStorage.setItem(fullKey, JSON.stringify(item));
      }
    } catch (err) {
      console.debug('Falha ao atualizar TTL no localStorage:', err);
    }
  }
  
  /**
   * Verifica se um item específico existe no cache e não está expirado
   * @param key A chave do item
   * @returns true se o item existe e é válido, false caso contrário
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }
}