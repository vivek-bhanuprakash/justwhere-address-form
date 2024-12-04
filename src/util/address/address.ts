import { AddressApi, AddressInput, IndividualApi, UserinfoApi } from "../internal/sdk/";
import {
  Address,
  AddressID,
  BeneficiaryID,
  CreateAPIConfig,
  IndividualID,
  JWAPIRequest,
  OwnerToken,
  PrimaryToken,
  SecondaryToken,
  ServiceProviderID,
  TagValue,
  UserID,
} from "../types/types";

import { JWErrorAuthenticationRequired, throwError } from "../types/errors";

export interface PrimaryTokenAddressRequest extends JWAPIRequest {
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
  token: PrimaryToken;
}

export interface PrimaryTokenAddressResponse {
  request: PrimaryTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingPrimaryToken = async (request: PrimaryTokenAddressRequest): Promise<PrimaryTokenAddressResponse> => {
  const config = CreateAPIConfig(request);
  const api = new AddressApi(config);

  try {
    const response = await api.getAddress(request.addressID, request.token, request.serviceProviderID);
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface SecondaryTokenAddressRequest extends JWAPIRequest {
  addressID: AddressID;
  beneficiaryID: BeneficiaryID;
  token: SecondaryToken;
}

export interface SecondaryTokenAddressResponse {
  request: SecondaryTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingSecondaryToken = async (request: SecondaryTokenAddressRequest): Promise<SecondaryTokenAddressResponse> => {
  const config = CreateAPIConfig(request);
  const api = new AddressApi(config);

  try {
    const response = await api.getAddress(request.addressID, request.token, request.beneficiaryID);
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface OwnerTokenAddressRequest extends JWAPIRequest {
  individualID: IndividualID;
  addressID: AddressID;
}

export interface OwnerTokenAddressResponse {
  request: OwnerTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingOwnerToken = async (request: OwnerTokenAddressRequest): Promise<OwnerTokenAddressResponse> => {
  const config = CreateAPIConfig(request);
  const api = new AddressApi(config);

  try {
    const currentUser = await GetCurrentUserInfo({ hostPort: request.hostPort, authToken: request.authToken });
    const response = await api.getAddress(request.addressID, currentUser.token, "", request.individualID);
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface OwnerAddressesRequest extends JWAPIRequest {
  individualID: IndividualID;
}

export interface OwnerAddressesResponse {
  request: OwnerAddressesRequest;
  addresses: Record<AddressID, Address>;
}

export const GetOwnerAddresses = async (request: OwnerAddressesRequest): Promise<OwnerAddressesResponse> => {
  const config = CreateAPIConfig(request);
  const api = new IndividualApi(config);

  try {
    const response = await api.getIndividualDetails(request.individualID);
    const addresses: Record<AddressID, Address> = {};
    await Promise.all(
      Object.keys(response.data.addresses || {}).map(async (addressID: AddressID) => {
        const response = await GetAddressUsingOwnerToken({
          hostPort: request.hostPort,
          authToken: request.authToken,
          individualID: request.individualID,
          addressID: addressID,
        });
        addresses[response.address.ID] = response.address;
      }),
    );
    return {
      request: request,
      addresses: addresses,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface CurrentUserInfoRequest extends JWAPIRequest {}

export interface CurrentUserInfoResponse {
  request: CurrentUserInfoRequest;
  userID: UserID;
  individualID: IndividualID;
  serviceProviderID: ServiceProviderID;
  token: OwnerToken;
}

export const GetCurrentUserInfo = async (request: CurrentUserInfoRequest): Promise<CurrentUserInfoResponse> => {
  const config = CreateAPIConfig(request);
  const api = new UserinfoApi(config);

  try {
    const response = await api.getUserInfo();
    return {
      request: request,
      userID: response.data.UserID || "",
      individualID: response.data.IndividualID || "",
      serviceProviderID: response.data.DefaultServiceProvider || "",
      token: response.data.Ownertoken || "",
    };
  } catch (e) {
    return throwError(e);
  }
};

export const IsLoggedIn = async (hostPort: string, authToken: string): Promise<boolean> => {
  try {
    const u = await GetCurrentUserInfo({ hostPort, authToken: authToken });
    return u.userID.trim().length > 0 && u.individualID.trim().length > 0;
  } catch (e) {
    if (e instanceof JWErrorAuthenticationRequired) return false;
    return throwError(e);
  }
};

function convertToAddress(input: AddressInput): Address {
  const output: Address = {
    ID: input.id || "",
    IndividualID: input.individualId || "",
    Name: input.addressee,
    Street1: input.street,
    City: input.city,
    State: input.state,
    PostCode: input.zipCode,
    Country: input.country,
    Phone: input.phone,
    Email: input.email,
    Tags: {},
  };

  if (!input.tags) return output;

  // If tags exist, iterate through them and convert only non-private ones
  const newTags: Record<string, TagValue> = {};
  for (const [tagKey, tag] of Object.entries(input.tags)) {
    // if (tag.Private) continue;

    if (tagKey === "atag") output.Label = tag.Name || "";
    else if (tag.Name && tag.Name.trim().length > 0) {
      newTags[tag.Name.trim()] = tag.Value || "";
    }
  }

  output.Tags = newTags;
  return output;
}
