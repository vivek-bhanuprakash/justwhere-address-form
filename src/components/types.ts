import { AddressID, BeneficiaryID, IndividualID, JWError, PrimaryToken, SecondaryToken, ServiceProviderID } from "../util";

export type OnErrorFcn = (err: JWError) => void;
export type OnNewPrimaryToken = (individualID: IndividualID, addressID: AddressID, serviceProviderID: ServiceProviderID, token: PrimaryToken) => void;
export type OnNewSecondaryToken = (
  individualID: IndividualID,
  addressID: AddressID,
  serviceProviderID: ServiceProviderID,
  primaryToken: PrimaryToken,
  beneficiaryID: BeneficiaryID,
  secondaryToken: SecondaryToken,
) => void;
export type OnAuthenticationRequired = (url: string) => void;

export enum EmbedMode {
  SERVICE_PROVIDER,
  BENEFICIARY,
}
