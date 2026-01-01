// src/bedrock/patterns/GroveApi.ts
// REST client with GroveObject envelope handling
// Sprint: bedrock-foundation-v1 (Epic 2, Story 2.1)

import type { GroveObject, GroveObjectMeta, GroveObjectType } from '../../core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  meta: {
    count?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// =============================================================================
// GroveApi Class
// =============================================================================

export class GroveApi {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // ---------------------------------------------------------------------------
  // List objects
  // ---------------------------------------------------------------------------

  async list<T>(
    objectType: GroveObjectType,
    params?: ListParams
  ): Promise<ApiResponse<GroveObject<T>[]>> {
    const url = new URL(`${this.baseUrl}/${objectType}`, window.location.origin);

    if (params?.page) url.searchParams.set('page', String(params.page));
    if (params?.pageSize) url.searchParams.set('pageSize', String(params.pageSize));
    if (params?.sort) {
      url.searchParams.set('sortField', params.sort.field);
      url.searchParams.set('sortDirection', params.sort.direction);
    }
    if (params?.filters) {
      url.searchParams.set('filters', JSON.stringify(params.filters));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const json = await response.json();
    return this.unwrapListResponse<T>(json, objectType);
  }

  // ---------------------------------------------------------------------------
  // Get single object
  // ---------------------------------------------------------------------------

  async get<T>(
    objectType: GroveObjectType,
    id: string
  ): Promise<ApiResponse<GroveObject<T>>> {
    const response = await fetch(`${this.baseUrl}/${objectType}/${id}`);

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const json = await response.json();
    return this.unwrapSingleResponse<T>(json);
  }

  // ---------------------------------------------------------------------------
  // Create object
  // ---------------------------------------------------------------------------

  async create<T>(
    objectType: GroveObjectType,
    payload: T,
    meta?: Partial<GroveObjectMeta>
  ): Promise<ApiResponse<GroveObject<T>>> {
    const body = {
      payload,
      meta: {
        type: objectType,
        ...meta,
      },
    };

    const response = await fetch(`${this.baseUrl}/${objectType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const json = await response.json();
    return this.unwrapSingleResponse<T>(json);
  }

  // ---------------------------------------------------------------------------
  // Update via patch
  // ---------------------------------------------------------------------------

  async patch<T>(
    objectType: GroveObjectType,
    id: string,
    operations: PatchOperation[]
  ): Promise<ApiResponse<GroveObject<T>>> {
    const response = await fetch(`${this.baseUrl}/${objectType}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }

    const json = await response.json();
    return this.unwrapSingleResponse<T>(json);
  }

  // ---------------------------------------------------------------------------
  // Delete object
  // ---------------------------------------------------------------------------

  async delete(
    objectType: GroveObjectType,
    id: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${objectType}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw await this.handleError(response);
    }
  }

  // ---------------------------------------------------------------------------
  // Response unwrapping
  // ---------------------------------------------------------------------------

  private unwrapListResponse<T>(
    json: unknown,
    objectType: GroveObjectType
  ): ApiResponse<GroveObject<T>[]> {
    // Handle various API response formats
    if (Array.isArray(json)) {
      // Direct array response
      return {
        data: json.map(item => this.ensureGroveObject<T>(item, objectType)),
        meta: { count: json.length },
      };
    }

    const obj = json as Record<string, unknown>;

    // Standard envelope format
    if ('data' in obj && Array.isArray(obj.data)) {
      return {
        data: (obj.data as unknown[]).map(item =>
          this.ensureGroveObject<T>(item, objectType)
        ),
        meta: (obj.meta as ApiResponse<T>['meta']) || { count: (obj.data as unknown[]).length },
      };
    }

    // Object with type-keyed array (e.g., { lenses: [...] })
    const pluralKey = `${objectType}s`;
    if (pluralKey in obj && Array.isArray(obj[pluralKey])) {
      const items = obj[pluralKey] as unknown[];
      return {
        data: items.map(item => this.ensureGroveObject<T>(item, objectType)),
        meta: { count: items.length },
      };
    }

    // Fallback: empty response
    return { data: [], meta: { count: 0 } };
  }

  private unwrapSingleResponse<T>(json: unknown): ApiResponse<GroveObject<T>> {
    const obj = json as Record<string, unknown>;

    // Standard envelope format
    if ('data' in obj) {
      return {
        data: obj.data as GroveObject<T>,
        meta: (obj.meta as ApiResponse<T>['meta']) || {},
      };
    }

    // Direct object response
    return {
      data: json as GroveObject<T>,
      meta: {},
    };
  }

  private ensureGroveObject<T>(item: unknown, objectType: GroveObjectType): GroveObject<T> {
    const obj = item as Record<string, unknown>;

    // Already has meta/payload structure
    if ('meta' in obj && 'payload' in obj) {
      return item as GroveObject<T>;
    }

    // Flat object - convert to GroveObject structure
    const { id, type, title, createdAt, updatedAt, createdBy, status, tags, ...payload } = obj;

    return {
      meta: {
        id: (id as string) || crypto.randomUUID(),
        type: (type as GroveObjectType) || objectType,
        title: (title as string) || 'Untitled',
        createdAt: (createdAt as string) || new Date().toISOString(),
        updatedAt: (updatedAt as string) || new Date().toISOString(),
        createdBy: createdBy as GroveObjectMeta['createdBy'],
        status: status as GroveObjectMeta['status'],
        tags: tags as string[],
      },
      payload: payload as T,
    };
  }

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  private async handleError(response: Response): Promise<ApiError> {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: response.statusText };
    }

    const body = errorBody as Record<string, unknown>;

    return {
      code: (body.code as string) || `HTTP_${response.status}`,
      message: (body.message as string) || response.statusText,
      details: body.details as Record<string, unknown>,
    };
  }
}

// =============================================================================
// Singleton instance
// =============================================================================

export const groveApi = new GroveApi();
