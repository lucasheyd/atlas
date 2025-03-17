// src/utils/CacheService.ts

/**
 * Interface for item of cache with TTL (time of life)
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Simple cache service with memory and localStorage support
 */
export class CacheService {
  private static CACHE_PREFIX = 'crypto_atlas_';
  private static memoryCache = new Map<string, CacheItem<any>>();
  
  /**
   * Gets an item from cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  static get<T>(key: string): T | null {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    
    // Check memory cache first (faster)
    const memItem = this.memoryCache.get(fullKey);
    if (memItem) {
      // Check if expired
      if (Date.now() < memItem.timestamp + memItem.ttl) {
        return memItem.data;
      }
      // Remove if expired
      this.memoryCache.delete(fullKey);
    }
    
    // Try localStorage if not in memory or expired
    try {
      const stored = localStorage.getItem(fullKey);
      if (!stored) return null;
      
      const item = JSON.parse(stored) as CacheItem<T>;
      
      // Check if expired
      if (Date.now() > item.timestamp + item.ttl) {
        localStorage.removeItem(fullKey);
        return null;
      }
      
      // Also store in memory for faster access next time
      this.memoryCache.set(fullKey, item);
      
      return item.data;
    } catch (error) {
      console.debug('Error retrieving from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Stores an item in cache
   * @param key Cache key
   * @param data Data to store
   * @param ttl Time to live in milliseconds
   */
  static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // Store in memory cache
    this.memoryCache.set(fullKey, item);
    
    // Try to store in localStorage for persistence
    try {
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (error) {
      console.debug('Error storing in localStorage:', error);
      
      // If quota exceeded, clear older items and try again
      if (error instanceof DOMException && 
         (error.code === 22 || error.name === 'QuotaExceededError')) {
        this.clearOldItems();
        
        try {
          localStorage.setItem(fullKey, JSON.stringify(item));
        } catch (e) {
          // Ignore if still fails
        }
      }
    }
  }
  
  /**
   * Removes an item from cache
   * @param key Cache key
   */
  static remove(key: string): void {
    const fullKey = `${this.CACHE_PREFIX}${key}`;
    this.memoryCache.delete(fullKey);
    
    try {
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.debug('Error removing from localStorage:', error);
    }
  }
  
  /**
   * Checks if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Clears all cached items
   */
  static clearAll(): void {
    this.memoryCache.clear();
    
    try {
      // Only clear items with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.debug('Error clearing localStorage:', error);
    }
  }
  
  /**
   * Removes old items to free up space
   * Strategy: Remove expired items first, then oldest items
   */
  private static clearOldItems(): void {
    try {
      const itemsToCheck: { key: string; timestamp: number }[] = [];
      
      // Find all our cache items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (item.timestamp) {
              itemsToCheck.push({ key, timestamp: item.timestamp });
            }
          } catch (e) {
            // If item is corrupt, remove it
            localStorage.removeItem(key);
          }
        }
      }
      
      // Sort by age (oldest first)
      itemsToCheck.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest 25% if we have many items
      if (itemsToCheck.length > 20) {
        const toRemove = Math.ceil(itemsToCheck.length * 0.25);
        itemsToCheck.slice(0, toRemove).forEach(item => {
          localStorage.removeItem(item.key);
        });
      }
    } catch (error) {
      console.debug('Error clearing old items:', error);
    }
  }
}