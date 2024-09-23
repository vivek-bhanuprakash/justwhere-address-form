import React, { useEffect, useState } from "react";

import {
  Address,
  AddressID,
  BeneficiaryID,
  CurrentUserInfoRequest,
  GetAddressUsingSecondaryToken,
  GetCurrentUserInfo,
  IndividualID,
  IsValidURL,
  JWError,
  SecondaryToken,
  SecondaryTokenAddressRequest,
} from "../util";
import AddressForm from "./internal/address";
import { OnErrorFcn, UserInfo } from "./types";

export interface AddressProps {
  hostPort: string;
  authToken: string;
  individualID: IndividualID;
  addressID?: AddressID;
  beneficiaryID?: BeneficiaryID;
  secondaryToken?: SecondaryToken;
  onError?: OnErrorFcn;
}

const JWAddressFormBeneficiaryEmployee: React.FC<AddressProps> = ({ hostPort, authToken, individualID, addressID, beneficiaryID, secondaryToken, onError }) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "" });
  const [address, setAddress] = useState<Address>();

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
    setAddress({} as Address);

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

    const req: CurrentUserInfoRequest = { hostPort: hostPort };
    GetCurrentUserInfo(req)
      .then((response) => {
        setCurrentUserInfo({ userID: response.userID.trim(), individualID: response.individualID.trim() });
      })
      .catch((error) => {
        console.error("JustWhere: error fetching current user info: ", error);
        raiseError(error as JWError);
      });
  }, [hostPort, authToken]);

  /* retrieve service provider details */
  useEffect(() => {
    setAddress({} as Address);

    if (currentUserInfo.individualID.trim().length === 0) return;
    if (individualID === undefined || typeof individualID !== "string" || individualID.trim().length === 0) return;
    if (addressID === undefined || typeof addressID !== "string" || addressID.trim().length === 0) return;
    if (beneficiaryID === undefined || typeof beneficiaryID !== "string" || beneficiaryID.trim().length === 0) return;
    if (secondaryToken === undefined || typeof secondaryToken !== "string" || secondaryToken.trim().length === 0) return;

    const req: SecondaryTokenAddressRequest = {
      hostPort: hostPort,
      authToken: authToken,
      addressID: addressID?.trim() || "",
      beneficiaryID: beneficiaryID?.trim() || "",
      token: secondaryToken?.trim() || "",
    };
    GetAddressUsingSecondaryToken(req)
      .then((response) => {
        setAddress(response.address);
      })
      .catch((error) => {
        raiseError(error as JWError);
      });
  }, [currentUserInfo, individualID, addressID, beneficiaryID, secondaryToken]);

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

export default JWAddressFormBeneficiaryEmployee;
