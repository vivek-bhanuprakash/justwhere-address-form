import { AxiosError } from "axios";
import { BeneficiaryApi, BeneficiaryLimited, Configuration, GenericServiceProvider, ServiceproviderApi } from "../internal/sdk/";
import {
  Beneficiary,
  BeneficiaryID,
  GetAuthToken,
  JWError,
  JWErrorAuthenticationRequired,
  JWErrorBadRequest,
  JWErrorForbidden,
  JWErrorNotFound,
  JWErrorServerError,
  ServiceProvider,
} from "../types/types";

export interface BeneficiaryInfoRequest {
  hostPort: string;
  authToken?: string;
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiaryInfoResponse {
  request: BeneficiaryInfoRequest;
  beneficiary: Beneficiary;
}

export const GetBeneficiaryInfo = async (request: BeneficiaryInfoRequest): Promise<BeneficiaryInfoResponse> => {
  const authToken = request.authToken || GetAuthToken().token;
  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new BeneficiaryApi(config);

  try {
    const response = await api.getBeneficiaryDetails(request.beneficiaryID);
    return {
      request: request,
      beneficiary: convertToBeneficiary(response.data),
    };
  } catch (e) {
    return throwError(e);
  }
};

export interface ServiceProviderInfoRequest {
  hostPort: string;
  authToken?: string;
  serviceProviderID: string;
}

export interface ServiceProviderInfoResponse {
  request: ServiceProviderInfoRequest;
  serviceProvider: ServiceProvider;
}

export const GetServiceProviderInfo = async (request: ServiceProviderInfoRequest): Promise<ServiceProviderInfoResponse> => {
  const authToken = request.authToken || GetAuthToken().token;
  const config: Configuration = new Configuration({
    basePath: `${request.hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
    accessToken: authToken,
  });

  const api = new ServiceproviderApi(config);

  try {
    const response = await api.getServiceProviderDetails(request.serviceProviderID);
    return {
      request: request,
      serviceProvider: convertToServiceProvider(response.data),
    };
  } catch (e) {
    return throwError(e);
  }
};

const convertToBeneficiary = (data: BeneficiaryLimited): Beneficiary => {
  return {
    ID: data?.id || "",
    Name: propertyValue(data, "name"),
    Description: propertyValue(data, "description"),
    Contact: propertyValue(data, "addressee"),
    Category: propertyValue(data, "categories"),
    Street1: propertyValue(data, "street"),
    Street2: "",
    Street3: "",
    City: propertyValue(data, "city"),
    State: propertyValue(data, "state"),
    PostCode: propertyValue(data, "zipCode"),
    Country: propertyValue(data, "country"),
    Phone: propertyValue(data, "phone"),
    Email: propertyValue(data, "email"),
    Website: propertyValue(data, "website"),
    Tags: data?.tags || {},
  };
};

const convertToServiceProvider = (data: GenericServiceProvider): ServiceProvider => {
  return {
    ID: data?.id || "",
    Name: propertyValue(data, "name"),
    Description: propertyValue(data, "description"),
    Contact: propertyValue(data, "addressee"),
    Category: propertyValue(data, "categories"),
    Street1: propertyValue(data, "street"),
    Street2: "",
    Street3: "",
    City: propertyValue(data, "city"),
    State: propertyValue(data, "state"),
    PostCode: propertyValue(data, "zipCode"),
    Country: propertyValue(data, "country"),
    Phone: propertyValue(data, "phone"),
    Email: propertyValue(data, "email"),
    Website: propertyValue(data, "website"),
    Tags: data?.tags || {},
  };
};

const propertyValue = (data: any, key: string): string => {
  return (data?.tags?.[key]?.Value as string) || "";
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
