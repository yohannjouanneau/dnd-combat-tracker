// dnd5e-graphql-client.ts

import { DND_API_HOST } from "../constants";
import { MonsterFragments } from "./fragments";
import type { Monster } from "./types";

/**
 * D&D 5e SRD GraphQL API TypeScript Client
 * A type-safe, flexible GraphQL client for the D&D 5e API
 */

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface MonstersQueryResponse {
  monsters: Monster[];
}

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class GraphQLCache {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl: number;

  constructor(ttlMinutes: number = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  private generateKey(query: string, variables?: Record<string, any>): string {
    const varString = variables ? JSON.stringify(variables) : "";
    return `${query}:${varString}`;
  }

  get<T>(query: string, variables?: Record<string, any>): T | null {
    const key = this.generateKey(query, variables);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(query: string, data: T, variables?: Record<string, any>): void {
    const key = this.generateKey(query, variables);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
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
// GraphQL Client Configuration
// ============================================================================

export interface GraphQLClientConfig {
  endpoint?: string;
  cacheTTL?: number;
  enableCache?: boolean;
  defaultFragment?: string;
}

// ============================================================================
// Main GraphQL Client
// ============================================================================

export class DnD5eGraphQLClient {
  private endpoint: string;
  private cache: GraphQLCache | null;

  constructor(config: GraphQLClientConfig = {}) {
    this.endpoint = config.endpoint || `${DND_API_HOST}/graphql`;
    this.cache =
      config.enableCache !== false
        ? new GraphQLCache(config.cacheTTL || 60)
        : null;
  }

  /**
   * Execute a raw GraphQL query
   */
  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.get<T>(query, variables);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const result = (await response.json()) as GraphQLResponse<T>;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join(", ");
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }

      if (!result.data) {
        throw new Error("No data returned from GraphQL query");
      }

      // Cache the result
      if (this.cache) {
        this.cache.set(query, result.data, variables);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GraphQL query failed: ${error.message}`);
      }
      throw error;
    }
  }

  // ============================================================================
  // Monster Queries
  // ============================================================================

  /**
   * Search monsters by name (client-side filtering)
   */
  async searchMonsters(nameQuery: string): Promise<Monster[]> {
    const query = `
        ${MonsterFragments.MonsterBasic}
        query GetMonsters($name: String!) {
          monsters(name: $name) {
            ...MonsterBasic
          }
        }
      `;

    const response = await this.query<MonstersQueryResponse>(query, { name: nameQuery });
    return response.monsters;
  }

  // ============================================================================
  // Custom Query Builder
  // ============================================================================

  /**
   * Execute a custom query with full control
   */
  async customQuery<T>(
    queryName: string,
    queryBody: string,
    variables?: Record<string, any>
  ): Promise<T> {
    const query = `
        query ${queryName} ${
      variables ? this.buildVariableDefinitions(variables) : ""
    } {
          ${queryBody}
        }
      `;

    return this.query<T>(query, variables);
  }

  /**
   * Helper to build variable definitions from an object
   */
  private buildVariableDefinitions(variables: Record<string, any>): string {
    const defs = Object.keys(variables).map((key) => {
      const value = variables[key];
      const type =
        typeof value === "string"
          ? "String"
          : typeof value === "number"
          ? "Int"
          : typeof value === "boolean"
          ? "Boolean"
          : "String";
      return `$${key}: ${type}`;
    });

    return `(${defs.join(", ")})`;
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
// Convenience Factory
// ============================================================================

export function createGraphQLClient(
  config?: GraphQLClientConfig
): DnD5eGraphQLClient {
  return new DnD5eGraphQLClient(config);
}
