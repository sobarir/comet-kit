/**
 * The one error envelope. Every non-2xx response from the API has this
 * shape - produced by the global exception filter, consumed by the web
 * client's readApiError.
 */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  /** Field-level validation errors from Zod, when present. */
  errors?: Record<string, string[]>;
  requestId: string;
  path: string;
  timestamp: string;
}
