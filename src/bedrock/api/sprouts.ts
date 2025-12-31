// src/bedrock/api/sprouts.ts
// Sprout API client for Bedrock capture flow
// Sprint: bedrock-foundation-v1 (Story 2.6)

import type { Sprout, SproutInput } from '../types/sprout';
import { createSprout } from '../types/sprout';

// =============================================================================
// API Response Types
// =============================================================================

export interface SproutApiResponse {
  success: boolean;
  data?: Sprout;
  error?: string;
}

export interface SproutsListResponse {
  success: boolean;
  data?: {
    sprouts: Sprout[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}

export interface SproutStatsResponse {
  success: boolean;
  data?: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    pendingCount: number;
  };
  error?: string;
}

// =============================================================================
// API Client
// =============================================================================

const API_BASE = '/api/sprouts';

/**
 * Create a new sprout
 */
export async function createSproutApi(input: SproutInput): Promise<SproutApiResponse> {
  try {
    // Create the GroveObject structure
    const sprout = createSprout(input.title, input.type, input.content, {
      source: input.source,
      fields: input.fields,
      tags: input.tags,
    });

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sprout),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.sprout,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get a single sprout by ID
 */
export async function getSprout(id: string): Promise<SproutApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.sprout,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * List sprouts with optional filters
 */
export async function listSprouts(options?: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<SproutsListResponse> {
  try {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.status) params.set('status', options.status);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.pageSize) params.set('pageSize', options.pageSize.toString());

    const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        sprouts: data.sprouts || [],
        total: data.total || 0,
        page: data.page || 1,
        pageSize: data.pageSize || 20,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Update a sprout
 */
export async function updateSprout(
  id: string,
  updates: Partial<Pick<Sprout, 'meta' | 'payload'>>
): Promise<SproutApiResponse> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.sprout,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Delete a sprout
 */
export async function deleteSprout(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get sprout statistics
 */
export async function getSproutStats(): Promise<SproutStatsResponse> {
  try {
    const response = await fetch(`${API_BASE}/stats`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        total: data.total || 0,
        byType: data.byType || {},
        byStatus: data.byStatus || {},
        pendingCount: data.pendingCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Search sprouts by semantic similarity
 */
export async function searchSprouts(
  query: string,
  options?: { limit?: number; threshold?: number }
): Promise<SproutsListResponse> {
  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: options?.limit || 10,
        threshold: options?.threshold || 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        sprouts: data.results || [],
        total: data.results?.length || 0,
        page: 1,
        pageSize: options?.limit || 10,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
