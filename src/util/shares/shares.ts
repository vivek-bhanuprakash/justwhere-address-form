import { Record as Share, RecordsApi } from "../internal/sdk/";
import { throwError } from "../types/errors";
import {
  AddressID,
  BeneficiaryID,
  CreateAPIConfig,
  JWAPIRequest,
  retryOperation,
  SecureContentID,
  SecureContentTemplate,
  ServiceProviderID,
} from "../types/types";

export interface ServiceProviderAddressSharesRequest extends JWAPIRequest {
  addressID: AddressID;
  serviceProviderID: ServiceProviderID;
}

export interface ServiceProviderAddressSharesResponse {
  request: ServiceProviderAddressSharesRequest;
  shares: Share[];
}

export const GetAddressSharesWithServiceProvider = async (request: ServiceProviderAddressSharesRequest): Promise<ServiceProviderAddressSharesResponse> => {
  const config = CreateAPIConfig(request);

  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getServiceProviderRecordsForAddress(request.addressID, request.serviceProviderID));
    return {
      request: request,
      shares: response.data,
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface BeneficiaryAddressSharesRequest extends JWAPIRequest {
  addressID: AddressID;
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiaryAddressSharesResponse {
  request: BeneficiaryAddressSharesRequest;
  shares: Share[];
}

export const GetAddressSharesWithBeneficiary = async (request: BeneficiaryAddressSharesRequest): Promise<BeneficiaryAddressSharesResponse> => {
  const config = CreateAPIConfig(request);

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

export interface ServiceProviderSecureContentSharesRequest extends JWAPIRequest {
  contentID: SecureContentID;
  serviceProviderID: ServiceProviderID;
}

export interface ServiceProviderSecureContentSharesResponse {
  request: ServiceProviderSecureContentSharesRequest;
  shares: Array<Share>;
}

export const GetSecureContentSharesWithServiceProvider = async (
  request: ServiceProviderSecureContentSharesRequest,
): Promise<ServiceProviderSecureContentSharesResponse> => {
  const config = CreateAPIConfig(request);

  const api = new RecordsApi(config);

  try {
    const response = await retryOperation(() => api.getSecuredcontentRecord(request.contentID));
    return {
      request: request,
      shares: response.data.filter((share) => share.serviceProviderID === request.serviceProviderID),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface BeneficiarySecureContentSharesRequest extends JWAPIRequest {
  contentID: SecureContentID;
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiarySecureContentSharesResponse {
  request: BeneficiarySecureContentSharesRequest;
  shares: Array<Share>;
}

export const GetSecureContentSharesWithBeneficiary = async (
  request: BeneficiarySecureContentSharesRequest,
): Promise<BeneficiarySecureContentSharesResponse> => {
  const config = CreateAPIConfig(request);

  const api = new RecordsApi(config);

  try {
    const response = await api.getSecuredcontentRecord(request.contentID);
    // filter out shares that are not for the beneficiary
    return {
      request: request,
      shares: response.data.filter((share) => share.beneficiaryID === request.beneficiaryID),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface ServiceProviderSharesRequest extends JWAPIRequest {
  contentID: SecureContentID;
  contentTemplate: SecureContentTemplate;
  serviceProviderID: ServiceProviderID;
}

export interface ServiceProviderSharesResponse {
  request: ServiceProviderSharesRequest;
  shares: Array<Share>;
}

export const GetSharesWithServiceProvider = async (request: ServiceProviderSharesRequest): Promise<ServiceProviderSharesResponse> => {
  if (request.contentTemplate.Type.toLowerCase() === "address") {
    const req: ServiceProviderAddressSharesRequest = {
      hostPort: request.hostPort,
      authToken: request.authToken,
      addressID: request.contentID,
      serviceProviderID: request.serviceProviderID,
    };
    const response = await GetAddressSharesWithServiceProvider(req);
    return {
      request: request,
      shares: response.shares,
    };
  }

  const req: ServiceProviderSecureContentSharesRequest = {
    hostPort: request.hostPort,
    authToken: request.authToken,
    contentID: request.contentID,
    serviceProviderID: request.serviceProviderID,
  };
  const response = await GetSecureContentSharesWithServiceProvider(req);
  return {
    request: request,
    shares: response.shares,
  };
};

export interface BeneficiarySharesRequest extends JWAPIRequest {
  contentID: SecureContentID;
  contentTemplate: SecureContentTemplate;
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiarySharesResponse {
  request: BeneficiarySharesRequest;
  shares: Array<Share>;
}

export const GetSharesWithBeneficiary = async (request: BeneficiarySharesRequest): Promise<BeneficiarySharesResponse> => {
  if (request.contentTemplate.Type.toLowerCase() === "address") {
    const req: BeneficiaryAddressSharesRequest = {
      hostPort: request.hostPort,
      authToken: request.authToken,
      addressID: request.contentID,
      beneficiaryID: request.beneficiaryID,
    };
    const response = await GetAddressSharesWithBeneficiary(req);
    return {
      request: request,
      shares: response.shares,
    };
  }

  const req: BeneficiarySecureContentSharesRequest = {
    hostPort: request.hostPort,
    authToken: request.authToken,
    contentID: request.contentID,
    beneficiaryID: request.beneficiaryID,
  };
  const response = await GetSecureContentSharesWithBeneficiary(req);
  return {
    request: request,
    shares: response.shares,
  };
};
