import React, { useEffect, useState } from "react";
import { Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "./../apis/individuals";
import JWAddressForm from "./jw-address-form";
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const onLoginComplete: OnLoginComplete = (userID: string, individualID: ID) => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    setIsLoggedIn(true);

    const fnEffect = async () => {
      const config: APIIndividualsConfig = new APIIndividualsConfig({
        basePath: `${hostPort}/api`,
        baseOptions: {
          withCredentials: true,
        },
      });

      const api = new APIIndividuals(config);
      try {
        const response = await api.getCurrentUserInfo();
        const userInfo = response.data || null;
        if (userInfo === null) return;
        if (userInfo.IndividualID === undefined) return;
        if (typeof userInfo.IndividualID !== "string") return;
        if (!JW_ID_PATTERN.test(userInfo.IndividualID)) return;
        setIsLoggedIn(true);
      } catch (e) {}
    };
    fnEffect();
  }, [hostPort]);

  return (
    <>
      {isLoggedIn ? (
        <JWAddressForm
          hostPort={hostPort}
          individualID={individualID || ""}
          addressID={addressID}
          serviceProviderID={serviceProviderID}
          primaryToken={primaryToken}
          beneficiaryID={beneficiaryID}
          secondaryToken={secondaryToken}
          onError={onError}
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
