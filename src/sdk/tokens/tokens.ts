import { AxiosError } from "axios";
import { Configuration as APITokensConfig, DefaultApi as APITokens, PrimaryTokenInput, SecondaryTokenInput } from "../internal/apis/tokens";
import {
  AddressID,
  BeneficiaryID,
  IndividualID,
  JWError,
  JWErrorAuthenticationRequired,
  JWErrorBadRequest,
  JWErrorForbidden,
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

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APITokens(config);

  try {
    const response = await api.createPrimaryToken(input);

    return {
      request: request,
      token: response.data.token || "",
    };
  } catch (e) {
    if (e instanceof AxiosError) {
      // if error is 401, then throw a JWErrorAuthenticationRequired
      if (e.response && e.response.status === 401) {
        throw new JWErrorAuthenticationRequired("quthentication required");
      }
      // if error is 403, then throw a JWErrorForbidden
      if (e.response && e.response.status === 403) {
        throw new JWErrorForbidden("Forbidden");
      }
      // if error is 400, then throw a JWErrorBadRequest
      if (e.response && e.response.status === 400) {
        throw new JWErrorBadRequest("bad request");
      }
    }

    throw new JWError((e as Error).message);
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

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APITokens(config);

  try {
    const response = await api.createSecondaryToken(input);
    return {
      request: request,
      token: response.data.token || "",
    };
  } catch (e) {
    if (e instanceof AxiosError) {
      // if error is 401, then throw a JWErrorAuthenticationRequired
      if (e.response && e.response.status === 401) {
        throw new JWErrorAuthenticationRequired("quthentication required");
      }
      // if error is 403, then throw a JWErrorForbidden
      if (e.response && e.response.status === 403) {
        throw new JWErrorForbidden("Forbidden");
      }
      // if error is 400, then throw a JWErrorBadRequest
      if (e.response && e.response.status === 400) {
        throw new JWErrorBadRequest("bad request");
      }
    }

    throw new JWError((e as Error).message);
  }
};
