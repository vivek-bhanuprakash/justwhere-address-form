import { Record as Share, RecordsApi } from "../internal/sdk/";
import { throwError } from "../types/errors";

// 1. all shares with a particular SP by a given individual
// 2. all address shares with a particular SP
// 3. all secure content shares with a particular SP

import { AddressID, CreateAPIConfig, IndividualID, JWAPIRequest, NULL_UUID, retryOperation, SecureContentID, ServiceProviderID } from "../types/types";

interface SharesWithServiceProviderBase extends JWAPIRequest {
  serviceProviderID: ServiceProviderID;
}

type SharesWithServiceProviderRequest<T> = SharesWithServiceProviderBase & T;

export type AllIndividualSharesWithServiceProviderRequest = SharesWithServiceProviderRequest<{ individualID: IndividualID }>;

export type AllAddressSharesWithServiceProviderRequest = SharesWithServiceProviderRequest<{ individualID: IndividualID }>;
export type AddressSharesWithServiceProviderRequest = SharesWithServiceProviderRequest<{ individualID?: IndividualID, addressID: AddressID }>;

export type AllSecureContentSharesWithServiceProviderRequest = SharesWithServiceProviderRequest<{ individualID: IndividualID }>;
export type SecureContentSharesWithServiceProviderRequest = SharesWithServiceProviderRequest<{ individualID?: IndividualID, contentID: SecureContentID }>;

type SharesWithServiceProviderResponse<T> = {
  shares: Array<Share>;
  request: SharesWithServiceProviderRequest<T>;
};

export type AllIndividualSharesWithServiceProviderResponse = SharesWithServiceProviderResponse<AllIndividualSharesWithServiceProviderRequest>;

export type AllAddressSharesWithServiceProviderResponse = SharesWithServiceProviderResponse<AllAddressSharesWithServiceProviderRequest>;
export type AddressSharesWithServiceProviderResponse = SharesWithServiceProviderResponse<AddressSharesWithServiceProviderRequest>;

export type AllSecureContentSharesWithServiceProviderResponse = SharesWithServiceProviderResponse<AllSecureContentSharesWithServiceProviderRequest>;
export type SecureContentSharesWithServiceProviderResponse = SharesWithServiceProviderResponse<SecureContentSharesWithServiceProviderRequest>;

export const GetAllIndividualSharesWithServiceProvider = async (request: AllIndividualSharesWithServiceProviderRequest): Promise<AllIndividualSharesWithServiceProviderResponse> => {
  const config = CreateAPIConfig(request);
  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getIndividualRecords(request.individualID));
    return {
      request: request,
      shares: response.data.filter((share) => share.serviceProviderID === request.serviceProviderID),
    };
  } catch (e) {
    return throwError(e);
  }
};

export const GetAllAddressSharesWithServiceProvider = async (request: AllAddressSharesWithServiceProviderRequest): Promise<AllAddressSharesWithServiceProviderResponse> => {
  const config = CreateAPIConfig(request);
  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getServiceProviderRecords(request.serviceProviderID));
    return {
      request: request,
      shares: response.data.filter((share) => share.addressID !== NULL_UUID).filter((share) => share.individualID === request.individualID),
    };
  } catch (e) {
    return throwError(e);
  }
};

export const GetAddressSharesWithServiceProvider = async (request: AddressSharesWithServiceProviderRequest): Promise<AddressSharesWithServiceProviderResponse> => {
  const config = CreateAPIConfig(request);
  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getServiceProviderRecordsForAddress(request.addressID, request.serviceProviderID));
    return {
      request: request,
      shares: response.data.filter((share) => request.individualID ? share.individualID === request.individualID : true),
    };
  } catch (e) {
    return throwError(e);
  }
};

export const GetAllSecureContentSharesWithServiceProvider = async (request: AllSecureContentSharesWithServiceProviderRequest): Promise<AllSecureContentSharesWithServiceProviderResponse> => {
  const config = CreateAPIConfig(request);
  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getServiceProviderRecords(request.serviceProviderID));
    return {
      request: request,
      shares: response.data.filter((share) => share.individualID === request.individualID).filter((share) => Boolean(share.securedcontentID)),
    };
  } catch (e) {
    return throwError(e);
  }
};

export const GetSecureContentSharesWithServiceProvider = async (request: SecureContentSharesWithServiceProviderRequest): Promise<SecureContentSharesWithServiceProviderResponse> => {
  const config = CreateAPIConfig(request);
  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getSecuredcontentRecord(request.contentID));
    return {
      request: request,
      shares: response.data.filter((share) => share.serviceProviderID === request.serviceProviderID).filter((share) => request.individualID ? share.individualID === request.individualID : true),
    };
  } catch (e) {
    return throwError(e);
  }
};
