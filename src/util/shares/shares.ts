import { AxiosError } from "axios";
import { Configuration, Record as Share, RecordsApi } from "../internal/sdk/";
import {
  AddressID,
  BeneficiaryID,
  GetAuthToken,
  JWError,
  JWErrorAuthenticationRequired,
  JWErrorBadRequest,
  JWErrorForbidden,
  JWErrorNotFound,
  JWErrorServerError,
  ServiceProviderID,
} from "../types/types";

export interface ServiceProviderSharesRequest {
  hostPort: string;
  authToken?: string;
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
}

export interface ServiceProviderSharesResponse {
  request: ServiceProviderSharesRequest;
  shares: Share[];
}

export const GetSharesWithServiceProvider = async (request: ServiceProviderSharesRequest): Promise<ServiceProviderSharesResponse> => {
  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new RecordsApi(config);

  try {
    const response = await api.getServiceProviderRecordsForAddress(request.addressID, request.serviceProviderID);
    return {
      request: request,
      shares: response.data,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface BeneficiarySharesRequest {
  hostPort: string;
  authToken?: string;
  addressID: AddressID;
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiarySharesResponse {
  request: BeneficiarySharesRequest;
  shares: Share[];
}

export const GetSharesWithBeneficiary = async (request: BeneficiarySharesRequest): Promise<BeneficiarySharesResponse> => {
  const authToken = request.authToken || GetAuthToken().token;

  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new RecordsApi(config);

  try {
    const response = await api.getBeneficiaryRecordsForAddress(request.addressID, request.beneficiaryID);
    return {
      request: request,
      shares: response.data,
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
