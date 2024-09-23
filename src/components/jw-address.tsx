import React, { useEffect, useState } from "react";
import {
  AddressID,
  BeneficiaryID,
  CurrentUserInfoRequest,
  GetCurrentUserInfo,
  IndividualID,
  JWError,
  JWErrorAuthenticationRequired,
  PrimaryToken,
  SecondaryToken,
  ServiceProviderID,
} from "../util";
import JWAddressFormServiceProviderCustomer from "./jw-address-form-sp-customer";
import JWLogin, { OnLoginComplete } from "./jw-login";
import {
  EmbedMode,
  OnAuthenticationRequired,
  OnContentSharedWithBeneficiary,
  OnContentSharedWithServiceProvider,
  OnContentUnsharedWithBeneficiary,
  OnContentUnsharedWithServiceProvider,
  OnErrorFcn,
  UserInfo,
} from "./types";

export interface JWAddressProps {
  embedAs: EmbedMode;
  hostPort: string;

  individualID?: IndividualID;
  addressID?: AddressID;

  serviceProviderID?: ServiceProviderID;
  primaryToken?: PrimaryToken;

  beneficiaryIDs?: BeneficiaryID[];
  secondaryToken?: SecondaryToken;

  onAuthenticationRequired?: OnAuthenticationRequired;
  onError?: OnErrorFcn;

  onContentSharedWithServiceProvider?: OnContentSharedWithServiceProvider;
  onContentUnsharedWithServiceProvider?: OnContentUnsharedWithServiceProvider;

  onContentSharedWithBeneficiary?: OnContentSharedWithBeneficiary;
  onContentUnsharedWithBeneficiary?: OnContentUnsharedWithBeneficiary;
}

const JWAddress: React.FC<JWAddressProps> = ({
  embedAs,
  hostPort,
  individualID,
  addressID,
  serviceProviderID,
  primaryToken,
  beneficiaryIDs,
  secondaryToken,
  onAuthenticationRequired,
  onError,
  onContentSharedWithServiceProvider,
  onContentUnsharedWithServiceProvider,
  onContentSharedWithBeneficiary,
  onContentUnsharedWithBeneficiary,
}) => {
  const emptyUserInfo: UserInfo = {
    userID: "",
    individualID: "",
  };

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>(emptyUserInfo);

  const onLoginComplete: OnLoginComplete = (userID: string, individualID: IndividualID) => {
    const userInfo: UserInfo = {
      userID: userID,
      individualID: individualID,
    };

    setCurrentUserInfo(userInfo);
    setIsLoggedIn(true);
  };

  const onErrorInternal: OnErrorFcn = (err: JWError) => {
    if (err instanceof JWErrorAuthenticationRequired) {
      const ui: UserInfo = {
        userID: "",
        individualID: "",
      };
      setCurrentUserInfo(ui);
      return setIsLoggedIn(false);
    }
    if (onError !== undefined) {
      return onError(err);
    }
  };

  useEffect(() => {
    const fnEffect = async () => {
      if (hostPort !== undefined && hostPort.trim().length > 0) {
        try {
          setIsLoggedIn(false);
          const request: CurrentUserInfoRequest = { hostPort: hostPort };
          const response = await GetCurrentUserInfo(request);
          if (response.individualID === undefined) return;
          onLoginComplete(response.userID, response.individualID);
        } catch (e) {
          console.error("JWAddress: ", e);
        }
      }
    };
    fnEffect();
  }, [hostPort]);

  return (
    <>
      {isLoggedIn ? (
        <JWAddressFormServiceProviderCustomer
          hostPort={hostPort}
          authToken={""}
          // individualID={individualID || ""}
          addressID={addressID}
          serviceProviderID={serviceProviderID}
          primaryToken={primaryToken}
          beneficiaryIDs={beneficiaryIDs}
          // secondaryToken={secondaryToken}
          onError={onErrorInternal}
          onContentSharedWithServiceProvider={onContentSharedWithServiceProvider}
          onContentUnsharedWithServiceProvider={onContentUnsharedWithServiceProvider}
          onContentSharedWithBeneficiary={onContentSharedWithBeneficiary}
          onContentUnsharedWithBeneficiary={onContentUnsharedWithBeneficiary}
        />
      ) : (
        <JWLogin hostPort={hostPort} onLoginComplete={onLoginComplete} onError={onError} />
      )}
    </>
  );
};

export default JWAddress;
