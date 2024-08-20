import { AxiosError, RawAxiosRequestHeaders } from "axios";
import { JWAuthenticationRequired } from "../../components/jw-address";
import { AddressInput, Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "../internal/apis/individuals";
import {
  Address,
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
  TagValue,
  UserID,
} from "../types/types";

export interface PrimaryTokenAddressRequest {
  hostPort: string;
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
  token: PrimaryToken;
}

export interface PrimaryTokenAddressResponse {
  request: PrimaryTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingPrimaryToken = async (request: PrimaryTokenAddressRequest): Promise<PrimaryTokenAddressResponse> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const headers = GetHeaders();
    const response = await api.getAddressByID(request.addressID, request.token, request.serviceProviderID, undefined, { headers });
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface SecondaryTokenAddressRequest {
  hostPort: string;
  addressID: AddressID;
  beneficiaryID: BeneficiaryID;
  token: SecondaryToken;
}

export interface SecondaryTokenAddressResponse {
  request: SecondaryTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingSecondaryToken = async (request: SecondaryTokenAddressRequest): Promise<SecondaryTokenAddressResponse> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const headers = GetHeaders();
    const response = await api.getAddressByID(request.addressID, request.token, request.beneficiaryID, undefined, { headers });
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface OwnerTokenAddressRequest {
  hostPort: string;
  individualID: IndividualID;
  addressID: AddressID;
}

export interface OwnerTokenAddressResponse {
  request: OwnerTokenAddressRequest;
  address: Address;
}

export const GetAddressUsingOwnerToken = async (request: OwnerTokenAddressRequest): Promise<OwnerTokenAddressResponse> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const headers = GetHeaders();
    const response = await api.getAddressByID(request.addressID, "", "", request.individualID, { headers });
    const address = response.data || null;
    return {
      request: request,
      address: convertToAddress(address),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface OwnerAddressesRequest {
  hostPort: string;
  individualID: IndividualID;
}

export interface OwnerAddressesResponse {
  request: OwnerAddressesRequest;
  addresses: Record<AddressID, Address>;
}

export const GetOwnerAddresses = async (request: OwnerAddressesRequest): Promise<OwnerAddressesResponse> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const headers = GetHeaders();
    const response = await api.getIndividualByID(request.individualID, { headers });
    const addresses: Record<AddressID, Address> = {};
    Object.keys(response.data.addresses || {}).forEach(async (addressID: AddressID) => {
      const response = await GetAddressUsingOwnerToken({ hostPort: request.hostPort, individualID: request.individualID, addressID: addressID });
      addresses[response.address.ID] = response.address;
    });
    return {
      request: request,
      addresses: addresses,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface CurrentUserInfoRequest {
  hostPort: string;
}

export interface CurrentUserInfoResponse {
  request: CurrentUserInfoRequest;
  userID: UserID;
  individualID: IndividualID;
}

export const GetCurrentUserInfo = async (request: CurrentUserInfoRequest): Promise<CurrentUserInfoResponse> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const headers = GetHeaders();
    const response = await api.getCurrentUserInfo({ headers });
    return {
      request: request,
      userID: response.data.UserID || "",
      individualID: response.data.IndividualID || "",
    };
  } catch (e) {
    return throwError(e);
  }
};

export const IsLoggedIn = async (hostPort: string): Promise<boolean> => {
  try {
    const u = await GetCurrentUserInfo({ hostPort });
    return u.userID.trim().length > 0 && u.individualID.trim().length > 0;
  } catch (e) {
    if (e instanceof JWAuthenticationRequired) return false;
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
    if (tag.Private) continue;

    if (tagKey === "atag") output.Label = tag.Name || "";
    else if (tag.Name && tag.Name.trim().length > 0) {
      newTags[tag.Name.trim()] = tag.Value || "";
    }
  }

  output.Tags = newTags;
  return output;
}

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
