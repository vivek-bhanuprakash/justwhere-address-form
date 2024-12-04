import { CreateTemplate201Response, TemplatesApi } from "../internal/sdk";
import {
  API_TIMEOUT,
  CreateAPIConfig,
  JWAPIRequest,
  retryOperation,
  SecureContentTemplate,
  SecureContentTemplateField,
  ServiceProviderID,
  Tags,
  TemplateDataConfig,
  TemplateID
} from "../types/types";

import { JWErrorBadRequest, JWErrorServerError, JWTemplateError, throwError } from "../types/errors";

export interface ServiceProviderTemplatesRequest extends JWAPIRequest {
  serviceProviderID: ServiceProviderID;
}

export interface ServiceProviderTemplatesResponse {
  request: ServiceProviderTemplatesRequest;
  templates: Array<TemplateID>;
}

/**
 * Retrieves all template IDs associated with a specific service provider.
 *
 * This function performs a GET request to fetch template IDs linked to the provided
 * service provider ID. It validates the request parameters, configures the API client
 * with proper authentication and timeout settings, and makes the API call with retry
 * capability.
 *
 * The hostPort URL is validated and properly formatted by appending the /api path.
 * The API call is wrapped in a retry operation to handle transient failures.
 * Response data is validated to ensure it contains an array of template IDs.
 *
 * @param request - Configuration object for the template ID retrieval operation
 * @param request.hostPort - Base URL for the API service (e.g. "https://api.example.com")
 * @param request.authToken - Valid authentication token for accessing the API
 * @param request.serviceProviderID - Unique identifier for the service provider whose templates to retrieve
 * @returns Promise resolving to an object containing the original request and array of template IDs
 * @throws JWValidationError if request parameters are invalid
 * @throws JWErrorBadRequest if hostPort URL is malformed
 * @throws JWErrorServerError if API response format is invalid
 * @throws JWError for other API or network errors
 */
export const GetTemplateIDsForServiceProvider = async (request: ServiceProviderTemplatesRequest): Promise<ServiceProviderTemplatesResponse> => {
  try {
    const config = CreateAPIConfig(request);

    const api = new TemplatesApi(config);

    const response = await retryOperation(() => api.getTemplatesByServiceProviderId(request.serviceProviderID));

    if (!response.data || !Array.isArray(response.data)) {
      throw new JWErrorServerError(`invalid response from API for service provider ${request.serviceProviderID}. expected array, got ${typeof response.data}`);
    }

    return {
      request,
      templates: response.data,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface TemplateByIDRequest extends JWAPIRequest {
  templateID: TemplateID;
}

export interface TemplateByIDResponse {
  request: TemplateByIDRequest;
  template: CreateTemplate201Response;
}

/**
 * Retrieves a template by its unique identifier.
 *
 * This function performs a GET request to fetch the full details of a specific template
 * using the provided template ID. It validates the request parameters, configures the API client
 * with proper authentication and timeout settings, and makes the API call with retry
 * capability.
 *
 * The hostPort URL is validated and properly formatted by appending the /api path.
 * The API call is wrapped in a retry operation to handle transient failures.
 * Response data is validated to ensure it contains required template fields.
 *
 * @param request - Configuration object for the template retrieval operation
 * @param request.hostPort - Base URL for the API service (e.g. "https://api.example.com")
 * @param request.authToken - Valid authentication token for accessing the API
 * @param request.templateID - Unique identifier of the template to retrieve
 * @returns Promise resolving to an object containing the original request and template data
 * @throws JWValidationError if request parameters are invalid
 * @throws JWErrorBadRequest if hostPort URL is malformed or template is not found
 * @throws JWTemplateError if template is missing required fields
 * @throws JWError for other API or network errors
 */
export const GetTemplateByID = async (request: TemplateByIDRequest): Promise<TemplateByIDResponse> => {
  try {
    const config = CreateAPIConfig(request);

    const api = new TemplatesApi(config);

    const response = await retryOperation(() => api.getTemplateById(request.templateID));

    if (!response.data) {
      throw new JWErrorBadRequest(`template not found with id ${request.templateID}`);
    }

    validateTemplate(response.data);

    return {
      request,
      template: response.data,
    };
  } catch (e) {
    return throwError(e);
  }
};

/**
 * Retrieves and validates template field definitions from a remote URL.
 *
 * Performs an HTTP GET request to fetch JSON template content and transforms it into
 * a standardized field definition format. Includes built-in timeout handling and
 * automatic retries for transient failures.
 *
 * The source JSON must contain an array of objects with the following structure:
 * ```typescript
 * {
 *   id: string;      // Unique field identifier
 *   label: string;   // Human-readable field label
 *   type: string;    // Field data type (text, email, etc)
 *   required?: boolean; // Whether field is mandatory (defaults false)
 * }
 * ```
 *
 * The response is transformed into SecureContentTemplateField objects with
 * standardized property names (ID, Label, Type, Required).
 *
 * @param url - URL pointing to the JSON template definition file
 * @returns Promise<Array<SecureContentTemplateField>> - Array of normalized field definitions
 * @throws JWTemplateError - When URL is undefined or malformed
 * @throws JWErrorBadRequest - On HTTP errors or invalid JSON format
 * @throws JWError - For timeouts and other unhandled errors
 *
 * @example
 * const fields = await FetchTemplateFileContents("https://templates.example.com/address.json");
 * // Returns: [
 * //   { ID: "street", Label: "Street Address", Type: "text", Required: true },
 * //   { ID: "city", Label: "City", Type: "text", Required: true }
 * // ]
 */
export const FetchTemplateFileContents = async (url: string): Promise<Array<SecureContentTemplateField>> => {
  try {
    const validatedUrl = validateTemplateURL(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await retryOperation(() =>
      fetch(validatedUrl, {
        signal: controller.signal,
      }),
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new JWErrorBadRequest(`Failed to fetch template content: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new JWErrorBadRequest(`template content is not in expected format. expected array got, ${typeof data}`);
    }

    const convertedData: Array<SecureContentTemplateField> = data.map((field: any) => ({
      ID: field.id,
      Label: field.label,
      Required: field.required || false,
      Type: field.type,
    }));

    return convertedData;
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Retrieves and processes all templates associated with a service provider.
 *
 * This function performs a multi-step process to fetch and transform template data:
 * 1. Retrieves all template IDs for the specified service provider
 * 2. For each template ID, performs parallel operations to:
 *    - Get the full template details via GetTemplateByID
 *    - Download the template field definitions from the template's URL
 *    - Extract required metadata from template tags
 *    - Transform the data into the standardized SecureContentTemplate format
 *
 * The transformed templates include:
 * - ID: The unique template identifier
 * - Type: The template name/type
 * - Label: Display name from tags or template name
 * - DataConfig: Configuration for type and label fields
 * - Fields: Array of field definitions loaded from template URL
 *
 * @param request - Configuration object for template retrieval
 * @param request.hostPort - Base URL for the API service (e.g. "https://api.example.com")
 * @param request.authToken - Valid authentication token for accessing the API
 * @param request.serviceProviderID - Unique identifier of the service provider
 * @returns Promise resolving to array of fully processed SecureContentTemplate objects
 * @throws JWErrorBadRequest if template details are missing or invalid
 * @throws JWTemplateError if template URLs are invalid
 * @throws JWError for API errors, network failures, or other processing errors
 *
 * @example
 * try {
 *   const templates = await GetTemplatesForServiceProvider({
 *     hostPort: "https://api.example.com",
 *     authToken: "auth-token",
 *     serviceProviderID: "provider-123"
 *   });
 *   // templates = [{ID: "1", Type: "Address", Fields: [...], ...}, ...]
 * } catch (error) {
 *   // Handle various error types
 * }
 */
export const GetTemplatesForServiceProvider = async (request: ServiceProviderTemplatesRequest): Promise<Array<SecureContentTemplate>> => {
  try {
    // Get all template IDs for the service provider
    const response = await GetTemplateIDsForServiceProvider(request);

    // Process all templates in parallel
    const templates = await Promise.all(
      response.templates.map(async (templateID): Promise<SecureContentTemplate> => {
        // Prepare request for individual template details
        const req: TemplateByIDRequest = {
          hostPort: request.hostPort,
          authToken: request.authToken,
          templateID,
        };

        // Get full template details
        const templateResponse = await GetTemplateByID(req);
        const template = templateResponse.template;

        if (!template) {
          throw new JWErrorBadRequest(`failed to fetch template: ${templateID}`);
        }

        // Extract template metadata and field definitions
        const tags = template.Tags as Tags;
        const fields = await FetchTemplateFileContents(template.URL || "");

        // Validate required tag values
        const headerName = tags?.["HeaderName"]?.Value as string;
        const typeName = tags?.["TypeName"]?.Value as string;

        if (!headerName || !typeName) {
          throw new JWErrorBadRequest("either HeaderName or TypeName tag is missing in template");
        }

        // Transform into SecureContentTemplate format
        return {
          ID: templateID,
          Type: templateResponse.template.Name || "",
          Label: (tags?.["DisplayName"]?.Value as string) || templateResponse.template.Name || "",
          DataConfig: {
            TypeField: (tags?.["TypeName"]?.Value as string) || "",
            LabelField: (tags?.["HeaderName"]?.Value as string) || "",
          } as TemplateDataConfig,
          Fields: fields,
        } as SecureContentTemplate;
      }),
    );

    // add ADDRESS template by default
    templates.push({
      ID: "ADDRESS",
      Type: "ADDRESS",
      Label: "Address",
      DataConfig: {} as TemplateDataConfig,
      Fields: [
        {
          ID: "street1",
          Label: "Street 1",
          Required: true,
          Type: "text",
        },
        {
          ID: "street2",
          Label: "Street 2",
          Required: false,
          Type: "text",
        },
        {
          ID: "street3",
          Label: "Street 3",
          Required: false,
          Type: "text",
        },
        {
          ID: "city",
          Label: "City",
          Required: true,
          Type: "text",
        },
        {
          ID: "state",
          Label: "State",
          Required: true,
          Type: "text",
        },
        {
          ID: "postCode",
          Label: "Post Code",
          Required: true,
          Type: "text",
        },
        {
          ID: "country",
          Label: "Country",
          Required: true,
          Type: "text",
        },
        {
          ID: "phone",
          Label: "Phone",
          Required: false,
          Type: "text",
        },
        {
          ID: "email",
          Label: "Email",
          Required: false,
          Type: "text",
        },
      ] as SecureContentTemplateField[],
    });

    return templates;
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Validates and normalizes a template URL string.
 *
 * This function performs two key validation steps:
 * 1. Verifies the URL parameter is defined and not empty
 * 2. Validates the URL string can be parsed into a valid URL object
 *
 * The URL is normalized by converting it to a string representation
 * via URL.toString() to ensure consistent formatting.
 *
 * @param url - The URL string to validate, may be undefined
 * @returns The normalized URL string if valid
 * @throws JWTemplateError if URL parameter is undefined or empty
 * @throws JWErrorBadRequest if URL string cannot be parsed as valid URL
 *
 * @example
 * try {
 *   const validUrl = validateTemplateURL("https://example.com/template");
 *   // validUrl = "https://example.com/template"
 * } catch (error) {
 *   // Handle validation errors
 * }
 */
const validateTemplateURL = (url: string | undefined): string => {
  if (!url) throw new JWTemplateError("Template URL is required");
  try {
    return new URL(url).toString();
  } catch {
    throw new JWErrorBadRequest(`invalid template URL: ${url}`);
  }
};

/**
 * Validates required fields in a template response object.
 *
 * This function checks that a template has the minimum required fields:
 * - Name: The template name/identifier
 * - URL: The URL pointing to template field definitions
 *
 * Both fields must be defined and non-empty strings. Missing or empty
 * fields will cause validation errors to be thrown.
 *
 * @param template - The template response object to validate
 * @throws JWErrorBadRequest if Name field is missing or empty
 * @throws JWErrorBadRequest if URL field is missing or empty
 *
 * @example
 * try {
 *   validateTemplate({
 *     id: "template-1",
 *     Name: "Address Template",
 *     URL: "https://example.com/template.json"
 *   });
 * } catch (error) {
 *   // Handle validation errors
 * }
 */
const validateTemplate = (template: CreateTemplate201Response): void => {
  if (!template.Name) throw new JWErrorBadRequest(`name is missing in template ${template.id}`);
  if (!template.URL) throw new JWErrorBadRequest(`URL is missing in template ${template.id}`);
};
