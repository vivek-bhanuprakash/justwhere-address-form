import React, { useEffect, useState } from "react";

import {
  Address,
  AddressID,
  CurrentUserInfoRequest,
  GetAddressUsingPrimaryToken,
  GetCurrentUserInfo,
  IndividualID,
  IsValidURL,
  JWError,
  PrimaryToken,
  PrimaryTokenAddressRequest,
  ServiceProviderID,
} from "../util";
import AddressForm from "./internal/address";
import { OnErrorFcn, UserInfo } from "./types";

export interface AddressProps {
  hostPort: string;
  authToken: string;
  individualID: IndividualID;
  addressID?: AddressID;
  serviceProviderID?: ServiceProviderID;
  primaryToken?: PrimaryToken;
  onError?: OnErrorFcn;
}

const JWAddressFormServiceProviderEmployee: React.FC<AddressProps> = ({
  hostPort,
  authToken,
  individualID,
  addressID,
  serviceProviderID,
  primaryToken,
  onError,
}) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "", serviceProviderID: "", token: "" });
  const [address, setAddress] = useState<Address>();

  const maskFields = (address: Address): Address => {
    address.IndividualID = valueOrHidden(address?.IndividualID);
    address.ID = valueOrHidden(address?.ID);
    address.Label = valueOrHidden(address?.Label);
    address.Name = valueOrHidden(address?.Name);
    address.Street1 = valueOrHidden(address?.Street1);
    address.Street2 = valueOrHidden(address?.Street2);
    address.Street3 = valueOrHidden(address?.Street3);
    address.City = valueOrHidden(address?.City);
    address.State = valueOrHidden(address?.State);
    address.PostCode = valueOrHidden(address?.PostCode);
    address.Country = valueOrHidden(address?.Country);
    address.Phone = valueOrHidden(address?.Phone);
    address.Email = valueOrHidden(address?.Email);

    for (const key in address.Tags) {
      const tag = address.Tags[key];
      if (tag === undefined) address.Tags[key] = "hidden";
      if (tag === null) address.Tags[key] = "hidden";
      if (tag === "") address.Tags[key] = "hidden";
    }

    return address;
  };

  const valueOrHidden = (field: string | undefined): string => {
    if (field === undefined || field.trim().length === 0) return "hidden";
    return field;
  };

  const EMPTY_ADDRESS: Address = {
    ID: "",
    IndividualID: "",
    Label: "",
    Name: "",
    Street1: "",
    Street2: "",
    Street3: "",
    City: "",
    State: "",
    PostCode: "",
    Country: "",
    Phone: "",
    Email: "",
    Tags: {},
  };

  const raiseError = (err: JWError) => {
    if (onError === undefined || typeof onError !== "function") {
      console.warn("JustWhere: onError function is not provided or not a function");
      return;
    }
    try {
      onError(err);
    } catch (e) {
      console.error("JustWhere: error in onError callback: ", e);
    }
  };

  /* load current user info */
  useEffect(() => {
    setAddress(EMPTY_ADDRESS);

    if (hostPort === undefined || typeof hostPort !== "string" || hostPort.trim().length === 0) {
      console.error("JustWhere: no hostPort provided or hostPort is not a string");
      raiseError(new JWError("no hostPort or hostPort is not a string or is empty"));
      return;
    }

    if (!IsValidURL(hostPort)) {
      console.error("JustWhere: hostPort is not a valid URL");
      raiseError(new JWError("hostPort is not a valid URL"));
      return;
    }

    const req: CurrentUserInfoRequest = { hostPort: hostPort, authToken: authToken };
    GetCurrentUserInfo(req)
      .then((response) => {
        setCurrentUserInfo({
          userID: response.userID.trim(),
          individualID: response.individualID.trim(),
          serviceProviderID: response.serviceProviderID.trim(),
          token: response.token.trim(),
        });
      })
      .catch((error) => {
        console.error("JustWhere: error fetching current user info: ", error);
        raiseError(error as JWError);
      });
  }, [hostPort, authToken]);

  /* retrieve service provider details */
  useEffect(() => {
    setAddress(EMPTY_ADDRESS); // reset address

    if (currentUserInfo.individualID.trim().length === 0) return;
    if (individualID === undefined || typeof individualID !== "string" || individualID.trim().length === 0) return;
    if (addressID === undefined || typeof addressID !== "string" || addressID.trim().length === 0) return;
    if (serviceProviderID === undefined || typeof serviceProviderID !== "string" || serviceProviderID.trim().length === 0) return;
    if (primaryToken === undefined || typeof primaryToken !== "string" || primaryToken.trim().length === 0) return;

    const req: PrimaryTokenAddressRequest = {
      hostPort: hostPort,
      authToken: authToken,
      addressID: addressID?.trim() || "",
      serviceProviderID: serviceProviderID?.trim() || "",
      token: primaryToken?.trim() || "",
    };
    GetAddressUsingPrimaryToken(req)
      .then((response) => {
        setAddress(maskFields(response.address));
      })
      .catch((error) => {
        raiseError(error as JWError);
      });
  }, [currentUserInfo, individualID, addressID, serviceProviderID, primaryToken]);

  return (
    <div className="@container/address-content grid min-w-60 grid-cols-1 items-center justify-start gap-3">
      <div className="@container/address-header flex justify-start bg-gray-800 p-2">
        {hostPort !== undefined && hostPort.trim().length > 0 ? (
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
        ) : (
          <p className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8">JW</p>
        )}

        <div className="flex-col justify-around self-center">
          {currentUserInfo.userID.trim().length !== 0 ? (
            <>
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Securely Share, Track and Notify</p>
              <p className="ml-4 text-sm font-light text-gray-200">{currentUserInfo.userID}</p>
            </>
          ) : (
            <>
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Securely Share, Track and Notify</p>
            </>
          )}
        </div>
      </div>

      <AddressForm address={address || ({} as Address)} />
    </div>
  );
};

export default JWAddressFormServiceProviderEmployee;
