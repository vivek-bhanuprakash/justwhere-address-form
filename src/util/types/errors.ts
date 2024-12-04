
export class JWError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWError";
  }
}

// Factory function for creating error classes
function createErrorClass(name: string) {
  return class extends JWError {
    constructor(message: string) {
      super(message);
      this.name = name;
    }
  };
}

// HTTP Error classes
export const JWErrorAuthenticationRequired = createErrorClass("JWErrorAuthenticationRequired");
export const JWErrorForbidden = createErrorClass("JWErrorForbidden");
export const JWErrorNotFound = createErrorClass("JWErrorNotFound");
export const JWErrorBadRequest = createErrorClass("JWErrorBadRequest");
export const JWErrorServerError = createErrorClass("JWErrorServerError");

// Other specific error classes
export const JWTemplateError = createErrorClass("JWTemplateError");
export const JWValidationError = createErrorClass("JWValidationError");

// Error mapping object
const errorMap: Record<number, new (message: string) => JWError> = {
  400: JWErrorBadRequest,
  401: JWErrorAuthenticationRequired,
  402: JWErrorBadRequest,
  403: JWErrorForbidden,
  404: JWErrorNotFound,
  500: JWErrorServerError,
};

/**
 * Throws appropriate JWError based on the error type
 * @param e - The error to process
 * @throws {JWError} - Appropriate error based on the input error
 */
export const throwError = (e: unknown): never => {
  if ((e as Error).name === "AxiosError") {
    const error = e as any;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle specific status codes
    if (status) {
      // Check for mapped errors
      const errorClass = errorMap[status];
      if (errorClass) {
        throw new errorClass(message);
      }
    }

    // If no specific status code handled, throw generic error
    throw new JWError(message);
  }

  if (e instanceof JWError) {
    throw e;
  }

  // Handle non-Axios errors
  if (e instanceof Error) {
    console.debug("JustWhere API: error thrown:", e);
    throw new JWError(e.message);
  }

  // Handle unknown error types
  throw new JWError("Unknown error occurred");
};

/**
 * Throws an appropriate JWError based on the HTTP status code
 * @param status - HTTP status code
 * @param message - Optional error message. If not provided, uses a default message
 * @throws {JWError} Appropriate error based on the status code
 */
export const throwErrorFromStatus = (status: number, message?: string): never => {
  const errorClass = errorMap[status];

  if (errorClass) {
    throw new errorClass(message || `HTTP Error ${status}`);
  }

  // For unhandled status codes, throw a generic server error
  throw new JWErrorServerError(message || `Unexpected HTTP status: ${status}`);
};

// Type guard for our custom errors
export function isJWError(error: unknown): error is JWError {
  return error instanceof JWError;
}
