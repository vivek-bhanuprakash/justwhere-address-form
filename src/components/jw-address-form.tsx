import React, { useEffect, useState } from "react";
import {
  Address,
  CurrentUserInfoRequest,
  CurrentUserInfoResponse,
  GenereratePrimaryToken,
  GenererateSecondaryToken,
  GetAddressUsingOwnerToken,
  GetAddressUsingPrimaryToken,
  GetAddressUsingSecondaryToken,
  GetCurrentUserInfo,
  JWError,
  JWErrorBadRequest,
  JWErrorForbidden,
  OwnerTokenAddressRequest,
  PrimaryTokenAddressRequest,
  PrimaryTokenRequest,
  PrimaryTokenResponse,
  SecondaryTokenAddressRequest,
  SecondaryTokenRequest,
} from "../util";
import { OnErrorFcn, OnNewPrimaryToken, OnNewSecondaryToken } from "./jw-address";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = (props: InputProps) => {
  return (
    <input
      type="text"
      className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-xs font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      {...props}
    />
  );
};

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
const Label: React.FC<LabelProps> = (props: LabelProps) => {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900" {...props}>
      {props.children}
    </label>
  );
};

const setPrimaryTokenResponse = (onNewPrimaryToken: Function, individualID: string, addressID: string, serviceProviderID: string, token: string) => {
  if (onNewPrimaryToken !== undefined) {
    onNewPrimaryToken(token);
  }
};

const setSecondaryTokenResponse = (onNewSecondaryToken: Function, serviceProviderID: string, beneficiaryID: string, token: string) => {
  if (onNewSecondaryToken !== undefined) {
    onNewSecondaryToken(token);
  }
};

enum UserType {
  Unknown,
  Self,
  Other,
}

enum AddressValidity {
  Unknown,
  Invalid,
  Self,
  Other,
}

const getUserType = (userInfo: CurrentUserInfoResponse, individualID: string): UserType => {
  if (userInfo !== null) {
    if (userInfo.individualID === undefined || userInfo.individualID.trim().length === 0) return UserType.Unknown;

    if (userInfo.individualID === individualID) {
      return UserType.Self;
    }

    return UserType.Other;
  } else {
    return UserType.Unknown;
  }
};

// Regular expression to check if string is a valid UUID
// Source: https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
export const JW_ID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export class JWErrorAuthenticationRequired extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorAuthenticationRequired";
  }
}

export interface UserInfo {
  userID: string;
  individualID: string;
}

export interface AddressProps {
  hostPort: string;
  userInfo: UserInfo;
  individualID: string;
  addressID?: string;
  serviceProviderID?: string;
  primaryToken?: string;
  beneficiaryID?: string;
  secondaryToken?: string;
  onError?: OnErrorFcn;
  onNewPrimaryToken?: OnNewPrimaryToken;
  onNewSecondaryToken?: OnNewSecondaryToken;
}

const JWAddressForm: React.FC<AddressProps> = ({
  hostPort: hostport,
  userInfo,
  individualID,
  addressID,
  serviceProviderID,
  primaryToken,
  beneficiaryID,
  secondaryToken,
  onError,
  onNewPrimaryToken,
  onNewSecondaryToken,
}) => {
  // const [address, setAddress] = useState<AddressInput>();
  const [address, setAddress] = useState<Address>();
  const [userType, setUserType] = useState<UserType>(UserType.Unknown);
  const [addressValidity, setAddressValidity] = useState<AddressValidity>(AddressValidity.Unknown);

  const [showViewAddress, setShowViewAddress] = useState<boolean>(false);
  const [showEditAddress, setShowEditAddress] = useState<boolean>(false);
  const [showListAddresses, setShowListAddresses] = useState<boolean>(false);
  const [showGenPrimaryToken, setShowGenPrimaryToken] = useState<boolean>(false);
  const [showGenSecondaryToken, setShowGenSecondaryToken] = useState<boolean>(false);
  const [showViewAddressPrimaryToken, setShowViewAddressPrimaryToken] = useState<boolean>(false);
  const [showViewAddressSecondaryToken, setShowViewAddressSecondaryToken] = useState<boolean>(false);

  const onViewAddressWithSecondaryToken = async () => {
    try {
      const request: SecondaryTokenAddressRequest = {
        hostPort: hostport,
        addressID: addressID || "",
        beneficiaryID: beneficiaryID || "",
        token: secondaryToken || "",
      };

      const response = await GetAddressUsingSecondaryToken(request);
      setAddress(response.address);
    } catch (e) {
      if (onError === undefined || typeof onError !== "function") {
        console.warn("JustWhere: onError function is undefined or not a function");
        console.error("JustWhere: error fetching address using secondary token: ", e);
        return;
      }
      return onError(e as JWError);
    }
  };

  const onViewAddressWithPrimaryToken = async () => {
    try {
      const request: PrimaryTokenAddressRequest = {
        hostPort: hostport,
        addressID: addressID || "",
        serviceProviderID: serviceProviderID || "",
        token: primaryToken || "",
      };

      const response = await GetAddressUsingPrimaryToken(request);
      const address = response.address;

      address.Label = address.Label === undefined ? "Hidden" : address.Label.trim().length === 0 ? "Hidden" : address.Label;
      address.Name = address.Name === undefined ? "Hidden" : address.Name.trim().length === 0 ? "Hidden" : address.Name;
      address.Street1 = address.Street1 === undefined ? "Hidden" : address.Street1.trim().length === 0 ? "Hidden" : address.Street1;
      address.Street2 = address.Street2 === undefined ? "Hidden" : address.Street2.trim().length === 0 ? "Hidden" : address.Street2;
      address.Street3 = address.Street3 === undefined ? "Hidden" : address.Street3.trim().length === 0 ? "Hidden" : address.Street3;
      address.City = address.City === undefined ? "Hidden" : address.City.trim().length === 0 ? "Hidden" : address.City;
      address.State = address.State === undefined ? "Hidden" : address.State.trim().length === 0 ? "Hidden" : address.State;
      address.PostCode = address.PostCode === undefined ? "Hidden" : address.PostCode.trim().length === 0 ? "Hidden" : address.PostCode;
      address.Country = address.Country === undefined ? "Hidden" : address.Country.trim().length === 0 ? "Hidden" : address.Country;
      address.Phone = address.Phone === undefined ? "Hidden" : address.Phone.trim().length === 0 ? "Hidden" : address.Phone;
      address.Email = address.Email === undefined ? "Hidden" : address.Email.trim().length === 0 ? "Hidden" : address.Email;
      setAddress(address);
    } catch (e) {
      if (onError === undefined || typeof onError !== "function") {
        console.warn("JustWhere: onError function is undefined or not a function");
        console.error("JustWhere: error fetching address using primary token: ", e);
        return;
      }
      return onError(e as JWError);
    }
  };

  const onViewSelfAddress = async () => {
    try {
      clearAddress();
      const request: OwnerTokenAddressRequest = {
        hostPort: hostport,
        individualID: individualID,
        addressID: addressID || "",
      };
      const response = await GetAddressUsingOwnerToken(request);
      setAddress(response.address);
    } catch (e) {
      if (onError === undefined || typeof onError !== "function") {
        console.warn("JustWhere: onError function is undefined or not a function");
        console.error("JustWhere: error generating primary token: ", e);
        return;
      }
      return onError(e as JWError);
    }
  };

  const onGenerateSecondaryToken = async () => {
    try {
      if (onNewSecondaryToken === undefined || typeof onNewSecondaryToken !== "function") {
        console.warn("JustWhere: onNewSecondaryToken function is undefined or not a function. no token will be generated.");
        return;
      }

      const request: SecondaryTokenRequest = {
        hostPort: hostport,
        serviceProviderID: serviceProviderID || "",
        beneficiaryID: beneficiaryID || "",
        token: primaryToken || "",
      };

      const response = await GenererateSecondaryToken(request);
      setSecondaryTokenResponse(onNewSecondaryToken, serviceProviderID || "", beneficiaryID || "", response.token);
    } catch (e) {
      if (onError === undefined || typeof onError !== "function") {
        console.warn("JustWhere: onError function is undefined or not a function");
        console.error("JustWhere: error generating secondary token: ", e);
        return;
      }
      return onError(e as JWError);
    }
  };

  const onGeneratePrimaryToken = async () => {
    try {
      if (onNewPrimaryToken === undefined || typeof onNewPrimaryToken !== "function") {
        console.warn("JustWhere: onNewPrimaryToken function is undefined or not a function. no token will be generated.");
        return;
      }

      const request: PrimaryTokenRequest = {
        hostPort: hostport,
        individualID: individualID,
        addressID: addressID || "",
        serviceProviderID: serviceProviderID || "",
      };

      const response: PrimaryTokenResponse = await GenereratePrimaryToken(request);
      setPrimaryTokenResponse(onNewPrimaryToken, individualID, addressID || "", serviceProviderID || "", response.token);
    } catch (e) {
      if (onError === undefined || typeof onError !== "function") {
        console.warn("JustWhere: onError function is undefined or not a function");
        console.error("JustWhere: error generating primary token: ", e);
        return;
      }
      return onError(e as JWError);
    }
  };

  const clearAddress = () => {
    const empty: Address = {
      ID: "",
      IndividualID: "",
      Street1: "",
      Street2: "",
      Street3: "",
      City: "",
      State: "",
      PostCode: "",
      Country: "",
      Name: "",
      Label: "",
      Phone: "",
      Email: "",
    };
    setAddress(empty);
  };

  const onEditAddress = () => {};

  const onListAddress = () => {};

  // determine type of user based on
  // current logged in user's individualID
  // and supplied individualID
  useEffect(() => {
    const fnEffect = async () => {
      if (userType !== UserType.Unknown) setUserType(UserType.Unknown);

      if (individualID === undefined) return;

      if (typeof individualID !== "string") return;

      if (individualID.trim().length === 0) return;

      try {
        const request: CurrentUserInfoRequest = { hostPort: hostport };
        const response = await GetCurrentUserInfo(request);
        const userType: UserType = getUserType(response, individualID);
        setUserType(userType);
      } catch (e) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JWAddress: no onError handler provided, or onError is not a function");
          console.error(e);
          return;
        }

        return onError(e as JWError);
      }
    };

    fnEffect();
  }, [individualID]);

  // determine if the provided addressID belongs
  // to current logged in user
  useEffect(() => {
    const fnEffect = async () => {
      if (userType === UserType.Unknown) {
        setAddressValidity(AddressValidity.Unknown);
        return;
      }

      if (userType === UserType.Other) {
        setAddressValidity(AddressValidity.Other);
        return;
      }

      if (addressID === undefined) {
        setAddressValidity(AddressValidity.Invalid);
        return;
      }

      if (typeof addressID !== "string") {
        setAddressValidity(AddressValidity.Invalid);
        return;
      }

      // if (!JW_ID_PATTERN.test(addressID)) {
      //   setAddressValidity(AddressValidity.Invalid);
      //   return;
      // }

      try {
        clearAddress();
        const request: OwnerTokenAddressRequest = { hostPort: hostport, addressID: addressID || "", individualID: individualID || "" };
        await GetAddressUsingOwnerToken(request);
        setAddressValidity(AddressValidity.Self);
        await onViewSelfAddress();
      } catch (e) {
        if (e instanceof JWErrorBadRequest) {
          setAddressValidity(AddressValidity.Other);
          return;
        }

        if (e instanceof JWErrorForbidden) {
          setAddressValidity(AddressValidity.Other);
          return;
        }

        if (onError === undefined || typeof onError !== "function") {
          console.warn("JWAddress: no onError handler provided, or onError is not a function");
          console.error(e);
          return;
        }

        onError(e as JWError);
      }
    };

    fnEffect();
  }, [userType, addressID]);

  // visibility of edit address btn
  useEffect(() => {
    if (showEditAddress !== false) setShowEditAddress(false);

    if (userType !== UserType.Self) return;

    if (addressValidity !== AddressValidity.Self) return;

    // setShowEditAddress(true);
    setShowEditAddress(false);
  }, [userType, addressValidity]);

  // visibility of list addresses btn
  useEffect(() => {
    setShowListAddresses(userType === UserType.Self);
  }, [userType]);

  // visibility of generate primary token btn
  useEffect(() => {
    if (showGenPrimaryToken !== false) setShowGenPrimaryToken(false);

    // individualID is not current user
    if (userType !== UserType.Self) return;

    if (addressValidity !== AddressValidity.Self) return;

    // serviceProviderID sanity checks
    if (serviceProviderID === undefined) return;

    if (typeof serviceProviderID !== "string") return;

    // id must be a UUID
    // if (!JW_ID_PATTERN.test(serviceProviderID)) return;

    setShowGenPrimaryToken(true);
  }, [userType, addressValidity, serviceProviderID]);

  // visibility of generate secondary token btn
  useEffect(() => {
    console.log("abc: ", showGenPrimaryToken, userType, serviceProviderID, primaryToken, beneficiaryID);
    if (showGenSecondaryToken !== false) setShowGenSecondaryToken(false);

    // individualID is not current user
    if (userType !== UserType.Self) return;

    console.log("2");
    // serviceProviderID sanity checks
    if (serviceProviderID === undefined) return;

    console.log("3");
    if (typeof serviceProviderID !== "string") return;

    console.log("4");
    // id must be a UUID
    // console.log(JW_ID_PATTERN.test(serviceProviderID))
    // if (!JW_ID_PATTERN.test(serviceProviderID)) return;

    console.log("5");
    // primaryToken sanity checks
    if (primaryToken === undefined) return;

    console.log("6");
    if (typeof primaryToken !== "string") return;

    console.log("7");
    if (primaryToken.trim().length === 0) return;

    console.log("8");
    // beneficiaryID sanity checks
    if (beneficiaryID === undefined) return;

    console.log("9");
    if (typeof beneficiaryID !== "string") return;

    console.log("10");
    // id must be a UUID
    // if (!JW_ID_PATTERN.test(beneficiaryID)) return;

    console.log(showGenPrimaryToken);
    setShowGenSecondaryToken(true);
  }, [userType, serviceProviderID, primaryToken, beneficiaryID]);

  // visibility of view address using primary token btn
  useEffect(() => {
    if (showViewAddressPrimaryToken !== false) setShowViewAddressPrimaryToken(false);

    // individualID cannot be current user
    if (userType !== UserType.Other) return;

    // addressID sanity checks
    if (addressID === undefined) return;

    if (typeof addressID !== "string") return;

    // id must be a UUID
    // if (!JW_ID_PATTERN.test(addressID)) return;

    // serviceProviderID sanity checks
    if (serviceProviderID === undefined) return;

    if (typeof serviceProviderID !== "string") return;

    // id must be a UUID
    // if (!JW_ID_PATTERN.test(serviceProviderID)) return;

    // primaryToken sanity checks
    if (primaryToken === undefined) return;

    if (typeof primaryToken !== "string") return;

    if (primaryToken.trim().length === 0) return;

    setShowViewAddressPrimaryToken(true);
  }, [userType, addressID, serviceProviderID, primaryToken]);

  // visibility of view address using secondary token btn
  useEffect(() => {
    if (showViewAddressSecondaryToken !== false) setShowViewAddressSecondaryToken(false);

    // individualID cannot be current user
    if (userType !== UserType.Other) return;

    // addressID sanity checks
    if (addressID === undefined) return;

    if (typeof addressID !== "string") return;

    // id must be a UUID
    // if (!JW_ID_PATTERN.test(addressID)) return;

    // beneficiaryID sanity checks
    if (beneficiaryID === undefined) return;

    if (typeof beneficiaryID !== "string") return;

    // id must be a UUID
    // if (!JW_ID_PATTERN.test(beneficiaryID)) return;

    // secondaryToken sanity checks
    if (secondaryToken === undefined) return;

    if (typeof secondaryToken !== "string") return;

    if (secondaryToken.trim().length === 0) return;

    setShowViewAddressSecondaryToken(true);
  }, [userType, addressID, beneficiaryID, secondaryToken]);

  return (
    <>
      <div className="@container/address-content grid min-w-60 grid-cols-1 items-center justify-start gap-3">
        <div className="@container/address-header flex justify-start bg-gray-800 p-2">
          {hostport !== undefined && hostport.trim().length > 0 ? (
            <img src={hostport + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
          ) : (
            <p className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8">JW</p>
          )}

          <div className="flex-col justify-around self-center">
            {userInfo.userID.trim().length !== 0 ? (
              <>
                <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Sharing address safely</p>
                <p className="ml-4 text-sm font-light text-gray-200">{userInfo.userID}</p>
              </>
            ) : (
              <>
                <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Sharing address safely</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-2">
          <Label htmlFor="address-type">Type</Label>
          <Input id="address-type" placeholder="No value here" />
        </div>

        <div>
          <Label htmlFor="address-name">Name</Label>
          <Input id="address-name" value={address?.Name} />
        </div>

        <div>
          <Label htmlFor="address-street1">Street</Label>
          <Input id="address-street1" value={address?.Street1} />
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <Label htmlFor="address-city">City</Label>
            <Input id="address-city" value={address?.City} />
          </div>
          <div>
            <Label htmlFor="address-state">State</Label>
            <Input id="address-state" value={address?.State} />
          </div>
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <Label htmlFor="address-zipcode">Post Code</Label>
            <Input id="address-zipcode" value={address?.PostCode} />
          </div>
          <div>
            <Label htmlFor="address-country">Country</Label>
            <Input id="address-country" value={address?.Country} />
          </div>
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <Label htmlFor="address-phone">Phone</Label>
            <Input type="tel" id="address-phone" value={address?.Phone} />
          </div>
          <div>
            <Label htmlFor="address-email">Email</Label>
            <Input type="email" id="address-email" value={address?.Email} />
          </div>
        </div>

        <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
          {userType === UserType.Self ? (
            <>
              {showListAddresses ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                  onClick={onListAddress}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M3 4.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.25 3a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 7.25a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 11.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM4 12.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                  </svg>
                  <p className="mx-1 inline">List</p>
                </button>
              ) : (
                <></>
              )}

              {showGenPrimaryToken ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                  onClick={onGeneratePrimaryToken}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                  </svg>
                  <p className="mx-1 inline">Share Service</p>
                </button>
              ) : (
                <></>
              )}

              {showGenSecondaryToken ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                  onClick={onGenerateSecondaryToken}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                  </svg>
                  <p className="mx-1 inline">Share Beneficiary</p>
                </button>
              ) : (
                <></>
              )}
            </>
          ) : userType === UserType.Other ? (
            <>
              {showViewAddressPrimaryToken || showViewAddressSecondaryToken ? (
                <p className="mr-1 self-center text-sm font-bold uppercase text-gray-900">View Address</p>
              ) : (
                <div></div>
              )}

              {showViewAddressPrimaryToken ? (
                <button
                  type="button"
                  className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                  onClick={onViewAddressWithPrimaryToken}
                >
                  Service
                </button>
              ) : (
                <></>
              )}

              {showViewAddressSecondaryToken ? (
                <button
                  type="button"
                  className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                  onClick={onViewAddressWithSecondaryToken}
                >
                  Beneficiary
                </button>
              ) : (
                <></>
              )}
            </>
          ) : (
            <>
              {/* <button
                type="button"
                className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                onClick={onLogin}
              >
                Login
              </button> */}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default JWAddressForm;
