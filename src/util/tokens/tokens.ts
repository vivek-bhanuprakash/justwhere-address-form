import { AxiosError, RawAxiosRequestHeaders } from "axios";
import { Configuration as APITokensConfig, DefaultApi as APITokens, PrimaryTokenInput, SecondaryTokenInput } from "../internal/sdk/token_management_openapi";
import {
  AddressID,
  BeneficiaryID,
  GetAuthToken,
  IndividualID,
  JWError,
  JWErrorAuthenticationRequired,
  JWErrorBadRequest,
  JWErrorForbidden,
  JWErrorNotFound,
  JWErrorServerError,
  PrimaryToken,
  SecondaryToken,
  ServiceProviderID,
} from "../types/types";

export interface PrimaryTokenRequest {
  hostPort: string;
  individualID: IndividualID;
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
}

export interface PrimaryTokenResponse {
  request: PrimaryTokenRequest;
  token: PrimaryToken;
}

export const GenereratePrimaryToken = async (request: PrimaryTokenRequest): Promise<PrimaryTokenResponse> => {
  const input: PrimaryTokenInput = {
    individualID: request.individualID,
    addressID: request.addressID,
    serviceProviderID: request.serviceProviderID,
  };

  const authToken = GetAuthToken();

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken.token,
  });

  const api = new APITokens(config);

  try {
    const response = await api.createPrimaryToken(input);

    return {
      request: request,
      token: response.data.token || "",
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface SecondaryTokenRequest {
  hostPort: string;
  serviceProviderID: ServiceProviderID;
  beneficiaryID: BeneficiaryID;
  token: PrimaryToken;
}

export interface SecondaryTokenResponse {
  request: SecondaryTokenRequest;
  token: SecondaryToken;
}

export const GenererateSecondaryToken = async (request: SecondaryTokenRequest): Promise<SecondaryTokenResponse> => {
  const input: SecondaryTokenInput = {
    serviceProviderID: request.serviceProviderID,
    beneficiaryID: request.beneficiaryID,
    token: request.token,
  };

  const authToken = GetAuthToken();

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken.token,
  });

  const api = new APITokens(config);

  try {
    const response = await api.createSecondaryToken(input);
    return {
      request: request,
      token: response.data.token || "",
    };
  } catch (e) {
    return throwError(e);
  }
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

const GetHeaders = (): RawAxiosRequestHeaders => {
  const headers: RawAxiosRequestHeaders = {};
  const authToken = GetAuthToken();

  if (authToken.token !== null) {
    headers.Authorization = authToken.token;
  }

  return headers;
};
