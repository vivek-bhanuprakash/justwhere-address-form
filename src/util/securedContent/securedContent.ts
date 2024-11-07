import { GetAddressUsingOwnerToken, GetAddressUsingPrimaryToken, GetAddressUsingSecondaryToken, GetOwnerAddresses } from "../address/address";
import { SecuredContentLimited, SecuredcontentsApi, SharedSecuredcontentApi } from "../internal/sdk/";
import { JWErrorBadRequest, JWErrorServerError, JWValidationError, throwError, throwErrorFromStatus } from "../types/errors";
import {
  Address,
  BeneficiaryID,
  CreateAPIConfig,
  GenericSecureContent,
  IndividualID,
  JWAPIRequest,
  OwnerToken,
  PrimaryToken,
  retryOperation,
  SecondaryToken,
  SecureContent,
  SecureContentID,
  SecureContentTemplate,
  SecureContentType,
  ServiceProviderID,
  Tags
} from "../types/types";

const CONTENT_TYPE_ADDRESS = "ADDRESS";
const DEFAULT_LABEL_FIELD = "label";
const DEFAULT_TYPE_FIELD = "contenttype";

export interface PrimaryTokenSecureContentRequest extends JWAPIRequest {
  individualID: IndividualID;
  contentID: SecureContentID;
  contentTemplates: SecureContentTemplate[];
  serviceProviderID: ServiceProviderID;
  token: PrimaryToken;
}

export interface PrimaryTokenSecureContentResponse {
  request: PrimaryTokenSecureContentRequest;
  content: SecureContent;
}

/**
 * Retrieves secure content using a Primary Token
 * @param {PrimaryTokenSecureContentRequest} request - Request containing primary token and content details
 * @returns {Promise<PrimaryTokenSecureContentResponse>} Response containing the secure content
 */
export const GetSecureContentUsingPrimaryToken = async (request: PrimaryTokenSecureContentRequest): Promise<PrimaryTokenSecureContentResponse> => {
  try {
    const response = (await GetSecureContentUsingIDAndToken(request)) as PrimaryTokenSecureContentResponse;
    return response;
  } catch (error) {
    return throwError(error);
  }
};

export interface SecondaryTokenSecureContentRequest extends JWAPIRequest {
  individualID: IndividualID;
  contentID: SecureContentID;
  contentTemplates: SecureContentTemplate[];
  beneficiaryID: BeneficiaryID;
  token: SecondaryToken;
}

export interface SecondaryTokenSecureContentResponse {
  request: SecondaryTokenSecureContentRequest;
  content: SecureContent;
}

/**
 * Retrieves secure content using a Secondary Token
 * @param {SecondaryTokenSecureContentRequest} request - Request containing secondary token and content details
 * @returns {Promise<SecondaryTokenSecureContentResponse>} Response containing the secure content
 */
export const GetSecureContentUsingSecondaryToken = async (request: SecondaryTokenSecureContentRequest): Promise<SecondaryTokenSecureContentResponse> => {
  try {
    const response = (await GetSecureContentUsingIDAndToken(request)) as SecondaryTokenSecureContentResponse;
    return response;
  } catch (error) {
    return throwError(error);
  }
};

export interface OwnerTokenSecureContentRequest extends JWAPIRequest {
  contentID: SecureContentID;
  contentTemplates: SecureContentTemplate[];
  individualID: IndividualID;
  token: OwnerToken;
}

export interface OwnerTokenSecureContentResponse {
  request: OwnerTokenSecureContentRequest;
  content: SecureContent;
}

/**
 * Retrieves secure content using an Owner Token
 * @param {OwnerTokenSecureContentRequest} request - Request containing owner token and content details
 * @returns {Promise<OwnerTokenSecureContentResponse>} Response containing the secure content
 */
export const GetSecureContentUsingOwnerToken = async (request: OwnerTokenSecureContentRequest): Promise<OwnerTokenSecureContentResponse> => {
  try {
    const response = (await GetSecureContentUsingIDAndToken(request)) as OwnerTokenSecureContentResponse;
    return response;
  } catch (error) {
    return throwError(error);
  }
};

type TokenContentRequest = PrimaryTokenSecureContentRequest | SecondaryTokenSecureContentRequest | OwnerTokenSecureContentRequest;
type TokenContentResponse = PrimaryTokenSecureContentResponse | SecondaryTokenSecureContentResponse | OwnerTokenSecureContentResponse;

const GetSecureContentUsingIDAndToken = async (request: TokenContentRequest): Promise<TokenContentResponse> => {
  validateSecureContentRequest(request);

  // since we don't know the type of content, we have to look up the record for address as well as secure content
  // if the content type is address, then we can just use the address content handler
  // otherwise, we have to use the secure content handler

  const config = CreateAPIConfig(request);
  const api = new SharedSecuredcontentApi(config);

  if ("serviceProviderID" in request) {
    try {
      const response = await retryOperation(() => GetAddressUsingPrimaryToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        addressID: request.contentID,
        serviceProviderID: request.serviceProviderID,
        token: request.token,
      }));
      return {
        request,
        content: formatAddressContent(response.address),
      };
    } catch {
      const response = await retryOperation(() =>
        api.getSharedSecuredcontent(request.contentID, request.token, request.serviceProviderID, request.individualID)
      );
      const contents = ConvertToSecureContents([response.data], request.contentTemplates);
      const content = Object.values(contents).length > 0 ? Object.values(contents)[0][0] : ({} as SecureContent);
      return {
        request,
        content: content,
      };

    }

  } else if ("beneficiaryID" in request) {
    try {
      const response = await retryOperation(() => GetAddressUsingSecondaryToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        addressID: request.contentID,
        beneficiaryID: request.beneficiaryID,
        token: request.token,
      }));
      return {
        request,
        content: formatAddressContent(response.address),
      };
    } catch {
      const response = await retryOperation(() =>
        api.getSharedSecuredcontent(request.contentID, request.token, request.beneficiaryID, request.individualID)
      );
      const contents = ConvertToSecureContents([response.data], request.contentTemplates);
      const content = Object.values(contents).length > 0 ? Object.values(contents)[0][0] : ({} as SecureContent);
      return {
        request,
        content: content,
      };
    }

  } else if ("individualID" in request) {
    try {
      const response = await retryOperation(() => GetAddressUsingOwnerToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        individualID: request.individualID,
        addressID: request.contentID,
      }));;
      return {
        request,
        content: formatAddressContent(response.address),
      };
    } catch {
      const response = await retryOperation(() =>
        api.getSharedSecuredcontent(request.contentID, request.token, "", request.individualID)
      );
      const contents = ConvertToSecureContents([response.data], request.contentTemplates);
      const content = Object.values(contents).length > 0 ? Object.values(contents)[0][0] : ({} as SecureContent);
      return {
        request,
        content: content,
      };
    }

  } else {
    throw new JWValidationError("Invalid request type for token content");
  }
};

export interface OwnerSecureContentsRequest extends JWAPIRequest {
  individualID: IndividualID;
  templateFilters: SecureContentTemplate[];
}

export interface OwnerSecureContentsResponse {
  request: OwnerSecureContentsRequest;
  contents: Record<SecureContentType, SecureContent[]>;
}

/**
 * Retrieves all secure contents for an owner based on provided content filters
 * @param {OwnerSecureContentsRequest} request - Request containing owner ID and content filters
 * @returns {Promise<OwnerSecureContentsResponse>} Response containing filtered secure contents grouped by type
 */
export const GetOwnerSecureContents = async (request: OwnerSecureContentsRequest): Promise<OwnerSecureContentsResponse> => {
  try {
    if (!request.individualID) {
      throw new JWValidationError("Individual ID is required");
    }

    const config = CreateAPIConfig(request);

    // Filter and validate templates
    const contentFilters = validateAndNormalizeTemplates(request.templateFilters);
    const result: Record<SecureContentType, SecureContent[]> = {};

    // Handle address content
    if (contentFilters[CONTENT_TYPE_ADDRESS]) {
      result[CONTENT_TYPE_ADDRESS] = await handleOwnerAddresses(request);
      console.debug("JustWhere API: retrieved", result[CONTENT_TYPE_ADDRESS].length, "address content");
    }

    // Handle non-address content
    const r = await handleNonAddressContent(request, contentFilters);

    // Merge results
    Object.keys(r).forEach((type) => {
      if (result[type]) {
        result[type].push(...r[type]);
      } else {
        result[type] = r[type];
      }
    });
    return {
      request,
      contents: result,
    };
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Converts a SecuredContentLimited object to a GenericSecureContent format
 * @param {SecuredContentLimited} input - The input secured content to convert
 * @param {SecureContentTemplate} template - Template defining the content structure and fields
 * @returns {GenericSecureContent} The converted generic secure content object
 */
const convertToSecuredContent = (input: SecuredContentLimited, template: SecureContentTemplate): GenericSecureContent => {
  // Extract tags and determine content type field name from template
  const tags = input.tags as Tags;
  const contentTypeField = template.DataConfig.TypeField || "contenttype";

  // Create generic content object with basic properties
  const genericContent: GenericSecureContent = {
    ID: input.id || "",
    Type: template.Type.toUpperCase() as SecureContentType,
    Content: {},
  };

  // Convert tags to string record, excluding the content type field
  if (tags) {
    Object.entries(tags).forEach(([key, tag]) => {
      if (key !== contentTypeField) {
        genericContent.Content[key] = String(tag.Value || "");
      }
    });
  }

  return genericContent;
};

/**
 * Validates secure content request parameters
 * @param request Request object to validate
 * @throws {JWValidationError} If required parameters are missing
 */
const validateSecureContentRequest = (
  request: PrimaryTokenSecureContentRequest | SecondaryTokenSecureContentRequest | OwnerTokenSecureContentRequest,
): void => {
  if (!request.contentID) throw new JWValidationError("Content ID is required");
  if (!request.contentTemplates || !request.contentTemplates.length) throw new JWValidationError("One or more content templates are required");
  if (!request.token) throw new JWValidationError("Token is required");
  if (!request.hostPort) throw new JWValidationError("Host port is required");
};

/**
 * Handles address-type content retrieval
 * @param request Request containing address details
 * @returns Formatted address content response
 */
const handleAddressContent = async (
  request: PrimaryTokenSecureContentRequest | SecondaryTokenSecureContentRequest | OwnerTokenSecureContentRequest,
): Promise<any> => {
  try {
    let response;

    if ("serviceProviderID" in request) {
      response = await GetAddressUsingPrimaryToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        addressID: request.contentID,
        serviceProviderID: request.serviceProviderID,
        token: request.token,
      });
    } else if ("beneficiaryID" in request) {
      response = await GetAddressUsingSecondaryToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        addressID: request.contentID,
        beneficiaryID: request.beneficiaryID,
        token: request.token,
      });
    } else if ("individualID" in request) {
      response = await GetAddressUsingOwnerToken({
        hostPort: request.hostPort,
        authToken: request.authToken,
        individualID: request.individualID,
        addressID: request.contentID,
      });
    } else {
      throw new JWValidationError("Invalid request type for address content");
    }

    return {
      request,
      content: formatAddressContent(response.address),
    };
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Formats address content into standard secure content format
 * @param address Address object to format
 * @returns Formatted secure content
 */
const formatAddressContent = (address: Address): SecureContent => ({
  ID: address.ID,
  Type: CONTENT_TYPE_ADDRESS,
  Label: `${address.Label || ""} - ${address.PostCode || ""}`,
  Content: address,
});

/**
 * Formats secure content response
 * @param content Raw content from API
 * @param template Template for content formatting
 * @returns Formatted secure content
 */
const formatSecureContent = (content: SecuredContentLimited, template: SecureContentTemplate): SecureContent => {
  if (!content.id) {
    throw new JWErrorBadRequest("Content ID is missing");
  }

  console.log("JustWhere API: content:", content, "template:", template);
  const labelField = template.DataConfig.LabelField || DEFAULT_LABEL_FIELD;
  const tags = content.tags as Tags;

  return {
    ID: content.id,
    Type: template.Type.toUpperCase() as SecureContentType,
    Label: ((tags?.[labelField]?.Value as string) || "").trim(),
    Content: convertToSecuredContent(content, template),
  };
};

/**
 * Validates and normalizes content templates
 * @param templates Array of content templates to process
 * @returns Record of normalized templates by type
 */
const validateAndNormalizeTemplates = (templates: SecureContentTemplate[]): Record<SecureContentType, SecureContentTemplate> => {
  return (templates || [])
    .filter((template) => {
      if (!template.Type || !template.Fields.length) {
        console.warn(`Invalid template found: ${JSON.stringify(template)}`);
        return false;
      }
      return true;
    })
    .reduce(
      (acc, template) => {
        const type = template.Type.trim().toUpperCase() as SecureContentType;
        acc[type] = template;
        return acc;
      },
      {} as Record<SecureContentType, SecureContentTemplate>,
    );
};

/**
 * Handles fetching and formatting owner address content
 * @param request Original request containing owner details
 * @param authToken Authentication token
 * @returns Array of formatted address content
 */
const handleOwnerAddresses = async (request: OwnerSecureContentsRequest): Promise<SecureContent[]> => {
  try {
    const addressResponse = await GetOwnerAddresses({
      hostPort: request.hostPort,
      authToken: request.authToken,
      individualID: request.individualID,
    });

    if (!addressResponse.addresses) {
      return [];
    }

    return Object.values(addressResponse.addresses).map((address) => formatAddressContent(address));
  } catch (error) {
    console.warn(`Error fetching owner addresses: ${error}`);
    return [];
  }
};

/**
 * Handles fetching and formatting non-address content types
 * @param templateFilters Validated content templates by type
 * @param config API configuration
 * @param result Result object to populate
 */
const handleNonAddressContent = async (
  request: OwnerSecureContentsRequest,
  templateFilters: Record<SecureContentType, SecureContentTemplate>,
): Promise<Record<SecureContentType, SecureContent[]>> => {
  const nonAddressTypes = Object.keys(templateFilters).filter((type) => type !== CONTENT_TYPE_ADDRESS) as SecureContentType[];

  if (nonAddressTypes.length === 0) {
    return {} as Record<SecureContentType, SecureContent[]>;
  }

  try {
    const result: Record<SecureContentType, SecureContent[]> = {};
    const config = CreateAPIConfig(request);
    const api = new SecuredcontentsApi(config);
    const response = await retryOperation(() => api.getAllSecuredContents());

    if (response.status >= 400) {
      return throwErrorFromStatus(response.status);
    }

    if (!response.data) {
      throw new JWErrorServerError("No data received from API");
    }

    nonAddressTypes.forEach((type) => {
      const template = templateFilters[type];
      const contentTypeField = template.DataConfig.TypeField || DEFAULT_TYPE_FIELD;

      const matchingContents = response.data
        .filter((content) => {
          if (!content.tags) return false;

          const tags = content.tags as Tags;
          const contentType = ((tags[contentTypeField]?.Value as string) || "").toLowerCase().trim();

          return contentType === template.Type.toLowerCase();
        })
        .map((content) => {
          if (!content.id) {
            console.warn(`Content missing ID: ${JSON.stringify(content)}`);
            return null;
          }
          return formatSecureContent(content, template);
        })
        .filter((content): content is SecureContent => content !== null);

      result[type] = matchingContents;
    });

    return result;
  } catch (error) {
    console.error("Error processing non-address content:", error);
    return throwError(error);
  }
};

/**
 * Maps an array of SecuredContentLimited objects to a record of SecureContent arrays
 * grouped by content type, using the provided templates for formatting.
 *
 * @param contents Array of SecuredContentLimited objects to process
 * @param templates Array of SecureContentTemplate objects defining content structure
 * @returns Record of SecureContent arrays grouped by type
 * @throws JWValidationError if template validation fails
 * @throws JWErrorBadRequest if content processing fails
 */
export const ConvertToSecureContents = (contents: SecuredContentLimited[], templates: SecureContentTemplate[]): Record<SecureContentType, SecureContent[]> => {
  try {
    // First, validate and normalize templates
    const templateMap = validateAndNormalizeTemplates(templates);
    const result: Record<SecureContentType, SecureContent[]> = {};

    // Process each content item
    contents.forEach(content => {
      if (!content.tags || !content.id) {
        console.warn(`JustWhere API: skipping invalid content: ${JSON.stringify(content)}`);
        return;
      }

      // Find matching template for the content
      const matchingTemplate = findMatchingTemplate(content, templateMap);

      if (!matchingTemplate) {
        console.warn(`JustWhere API: no matching template provided for content: ${content.id}`);
        return;
      }

      const contentType = matchingTemplate.Type.toUpperCase() as SecureContentType;

      // Initialize array for this content type if it doesn't exist
      if (!result[contentType]) {
        result[contentType] = [];
      }

      // Format and add the content to the appropriate array
      try {
        const formattedContent = formatSecureContent(content, matchingTemplate);
        result[contentType].push(formattedContent);
      } catch (error) {
        console.warn(`Error formatting content ${content.id}:`, error);
      }
    });

    return result;
  } catch (error) {
    return throwError(error);
  }
};

/**
 * Helper function to find the matching template for a given content
 * based on the content type field in the tags
 */
const findMatchingTemplate = (content: SecuredContentLimited, templateMap: Record<SecureContentType, SecureContentTemplate>): SecureContentTemplate | undefined => {
  const tags = content.tags as Tags;

  // Try to find matching template by checking each template's type field
  for (const template of Object.values(templateMap)) {
    const contentTypeField = template.DataConfig.TypeField || DEFAULT_TYPE_FIELD;
    const contentType = ((tags[contentTypeField]?.Value as string) || "").toLowerCase().trim();

    if (contentType === template.Type.toLowerCase()) {
      return template;
    }
  }

  return undefined;
};
