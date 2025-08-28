
// Product types
export * from './Product';

// Quote types
export * from './Quote';

// Blog types
export * from './Blog';

// Admin types
export * from './Admin';

// Re-export common types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface SearchFilters {
  searchTerm?: string;
  category?: string;
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}
