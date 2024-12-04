import { BeneficiaryApi, BeneficiaryLimited, GenericServiceProvider, ServiceproviderApi } from "../internal/sdk/";
import { throwError } from "../types/errors";
import { Beneficiary, BeneficiaryID, CreateAPIConfig, JWAPIRequest, ServiceProvider } from "../types/types";

export interface BeneficiaryInfoRequest extends JWAPIRequest {
  beneficiaryID: BeneficiaryID;
}

export interface BeneficiaryInfoResponse {
  request: BeneficiaryInfoRequest;
  beneficiary: Beneficiary;
}

export const GetBeneficiaryInfo = async (request: BeneficiaryInfoRequest): Promise<BeneficiaryInfoResponse> => {
  const config = CreateAPIConfig(request);

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

export interface ServiceProviderInfoRequest extends JWAPIRequest {
  serviceProviderID: string;
}

export interface ServiceProviderInfoResponse {
  request: ServiceProviderInfoRequest;
  serviceProvider: ServiceProvider;
}

export const GetServiceProviderInfo = async (request: ServiceProviderInfoRequest): Promise<ServiceProviderInfoResponse> => {
  const config = CreateAPIConfig(request);

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
