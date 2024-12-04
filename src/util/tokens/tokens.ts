import { PrimaryTokenInput, SecondaryTokenInput, TokenApi } from "../internal/sdk/";
import { throwError } from "../types/errors";
import {
  AddressID,
  BeneficiaryID,
  CreateAPIConfig,
  IndividualID,
  JWAPIRequest,
  PrimaryToken,
  SecondaryToken,
  SecureContentID,
  ServiceProviderID,
} from "../types/types";

interface PrimaryTokenRequestBase extends JWAPIRequest {
  individualID: IndividualID;
  serviceProviderID: ServiceProviderID;
}

export type PrimaryTokenRequest =
  | (PrimaryTokenRequestBase & { addressID: AddressID; contentID?: SecureContentID })
  | (PrimaryTokenRequestBase & { addressID?: AddressID; contentID: SecureContentID });

export interface PrimaryTokenResponse {
  request: PrimaryTokenRequest;
  token: PrimaryToken;
}

export const GenereratePrimaryToken = async (request: PrimaryTokenRequest): Promise<PrimaryTokenResponse> => {
  const input: PrimaryTokenInput = {
    individualID: request.individualID,
    serviceProviderID: request.serviceProviderID,
    ...(request.addressID && { addressID: request.addressID }),
    ...(request.contentID && { securedcontentID: request.contentID }),
  };

  const config = CreateAPIConfig(request);

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

export type DisablePrimaryTokenRequest =
  | (PrimaryTokenRequestBase & { addressID: AddressID; contentID?: SecureContentID })
  | (PrimaryTokenRequestBase & { addressID?: AddressID; contentID: SecureContentID });

export interface DisablePrimaryTokenResponse {
  request: DisablePrimaryTokenRequest;
}

export const DisablePrimaryToken = async (request: DisablePrimaryTokenRequest): Promise<DisablePrimaryTokenResponse> => {
  const input: PrimaryTokenInput = {
    individualID: request.individualID,
    serviceProviderID: request.serviceProviderID,
    ...(request.addressID && { addressID: request.addressID }),
    ...(request.contentID && { securedcontentID: request.contentID }),
  };

  const config = CreateAPIConfig(request);

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

export interface SecondaryTokenRequest extends JWAPIRequest {
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

  const config = CreateAPIConfig(request);

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

export interface DisableSecondaryTokenRequest extends JWAPIRequest {
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

  const config = CreateAPIConfig(request);

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
