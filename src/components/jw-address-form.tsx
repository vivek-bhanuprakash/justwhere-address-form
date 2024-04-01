import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { AddressInput, Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "./../apis/individuals";
import { Configuration as APITokensConfig, DefaultApi as APITokens, PrimaryTokenInput, SecondaryTokenInput } from "./../apis/tokens";
import { OnErrorFcn, OnNewPrimaryToken, OnNewSecondaryToken } from "./jw-address";

const genereratePrimaryToken = async (hostport: string, individualID: string, addressID: string, serviceProviderID: string): Promise<string> => {
  const input: PrimaryTokenInput = {
    individualID: individualID,
    addressID: addressID,
    serviceProviderID: serviceProviderID,
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
};

const genererateSecondaryToken = async (hostport: string, serviceProviderID: string, beneficiaryID: string, primaryToken: string): Promise<string> => {
  const input: SecondaryTokenInput = {
    serviceProviderID: serviceProviderID,
    beneficiaryID: beneficiaryID,
    token: primaryToken,
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
};

const getAddressUsingProviderToken = async (hostport: string, addressID: string, providerID: string, token: string): Promise<AddressInput> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getAddressByID(addressID, token, providerID);
  const address = response.data || null;
  return address;
};

const getSelfAddress = async (hostport: string, addressID: string, individualID: string): Promise<AddressInput> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getAddressByID(addressID, "", "", individualID);
  const address = response.data || null;
  return address;
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

const getUserType = async (hostport: string, individualID: string): Promise<UserType> => {
  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostport}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const response = await api.getCurrentUserInfo();
  const userInfo = response.data || null;
  if (userInfo !== null) {
    if (userInfo.IndividualID === undefined || userInfo.IndividualID.trim().length === 0) return UserType.Unknown;

    if (userInfo.IndividualID === individualID) {
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

export class JWError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWError";
  }
}

export class JWErrorAuthenticationRequired extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorAuthenticationRequired";
  }
}

export class JWErrorForbidden extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorForbidden";
  }
}

export class JWErrorBadRequest extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorBadRequest";
  }
}

type ErrorType = JWErrorAuthenticationRequired | JWErrorForbidden | JWErrorBadRequest | JWError;

export interface AddressProps {
  hostPort: string;
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
  const [address, setAddress] = useState<AddressInput>();
  const [userType, setUserType] = useState<UserType>(UserType.Unknown);
  const [addressValidity, setAddressValidity] = useState<AddressValidity>(AddressValidity.Unknown);

  const [showViewAddress, setShowViewAddress] = useState<boolean>(false);
  const [showEditAddress, setShowEditAddress] = useState<boolean>(false);
  const [showListAddresses, setShowListAddresses] = useState<boolean>(false);
  const [showGenPrimaryToken, setShowGenPrimaryToken] = useState<boolean>(false);
  const [showGenSecondaryToken, setShowGenSecondaryToken] = useState<boolean>(false);
  const [showViewAddressPrimaryToken, setShowViewAddressPrimaryToken] = useState<boolean>(false);
  const [showViewAddressSecondaryToken, setShowViewAddressSecondaryToken] = useState<boolean>(false);

  const WATCHDOG_MAX_RETRIES = 29;
  const WATCHDOG_INTERVAL = 2000; // 2 seconds

  let watchDogTimerID: number;
  let watchDogRetries: number = 0;

  const loginWatchDog = async () => {
    console.log("loginWatchDog #", watchDogRetries + 1);
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    const userType: UserType = await getUserType(hostport, individualID);
    setUserType(userType);
    if (userType === UserType.Unknown) {
      watchDogRetries++;
      if (watchDogRetries < WATCHDOG_MAX_RETRIES) {
        watchDogTimerID = window.setTimeout(async () => {
          await loginWatchDog();
        }, WATCHDOG_INTERVAL);
      }
    } else {
      watchDogRetries = 0;
    }
  };

  const onLogin = async () => {
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    const userType = await getUserType(hostport, individualID);
    setUserType(userType);
    if (userType === UserType.Unknown) {
      window.open(`${hostport}/api/login`, "_blank");
      watchDogRetries = 0;
      watchDogTimerID = window.setTimeout(loginWatchDog, WATCHDOG_INTERVAL);
    }
  };

  const onViewAddressWithSecondaryToken = async () => {
    try {
      const address = await getAddressUsingProviderToken(hostport, addressID || "", beneficiaryID || "", secondaryToken || "");
      setAddress(address);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JustWhere: onError function is undefined or not a function");
          return;
        }

        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          onError(new JWErrorForbidden("Forbidden"));
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          onError(new JWErrorBadRequest("Bad request"));
        }
      }
    }
  };

  const onViewAddressWithPrimaryToken = async () => {
    try {
      const address = await getAddressUsingProviderToken(hostport, addressID || "", serviceProviderID || "", primaryToken || "");

      address.addressee = address.addressee === undefined ? "Hidden" : address.addressee.trim().length === 0 ? "Hidden" : address.addressee;
      address.street = address.street === undefined ? "Hidden" : address.street.trim().length === 0 ? "Hidden" : address.street;
      address.city = address.city === undefined ? "Hidden" : address.city.trim().length === 0 ? "Hidden" : address.city;
      address.state = address.state === undefined ? "Hidden" : address.state.trim().length === 0 ? "Hidden" : address.state;
      address.zipCode = address.zipCode === undefined ? "Hidden" : address.zipCode.trim().length === 0 ? "Hidden" : address.zipCode;
      address.country = address.country === undefined ? "Hidden" : address.country.trim().length === 0 ? "Hidden" : address.country;
      address.email = address.email === undefined ? "Hidden" : address.email.trim().length === 0 ? "Hidden" : address.email;
      address.phone = address.phone === undefined ? "Hidden" : address.phone.trim().length === 0 ? "Hidden" : address.phone;

      setAddress(address);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JustWhere: onError function is undefined or not a function");
          return;
        }

        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          onError(new JWErrorForbidden("Forbidden"));
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          onError(new JWErrorBadRequest("Bad request"));
        }
      }
    }
  };

  const onGenerateSecondaryToken = async () => {
    try {
      if (onNewSecondaryToken === undefined || typeof onNewSecondaryToken !== "function") {
        console.warn("JustWhere: onNewSecondaryToken function is undefined or not a function. no token will be generated.");
        return;
      }

      const token = await genererateSecondaryToken(hostport, serviceProviderID || "", beneficiaryID || "", primaryToken || "");
      setSecondaryTokenResponse(onNewSecondaryToken, serviceProviderID || "", beneficiaryID || "", token);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JustWhere: onError function is undefined or not a function");
          return;
        }

        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          onError(new JWErrorForbidden("Forbidden"));
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          onError(new JWErrorBadRequest("Bad request"));
        }
      }
    }
  };

  const onGeneratePrimaryToken = async () => {
    try {
      if (onNewPrimaryToken === undefined || typeof onNewPrimaryToken !== "function") {
        console.warn("JustWhere: onNewPrimaryToken function is undefined or not a function. no token will be generated.");
        return;
      }

      const token = await genereratePrimaryToken(hostport, individualID, addressID || "", serviceProviderID || "");
      setPrimaryTokenResponse(onNewPrimaryToken, individualID, addressID || "", serviceProviderID || "", token);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JustWhere: onError function is undefined or not a function");
          return;
        }

        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          onError(new JWErrorForbidden("Forbidden"));
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          onError(new JWErrorBadRequest("Bad request"));
        }
      }
    }
  };

  const clearAddress = () => {
    const empty: AddressInput = {
      id: "",
      individualId: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      addressee: "",
      phone: "",
      email: "",
    };
    setAddress(empty);
  };

  const onViewSelfAddress = async () => {
    try {
      clearAddress();
      const address = await getSelfAddress(hostport, addressID || "", individualID);
      setAddress(address);
    } catch (e) {
      if (e instanceof AxiosError) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JustWhere: onError function is undefined or not a function");
          return;
        }

        // if error is 401, then throw a JWErrorAuthenticationRequired
        if (e.response && e.response.status === 401) {
          onError(new JWErrorAuthenticationRequired("Authentication required"));
        }
        // if error is 403, then throw a JWErrorForbidden
        if (e.response && e.response.status === 403) {
          onError(new JWErrorForbidden("Forbidden"));
        }
        // if error is 400, then throw a JWErrorBadRequest
        if (e.response && e.response.status === 400) {
          onError(new JWErrorBadRequest("Bad request"));
        }
      }
    }
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
        const userType: UserType = await getUserType(hostport, individualID);
        setUserType(userType);
      } catch (e) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JWAddress: no onError handler provided, or onError is not a function");
          console.error(e);
          return;
        }

        if (!(e instanceof AxiosError)) return onError(new JWError((e as Error).message));

        if (!e.response) return onError(new JWError((e as Error).message));

        if (e.response.status === 401) return onError(new JWErrorAuthenticationRequired("authentication required"));

        if (e.response.status === 403) return onError(new JWErrorForbidden("forbidden"));

        if (e.response.status === 400) return onError(new JWErrorBadRequest("Bad request"));

        onError(new JWError((e as AxiosError).message));
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
        const address = await getSelfAddress(hostport, addressID, individualID);
        setAddressValidity(AddressValidity.Self);
        await onViewSelfAddress();
      } catch (e) {
        if (onError === undefined || typeof onError !== "function") {
          console.warn("JWAddress: no onError handler provided, or onError is not a function");
          console.error(e);
          return;
        }

        if (!(e instanceof AxiosError)) return onError(new JWError((e as Error).message));

        if (!e.response) return onError(new JWError((e as Error).message));

        if (e.response.status === 401) return onError(new JWErrorAuthenticationRequired("authentication required"));

        if (e.response.status === 403) {
          setAddressValidity(AddressValidity.Other);
          return;
        }

        if (e.response.status === 400) {
          setAddressValidity(AddressValidity.Other);
          return;
        }

        onError(new JWError((e as AxiosError).message));
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
    // setShowListAddresses(userType === UserType.Self);
    setShowListAddresses(false);
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
        <div>
          <label htmlFor="address-type" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Type
          </label>
          <input
            type="text"
            id="address-type"
            className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            placeholder="No value here"
          />
        </div>

        <div>
          <label htmlFor="address-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Name
          </label>
          <input
            type="text"
            id="address-name"
            className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            value={address?.addressee}
          />
        </div>

        <div>
          <label htmlFor="address-street1" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
            Street
          </label>
          <input
            type="text"
            id="address-street1"
            className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            value={address?.street}
          />
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <label htmlFor="address-city" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              City
            </label>
            <input
              type="text"
              id="address-city"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.city}
            />
          </div>
          <div>
            <label htmlFor="address-state" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              State
            </label>
            <input
              type="text"
              id="address-state"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.state}
            />
          </div>
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <label htmlFor="address-zipcode" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              Post Code
            </label>
            <input
              type="text"
              id="address-zipcode"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.zipCode}
            />
          </div>
          <div>
            <label htmlFor="address-country" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              Country
            </label>
            <input
              type="text"
              id="address-country"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.country}
            />
          </div>
        </div>

        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          <div>
            <label htmlFor="address-phone" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              Phone
            </label>
            <input
              type="tel"
              id="address-phone"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.phone}
            />
          </div>
          <div>
            <label htmlFor="address-email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900">
              Email
            </label>
            <input
              type="email"
              id="address-email"
              className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              value={address?.email}
            />
          </div>
        </div>

        <div className="flex-cols flex gap-3">
          {userType == UserType.Self ? (
            <>
              {showGenPrimaryToken || showGenSecondaryToken ? <p className="mr-1 self-center text-sm font-bold uppercase text-gray-900">Get Handle</p> : <></>}

              {showGenPrimaryToken ? (
                <button
                  type="button"
                  className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                  onClick={onGeneratePrimaryToken}
                >
                  Service
                </button>
              ) : (
                <></>
              )}

              {showGenSecondaryToken ? (
                <button
                  type="button"
                  className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                  onClick={onGenerateSecondaryToken}
                >
                  Beneficiary
                </button>
              ) : (
                <></>
              )}
            </>
          ) : userType == UserType.Other ? (
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
              <button
                type="button"
                className="border border-gray-200 bg-gray-700 px-4 py-2 text-sm font-normal uppercase text-white hover:bg-gray-100 hover:text-gray-700 focus:z-10 focus:bg-gray-100 focus:text-gray-700 focus:ring-2 focus:ring-gray-700"
                onClick={onLogin}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default JWAddressForm;
