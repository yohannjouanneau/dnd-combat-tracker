// dnd5e-client.ts

/**
 * D&D 5e SRD API TypeScript Client (https://www.dnd5eapi.co/)
 * A lightweight, type-safe client for the D&D 5e API
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface APIReference {
    index: string;
    name: string;
    url: string;
  }
  
  export interface MonsterSpeed {
    walk?: string;
    swim?: string;
    fly?: string;
    burrow?: string;
    climb?: string;
  }
  
  export interface MonsterAbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  }
  
  export interface MonsterProficiency {
    value: number;
    proficiency: APIReference;
  }
  
  export interface MonsterSenses {
    passive_perception: number;
    blindsight?: string;
    darkvision?: string;
    tremorsense?: string;
    truesight?: string;
  }
  
  export interface MonsterAction {
    name: string;
    desc: string;
    attack_bonus?: number;
    damage?: Array<{
      damage_type: APIReference;
      damage_dice: string;
    }>;
    dc?: {
      dc_type: APIReference;
      dc_value: number;
      success_type: string;
    };
  }
  
  export interface MonsterSpecialAbility {
    name: string;
    desc: string;
    usage?: {
      type: string;
      times?: number;
      rest_types?: string[];
    };
  }
  
  export interface Monster {
    index: string;
    name: string;
    size: string;
    type: string;
    subtype?: string;
    alignment: string;
    armor_class: Array<{
      type: string;
      value: number;
    }>;
    hit_points: number;
    hit_dice: string;
    hit_points_roll: string;
    speed: MonsterSpeed;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    proficiencies: MonsterProficiency[];
    damage_vulnerabilities: string[];
    damage_resistances: string[];
    damage_immunities: string[];
    condition_immunities: APIReference[];
    senses: MonsterSenses;
    languages: string;
    challenge_rating: number;
    proficiency_bonus: number;
    xp: number;
    special_abilities?: MonsterSpecialAbility[];
    actions?: MonsterAction[];
    legendary_actions?: MonsterAction[];
    reactions?: MonsterAction[];
    url: string;
  }
  
  export interface MonsterListItem {
    index: string;
    name: string;
    url: string;
  }
  
  export interface MonsterList {
    count: number;
    results: MonsterListItem[];
  }
  
  // ============================================================================
  // Cache Implementation
  // ============================================================================
  
  interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  
  class InMemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private ttl: number; // Time to live in milliseconds
  
    constructor(ttlMinutes: number = 60) {
      this.ttl = ttlMinutes * 60 * 1000;
    }
  
    get<T>(key: string): T | null {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }
  
      // Check if entry has expired
      if (Date.now() - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        return null;
      }
  
      return entry.data as T;
    }
  
    set<T>(key: string, data: T): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  
    clear(): void {
      this.cache.clear();
    }
  
    size(): number {
      return this.cache.size;
    }
  }
  
  // ============================================================================
  // API Client
  // ============================================================================
  
  export interface DnD5eClientConfig {
    baseURL?: string;
    cacheTTL?: number; // Cache time-to-live in minutes
    enableCache?: boolean;
  }
  
  export class DnD5eClient {
    private baseURL: string;
    private cache: InMemoryCache | null;
  
    constructor(config: DnD5eClientConfig = {}) {
      this.baseURL = config.baseURL || 'https://www.dnd5eapi.co/api';
      this.cache = config.enableCache !== false 
        ? new InMemoryCache(config.cacheTTL || 60)
        : null;
    }
  
    /**
     * Make a GET request to the API
     */
    private async request<T>(endpoint: string): Promise<T> {
      // Check cache first
      if (this.cache) {
        const cached = this.cache.get<T>(endpoint);
        if (cached) {
          return cached;
        }
      }
  
      const url = `${this.baseURL}${endpoint}`;
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
  
        const data = await response.json() as T;
  
        // Cache the result
        if (this.cache) {
          this.cache.set(endpoint, data);
        }
  
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to fetch from D&D 5e API: ${error.message}`);
        }
        throw error;
      }
    }
  
    // ============================================================================
    // Monster Methods
    // ============================================================================
  
    /**
     * Get a list of all monsters
     */
    async getMonsters(): Promise<MonsterList> {
      return this.request<MonsterList>('/monsters');
    }
  
    /**
     * Get a specific monster by index
     * @param index - The monster index (e.g., "aboleth", "ancient-black-dragon")
     */
    async getMonster(index: string): Promise<Monster> {
      return this.request<Monster>(`/monsters/${index}`);
    }
  
    /**
     * Search monsters by name (client-side filtering)
     * @param query - Search query
     */
    async searchMonsters(query: string): Promise<MonsterListItem[]> {
      const list = await this.getMonsters();
      const lowerQuery = query.toLowerCase();
      
      return list.results.filter(monster => 
        monster.name.toLowerCase().includes(lowerQuery)
      );
    }
  
    // ============================================================================
    // Utility Methods
    // ============================================================================
  
    /**
     * Clear the cache
     */
    clearCache(): void {
      this.cache?.clear();
    }
  
    /**
     * Get cache size
     */
    getCacheSize(): number {
      return this.cache?.size() || 0;
    }
  
    /**
     * Check if caching is enabled
     */
    isCacheEnabled(): boolean {
      return this.cache !== null;
    }
  }
  
  // ============================================================================
  // Convenience Functions
  // ============================================================================
  
  /**
   * Create a default client instance
   */
  export function createClient(config?: DnD5eClientConfig): DnD5eClient {
    return new DnD5eClient(config);
  }
  
  // ============================================================================
  // Example Usage
  // ============================================================================
  
  /*
  import { DnD5eClient } from './dnd5e-client';
  
  // Create a client with default settings (caching enabled, 60 min TTL)
  const client = new DnD5eClient();
  
  // Or customize the configuration
  const customClient = new DnD5eClient({
    cacheTTL: 30,        // Cache for 30 minutes
    enableCache: true    // Enable caching
  });
  
  // Get all monsters
  const monsters = await client.getMonsters();
  console.log(`Total monsters: ${monsters.count}`);
  
  // Get a specific monster
  const aboleth = await client.getMonster('aboleth');
  console.log(`${aboleth.name} - CR ${aboleth.challenge_rating}`);
  console.log(`HP: ${aboleth.hit_points}, AC: ${aboleth.armor_class[0].value}`);
  
  // Search for monsters
  const dragons = await client.searchMonsters('dragon');
  console.log(`Found ${dragons.length} dragons`);
  
  // Cache management
  console.log(`Cache size: ${client.getCacheSize()} entries`);
  client.clearCache();
  */