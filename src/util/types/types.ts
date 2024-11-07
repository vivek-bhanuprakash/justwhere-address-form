import { isAxiosError } from "axios";
import { Configuration } from "../internal/sdk";
import { JWError, JWValidationError, throwError } from "./errors";

export type UserID = string;
export type IndividualID = string;
export type AddressID = string;
export type SecureContentID = string;
export type ServiceProviderID = string;
export type BeneficiaryID = string;
export type OwnerToken = string;
export type PrimaryToken = string;
export type SecondaryToken = string;
export type SecureContentType = "ADDRESS" | string;
export type TemplateID = string;

// Regular expression to check if string pattern is a UUID
// Source: https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
export const ID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second
export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export type TagValue = undefined | null | string | number | boolean | Record<string, undefined | null | string | number | boolean | object>;

export interface Tag {
  Name: string;
  Value: TagValue;
  Private: boolean;
  Editable: boolean;
  Required: boolean;
}

export type Tags = Record<string, Tag>;

export interface Address {
  ID: AddressID;
  IndividualID: IndividualID;
  Label?: string;
  Name?: string;
  Street1?: string;
  Street2?: string;
  Street3?: string;
  City?: string;
  State?: string;
  PostCode?: string;
  Country?: string;
  Phone?: string;
  Email?: string;
  Tags?: Record<string, TagValue>;
}

interface Provider {
  Name: string;
  Contact: string;
  Description: string;
  Category: string;
  Street1: string;
  Street2?: string;
  Street3?: string;
  City: string;
  State: string;
  PostCode: string;
  Country?: string;
  Phone: string;
  Email: string;
  Website?: string;
  Tags?: object;
}

export interface Beneficiary extends Provider {
  ID: BeneficiaryID;
}

export interface ServiceProvider extends Provider {
  ID: ServiceProviderID;
}

export const IsUuid = (id: string): boolean => {
  return ID_PATTERN.test(id);
};

const TOKEN_STORAGE_KEY: string = "JWAUTH";

export interface AuthToken {
  token: string;
}

export const UseAuthToken = (authToken: AuthToken) => {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, authToken.token);
};

export const GetAuthToken = (): AuthToken => {
  let token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  if (token !== "") {
    token = token.split("Bearer ")[1];
  }
  return { token };
};

export const IsValidURL = (url: string): boolean => {
  let isValid = false;
  try {
    new URL(url);
    isValid = true;
  } catch (_) {
    isValid = false;
  }
  return isValid;
};

export interface GenericSecureContent {
  ID: SecureContentID;
  Type: string;
  Content: Record<string, string>;
}

export interface SecureContentTemplateField {
  ID: string;
  Label: string;
  Required?: boolean;
  Type: "alphanumeric" | "textarea" | "date" | "email" | "numeric" | "phone" | "text" | "url" | "password";
}

export interface TemplateDataConfig {
  TypeField: string; // indicates which field in the secure content indicates the type of data
  LabelField: string; // indicates which field in the secure content indicates the label of the data
}

export interface SecureContentTemplate {
  ID: string;
  Type: SecureContentType;
  Label: string;
  DataConfig: TemplateDataConfig;
  Fields: SecureContentTemplateField[];
}

export type SecureContent =
  | {
    ID: SecureContentID;
    Type: "ADDRESS";
    Label: string;
    Content: Address;
  }
  | {
    ID: SecureContentID;
    Type: Exclude<SecureContentType, "ADDRESS">;
    Label: string;
    Content: GenericSecureContent;
  };

// Utility function for retry logic
export const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = MAX_RETRIES, delay: number = RETRY_DELAY): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      // Check for non-retryable status codes and throw immediately
      if (isAxiosError(error)) {
        if ([400, 401, 403, 404].includes(error.response?.status || 0)) {
          return throwError(error);
        }
      }
      if (i === maxRetries - 1) throw throwError(error);
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  return throwError(new JWError("Retry failed"));
};

export interface JWAPIRequest {
  hostPort: string;
  authToken: string;
  timeout?: number;
}

// Utility function for creating API configuration
export const CreateAPIConfig = (request: JWAPIRequest): Configuration => {
  try {
    validateJWAPIRequest(request);
    // if the host port already ends with /api, remove it
    let hostPort = request.hostPort;
    if (hostPort.endsWith("/api")) {
      hostPort = hostPort.slice(0, -4);
    }

    return new Configuration({
      basePath: new URL("/api", hostPort).toString(),
      baseOptions: {
        withCredentials: true,
        timeout: request.timeout || API_TIMEOUT,
      },
      accessToken: request.authToken,
    });
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Validates the API Config parameters.
 *
 * This function validates that required fields are present and properly formatted:
 * - hostPort must be present and a valid URL string
 * - authToken must be present
 *
 * The hostPort URL string is validated by attempting URL construction.
 * Invalid URLs will throw an error rather than allow malformed requests.
 *
 * @param request - The request object to validate, either ServiceProviderTemplatesRequest or TemplateByIDRequest
 * @throws JWValidationError if required fields are missing
 * @throws JWErrorBadRequest if hostPort URL is invalid
 *
 * @example
 * try {
 *   validateRequest({
 *     hostPort: "https://api.example.com",
 *     authToken: "token123",
 *     templateID: "template-1"
 *   });
 * } catch (error) {
 *   // Handle validation errors
 * }
 */

const validateJWAPIRequest = (request: JWAPIRequest): void => {
  // Verify required hostPort parameter
  if (!request.hostPort) return throwError(new JWValidationError("hostPort is required"));

  // Verify required authToken parameter
  if (!request.authToken) throw throwError(new JWValidationError("authToken is required"));

  // Validate hostPort is properly formatted URL
  try {
    new URL(request.hostPort);
  } catch {
    return throwError(new JWValidationError(`invalid hostPort URL: ${request.hostPort}`));
  }
};
