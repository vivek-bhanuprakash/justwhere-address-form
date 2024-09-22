import { AxiosError } from "axios";
import { Configuration, PrimaryTokenInput, SecondaryTokenInput, TokenApi } from "../internal/sdk/";
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
  authToken?: string;
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

  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new TokenApi(config);

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

export interface DisablePrimaryTokenRequest {
  hostPort: string;
  authToken?: string;
  individualID: IndividualID;
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
}

export interface DisablePrimaryTokenResponse {
  request: DisablePrimaryTokenRequest;
}

export const DisablePrimaryToken = async (request: DisablePrimaryTokenRequest): Promise<DisablePrimaryTokenResponse> => {
  const input: PrimaryTokenInput = {
    individualID: request.individualID,
    addressID: request.addressID,
    serviceProviderID: request.serviceProviderID,
  };

  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new TokenApi(config);

  try {
    await api.disablePrimaryToken(input);
    return {
      request: request,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface SecondaryTokenRequest {
  hostPort: string;
  authToken?: string;
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

  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new TokenApi(config);

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

export interface DisableSecondaryTokenRequest {
  hostPort: string;
  authToken?: string;
  serviceProviderID: ServiceProviderID;
  beneficiaryID: BeneficiaryID;
  secondaryToken: SecondaryToken;
}

export interface DisableSecondaryTokenResponse {
  request: DisableSecondaryTokenRequest;
}

export const DisableSecondaryToken = async (request: DisableSecondaryTokenRequest): Promise<DisableSecondaryTokenResponse> => {
  const input: SecondaryTokenInput = {
    serviceProviderID: request.serviceProviderID,
    beneficiaryID: request.beneficiaryID,
    token: request.secondaryToken,
  };

  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new TokenApi(config);

  try {
    await api.disableSecondaryToken(input);
    return {
      request: request,
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
