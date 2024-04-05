import { AxiosError } from "axios";
import { JWAuthenticationRequired } from "../../components/jw-address";
import { AddressInput, Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "../internal/apis/individuals";
import {
  Address,
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
  TagValue,
  UserID,
} from "../types/types";

export interface PrimaryTokenAddressRequest {
  hostPort: string;
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
  token: PrimaryToken;
}

export const GetAddressUsingPrimaryToken = async (request: PrimaryTokenAddressRequest): Promise<Address> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const response = await api.getAddressByID(request.addressID, request.token, request.serviceProviderID);
    const address = response.data || null;
    return convertToAddress(address);
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

export const GetAddressUsingSecondaryToken = async (request: SecondaryTokenAddressRequest): Promise<Address> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const response = await api.getAddressByID(request.addressID, request.token, request.beneficiaryID);
    const address = response.data || null;
    return convertToAddress(address);
  } catch (e) {
    return throwError(e);
  }
};

export interface OwnerTokenAddressRequest {
  hostPort: string;
  individualID: IndividualID;
  addressID: AddressID;
}

export const GetAddressUsingOwnerToken = async (request: OwnerTokenAddressRequest): Promise<Address> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  try {
    const response = await api.getAddressByID(request.addressID, "", "", request.individualID);
    const address = response.data || null;
    return convertToAddress(address);
  } catch (e) {
    return throwError(e);
  }
};

export interface CurrentUserInfoRequest {
  hostPort: string;
}

export interface CurrentUserInfoResponse {
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
    const response = await api.getCurrentUserInfo();
    return {
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
    throw e;
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
};
