import { AxiosError } from "axios";
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
    if (!tag.Private) {
      if (tagKey === "atag") output.Type = tag.Name || "";
      else if (tag.Name) {
        newTags[tag.Name] = tag.Value || "";
      }
    }
  }

  output.Tags = newTags;
  return output;
}
