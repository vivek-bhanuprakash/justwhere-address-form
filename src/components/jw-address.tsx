import React, { useEffect, useState } from "react";
import { Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "./../apis/individuals";
import JWAddressForm, { JWErrorAuthenticationRequired, UserInfo } from "./jw-address-form";
import JWLogin, { OnLoginComplete } from "./jw-login";

// Regular expression to check if string is a valid UUID
// Source: https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
export const JW_ID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export enum EmbedMode {
  SERVICE_PROVIDER,
  BENEFICIARY,
}

export type ID = string;
export type PrimaryToken = string;
export type SecondaryToken = string;

export class JWError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWError";
  }
}

export class JWAuthenticationRequired extends JWError {
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

export type OnErrorFcn = (err: JWError) => void;
export type OnNewPrimaryToken = (individualID: ID, addressID: ID, serviceProviderID: ID, token: PrimaryToken) => void;
export type OnNewSecondaryToken = (serviceProviderID: ID, beneficiaryID: ID, token: SecondaryToken) => void;
export type OnAuthenticationRequired = (url: string) => void;

export interface JWAddressProps {
  embedAs: EmbedMode;
  hostPort: string;

  individualID?: ID;
  addressID?: ID;

  serviceProviderID?: ID;
  primaryToken?: PrimaryToken;

  beneficiaryID?: ID;
  secondaryToken?: SecondaryToken;

  onAuthenticationRequired?: OnAuthenticationRequired;
  onError?: OnErrorFcn;
  onNewPrimaryToken?: OnNewPrimaryToken;
  onNewSecondaryToken?: OnNewSecondaryToken;
}

const JWAddress: React.FC<JWAddressProps> = ({
  embedAs,
  hostPort,
  individualID,
  addressID,
  serviceProviderID,
  primaryToken,
  beneficiaryID,
  secondaryToken,
  onAuthenticationRequired,
  onError,
  onNewPrimaryToken,
  onNewSecondaryToken,
}) => {
  const emptyUserInfo: UserInfo = {
    userID: "",
    individualID: "",
  };

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>(emptyUserInfo);

  const onLoginComplete: OnLoginComplete = (userID: string, individualID: ID) => {
    const userInfo: UserInfo = {
      userID: userID,
      individualID: individualID,
    };

    console.info("JWAddress: current user info:", userInfo);

    setCurrentUserInfo(userInfo);
    setIsLoggedIn(true);
  };

  const onErrorInternal: OnErrorFcn = (err: JWError) => {
    console.error("JWAddress: onErrorInternal: ", err);
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
        const config: APIIndividualsConfig = new APIIndividualsConfig({
          basePath: `${hostPort}/api`,
          baseOptions: {
            withCredentials: true,
          },
        });

        const api = new APIIndividuals(config);
        try {
          setIsLoggedIn(false);
          const response = await api.getCurrentUserInfo();
          const userInfo = response.data || null;
          if (userInfo === null) return;
          if (userInfo.IndividualID === undefined) return;
          if (typeof userInfo.IndividualID !== "string") return;
          if (userInfo.IndividualID.trim().length === 0) return;
          // if (!JW_ID_PATTERN.test(userInfo.IndividualID)) return;
          onLoginComplete(userInfo.UserID || "", userInfo.IndividualID);
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
        <JWAddressForm
          hostPort={hostPort}
          userInfo={currentUserInfo}
          individualID={individualID || ""}
          addressID={addressID}
          serviceProviderID={serviceProviderID}
          primaryToken={primaryToken}
          beneficiaryID={beneficiaryID}
          secondaryToken={secondaryToken}
          onError={onErrorInternal}
          onNewPrimaryToken={onNewPrimaryToken}
          onNewSecondaryToken={onNewSecondaryToken}
        />
      ) : (
        <JWLogin hostPort={hostPort} onLoginComplete={onLoginComplete} onError={onError} />
      )}
    </>
  );
};

export default JWAddress;
