export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: ResponseMeta;
}

export interface ResponseMeta {
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
