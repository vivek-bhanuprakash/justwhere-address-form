import React, { useEffect, useState } from "react";
import { AddressInput, AddressOutput, Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "./apis/individuals";
import { Configuration as APITokensConfig, DefaultApi as APITokens, PrimaryTokenInput, SecondaryTokenInput } from "./apis/tokens";
import { PrimaryTokenRequest, PrimaryTokenResponse, SecondaryTokenRequest, SecondaryTokenResponse } from "./sdk";
import { AxiosError } from "axios";

type Request = {
}

export type RequestPrimaryToken = Request & {
  individualID: string
  addressID: string
  serviceProviderID: string
}

export type RequestSecondaryToken = Request & {
  serviceProviderID: string
  beneficiaryID: string
  primaryToken: string
}

type RequestDisplayAddress = Request & {
  // additional properties specific to display addresses
}

export type RequestDisplayAddressWithPrimaryToken = RequestDisplayAddress & {
  addressID: string
  serviceProviderID: string
  primaryToken: string
}

export type RequestDisplayAddressWithSecondaryToken = RequestDisplayAddress & {
  addressID: string
  beneficiaryID: string
  secondaryToken: string
}

export type RequestDisplayAddressWithOwnerToken = RequestDisplayAddress & {
  individualID: string
  addressID: string
}

type Response = {
}

export type ResponsePrimaryToken = Response & {
  token: string
  request: RequestPrimaryToken
}

export type ResponseSecondaryToken = Response & {
  token: string
  request: RequestSecondaryToken
}

const isRequestPrimaryToken = (obj: any): obj is RequestPrimaryToken => {
  return obj
    && obj.hasOwnProperty("individualID")
    && obj.hasOwnProperty("addressID")
    && obj.hasOwnProperty("serviceProviderID")
    && !obj.hasOwnProperty("beneficiaryID")
    && !obj.hasOwnProperty("primaryToken")
    && !obj.hasOwnProperty("secondaryToken");
}

const isRequestSecondaryToken = (obj: any): obj is RequestSecondaryToken => {
  return obj
    && obj.hasOwnProperty("serviceProviderID")
    && obj.hasOwnProperty("beneficiaryID")
    && obj.hasOwnProperty("primaryToken")
    && !obj.hasOwnProperty("individualID")
    && !obj.hasOwnProperty("addressID")
    && !obj.hasOwnProperty("secondaryToken");
}

const isRequestDisplayAddressWithPrimaryToken = (obj: any): obj is RequestDisplayAddressWithPrimaryToken => {
  return obj
    && obj.hasOwnProperty("addressID")
    && obj.hasOwnProperty("serviceProviderID")
    && obj.hasOwnProperty("primaryToken")
    && !obj.hasOwnProperty("individualID")
    && !obj.hasOwnProperty("beneficiaryID")
    && !obj.hasOwnProperty("secondaryToken");
}

const isRequestDisplayAddressWithSecondaryToken = (obj: any): obj is RequestDisplayAddressWithSecondaryToken => {
  return obj
    && obj.hasOwnProperty("addressID")
    && obj.hasOwnProperty("beneficiaryID")
    && obj.hasOwnProperty("secondaryToken")
    && !obj.hasOwnProperty("individualID")
    && !obj.hasOwnProperty("serviceProviderID")
    && !obj.hasOwnProperty("primaryToken");
}

const isRequestDisplayAddressWithOwnerToken = (obj: any): obj is RequestDisplayAddressWithOwnerToken => {
  return obj
    && obj.hasOwnProperty("individualID")
    && obj.hasOwnProperty("addressID")
    && !obj.hasOwnProperty("serviceProviderID")
    && !obj.hasOwnProperty("beneficiaryID")
    && !obj.hasOwnProperty("primaryToken")
    && !obj.hasOwnProperty("secondaryToken");
}

const genereratePrimaryToken = async (hostport: string, request: PrimaryTokenRequest): Promise<string> => {
  const input: PrimaryTokenInput = {
    individualID: request.individualID,
    addressID: request.addressID,
    serviceProviderID: request.serviceProviderID,
  };

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APITokens(config);

  const response = await api.createPrimaryToken(input);
  const token = response.data.token || "";
  return token;
}

const genererateSecondaryToken = async (hostport: string, request: RequestSecondaryToken): Promise<string> => {
  const input: SecondaryTokenInput = {
    serviceProviderID: request.serviceProviderID,
    beneficiaryID: request.beneficiaryID,
    token: request.primaryToken,
  };

  const config: APITokensConfig = new APITokensConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APITokens(config);

  const response = await api.createSecondaryToken(input);
  const token = response.data.token || "";
  return token;
}

const getAddressUsingPrimaryToken = async (hostport: string, request: RequestDisplayAddressWithPrimaryToken): Promise<AddressOutput> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getAddressByID(request.addressID, request.primaryToken, request.serviceProviderID);
  const address = response.data || null;
  return address;
};

const getAddressUsingSecondaryToken = async (hostport: string, request: RequestDisplayAddressWithSecondaryToken): Promise<AddressOutput> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getAddressByID(request.addressID, request.secondaryToken, request.beneficiaryID);
  const address = response.data || null;
  return address;
}

const getAddressUsingOwnerToken = async (hostport: string, request: RequestDisplayAddressWithOwnerToken): Promise<AddressOutput> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getAddressByID(request.addressID, "", "", request.individualID);
  const address = response.data || null;
  return address;
}

const setPrimaryTokenResponse = (token: string, props: AddressProps) => {
  const ptr: PrimaryTokenResponse = {
    request: props.request as PrimaryTokenRequest,
    token: token
  }
  props.response = ptr;
}

const setSecondaryTokenResponse = (token: string, props: AddressProps) => {
  const str: SecondaryTokenResponse = {
    request: props.request as SecondaryTokenRequest,
    token: token
  }
  props.response = str;
}

export class JWErrorAuthenticationRequired extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorAuthenticationRequired";
  }
}

export class JWErrorForbidden extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorForbidden";
  }
}

export class JWErrorBadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorBadRequest";
  }
}

type RequestType = RequestPrimaryToken | RequestSecondaryToken | RequestDisplayAddressWithPrimaryToken | RequestDisplayAddressWithSecondaryToken | RequestDisplayAddressWithOwnerToken
type ResponseType = ResponsePrimaryToken | ResponseSecondaryToken
type ErrorType = JWErrorAuthenticationRequired | JWErrorBadRequest
export interface AddressProps {
  hostport: string,
  request: RequestType,
  response: ResponseType
  onError: (error: ErrorType) => void;
}

const AddressComponent: React.FC<AddressProps> = (props: AddressProps) => {
  const [address, setAddress] = useState<AddressOutput>();
  const [isTR, setIsTR] = useState<boolean>(false);
  const [isDAR, setIsDAR] = useState<boolean>(false);
  const [isPTR, setIsPTR] = useState<boolean>(false);
  const [isSTR, setIsSTR] = useState<boolean>(false);
  const [isDARWPTR, setIsDARWPTR] = useState<boolean>(false);
  const [isDARWSTR, setIsDARWSTR] = useState<boolean>(false);
  const [isDARWOTR, setIsDARWOTR] = useState<boolean>(false);

  const viewAddress = async () => {
    let address: AddressOutput = {};

    try {
      if (isPTR) {
        const request: PrimaryTokenRequest = props.request as PrimaryTokenRequest;
        const req: RequestDisplayAddressWithOwnerToken = {
          individualID: request.individualID,
          addressID: request.addressID,
        }
        address = await getAddressUsingOwnerToken(props.hostport, req)
      }

      if (isSTR) {
        const request: SecondaryTokenRequest = props.request as SecondaryTokenRequest;
        const req: RequestDisplayAddressWithOwnerToken = {
          individualID: request.individualID,
          addressID: request.addressID,
        }
        address = await getAddressUsingOwnerToken(props.hostport, req)
      }

      if (isDARWPTR) {
        const request: RequestDisplayAddressWithPrimaryToken = props.request as RequestDisplayAddressWithPrimaryToken;
        address = await getAddressUsingPrimaryToken(props.hostport, request)
      }

      if (isDARWSTR) {
        const request: RequestDisplayAddressWithSecondaryToken = props.request as RequestDisplayAddressWithSecondaryToken;
        address = await getAddressUsingSecondaryToken(props.hostport, request)
      }

      if (isDARWOTR) {
        const request: RequestDisplayAddressWithOwnerToken = props.request as RequestDisplayAddressWithOwnerToken;
        address = await getAddressUsingOwnerToken(props.hostport, request)
      }

      setAddress(address);
    } catch (e) {
      if (e instanceof AxiosError) {
        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          props.onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          props.onError(new JWErrorForbidden("Forbidden"))
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          props.onError(new JWErrorBadRequest("Bad request"))
        }
      }
    }
  }

  const getHandle = async () => {
    try {
      if (isPTR) {
        const request: PrimaryTokenRequest = props.request as PrimaryTokenRequest;
        const token = await genereratePrimaryToken(props.hostport, request)
        setPrimaryTokenResponse(token, props)
      }

      if (isSTR) {
        const request: SecondaryTokenRequest = props.request as SecondaryTokenRequest;
        const token = await genereratePrimaryToken(props.hostport, request)
        setSecondaryTokenResponse(token, props)
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          props.onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          props.onError(new JWErrorForbidden("Forbidden"))
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          props.onError(new JWErrorBadRequest("Bad request"))
        }
      }
    }
  }

  useEffect(() => {

    setIsTR(false)
    setIsDAR(false)
    setIsPTR(false)
    setIsSTR(false)
    setIsDARWPTR(false)
    setIsDARWSTR(false)
    setIsDARWOTR(false)

    if (isRequestPrimaryToken(props.request)) {
      setIsPTR(true)
      setIsTR(true)
    } else if (isRequestSecondaryToken(props.request)) {
      setIsPTR(true)
      setIsSTR(true)
    } else if (isRequestDisplayAddressWithPrimaryToken(props.request)) {
      setIsDAR(true)
      setIsDARWPTR(true)
    } else if (isRequestDisplayAddressWithSecondaryToken(props.request)) {
      setIsDAR(true)
      setIsDARWSTR(true)
    } else if (isRequestDisplayAddressWithOwnerToken(props.request)) {
      setIsDAR(true)
      setIsDARWOTR(true)
    } else {
      // error - invalid prop values
    }

    if (isTR) {
      // attempt to automatically view the address
      viewAddress();
    }

  }, [props.request]);

  return (
    <>
      <div className="grid grid-cols-1 items-center justify-start gap-4">
        <div>
          <label htmlFor="address-label" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
            Label
          </label>
          <input
            type="text"
            id="address-label"
            className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="No value here"
          />
        </div>
        <div>
          <label htmlFor="address-addressee" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="address-addressee"
            className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="No value here"
            value={address?.addressee}
          />
        </div>
        <div>
          <label htmlFor="address-street1" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
            Street
          </label>
          <input
            type="text"
            id="address-street1"
            className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="No value here"
            value={address?.street}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="address-city" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              City
            </label>
            <input
              type="text"
              id="address-city"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.city}
            />
          </div>
          <div>
            <label htmlFor="address-state" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              State
            </label>
            <input
              type="text"
              id="address-state"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.state}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="address-zipcode" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Zipcode
            </label>
            <input
              type="text"
              id="address-zipcode"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.zipCode}
            />
          </div>
          <div>
            <label htmlFor="address-country" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="address-country"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.country}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="address-phone" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              id="address-phone"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.phone}
            />
          </div>
          <div>
            <label htmlFor="address-email" className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="address-email"
              className="block w-full rounded-sm border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="No value here"
              value={address?.email}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {(isTR || isDAR) &&
            <button type="button" id="btnViewAddress"
              className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2.5 text-sm font-bold uppercase text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
              onClick={viewAddress}
            >
              <svg className="me-2 h-8 w-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <image href="https://dev.justwhere.io/justwhere.svg" className="h-8 w-8" />
              </svg>
              View Address
            </button>
          }
          {(isTR) &&
            <button type="button" id="btnGetHandle"
              className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2.5 text-sm font-bold uppercase text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
              onClick={getHandle}
            >
              <svg className="me-2 h-8 w-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <image href="https://dev.justwhere.io/justwhere.svg" className="h-8 w-8" />
              </svg>
              Get Handle
            </button>
          }
        </div>
      </div>
    </>
  );
};

export default AddressComponent;
