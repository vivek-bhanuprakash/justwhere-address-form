import { AxiosError } from "axios";
import { Configuration, SecuredContentLimited, SecuredcontentsApi } from "../internal/sdk/";
import {
  GetAuthToken,
  JWError,
  JWErrorAuthenticationRequired,
  JWErrorBadRequest,
  JWErrorForbidden,
  JWErrorNotFound,
  JWErrorServerError,
  SecureContent as SecuredContent,
  Tags,
} from "../types/types";

export interface FetchSecuredContentsRequest {
  hostPort: string;
  authToken?: string;
  contentFilter: string[];
}

export interface FetchSecuredContentsResponse {
  request: FetchSecuredContentsRequest;
  contents: SecuredContent[];
}

export const FetchSecuredContents = async (request: FetchSecuredContentsRequest): Promise<FetchSecuredContentsResponse> => {
  const authToken = request.authToken || GetAuthToken().token;
  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  if (request.contentFilter === undefined || request.contentFilter === null) {
    request.contentFilter = [];
  }

  // remove undefined and null values from contentFilter
  request.contentFilter = request.contentFilter.filter((contentType: string) => contentType !== undefined && contentType !== null);

  // convert filter values to lowercase and trim
  request.contentFilter = request.contentFilter.map((contentType: string) => contentType.toLowerCase().trim());

  const api = new SecuredcontentsApi(config);

  try {
    const response = await api.getAllSecuredContents();
    response.data = response.data.filter((content: SecuredContentLimited) => {
      const contentType = (((content.tags as Tags)?.["contenttype"]?.Value as string) || "").toLowerCase().trim();
      return request.contentFilter.includes(contentType);
    });
    return {
      request: request,
      contents: response.data.map((data: SecuredContentLimited) => convertToSecuredContent(data)),
    };
  } catch (e) {
    return throwError(e);
  }
};

const convertToSecuredContent = (input: SecuredContentLimited): SecuredContent => {
  const output: SecuredContent = {
    ID: input.id || "",
    Type: "<unknown>",
    Content: {} as Record<string, string>,
  };

  if (!input.tags) return output;

  const t: Tags = input.tags as Tags;

  if (!t.hasOwnProperty("contenttype")) return output;

  output.Type = t["contenttype"].Value as string;

  for (const key in t) {
    if (key !== "contenttype") {
      output.Content[key] = t[key].Value as string;
    }
  }
  return output;
};

const throwError = (e: any) => {
  if (e instanceof AxiosError) {
    // if error is 400, then throw a JWErrorBadRequest
    if (e.response && e.response.status === 400) {
      throw new JWErrorBadRequest("bad request");
    }
    // if error is 401, then throw a JWErrorAuthenticationRequired
    if (e.response && e.response.status === 401) {
      throw new JWErrorAuthenticationRequired("authentication required");
    }
    // if error is 403, then throw a JWErrorForbidden
    if (e.response && e.response.status === 403) {
      throw new JWErrorForbidden("forbidden");
    }
    // if error is 404, then throw a JWErrorNotFound
    if (e.response && e.response.status === 404) {
      throw new JWErrorNotFound("not found");
    }
    // if error is 5xx, then throw a JWErrorServerError
    if (e.response && e.response.status >= 500) {
      throw new JWErrorServerError("server error");
    }
  }

  throw new JWError((e as Error).message);
};
