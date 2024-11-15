import { AddressID, BeneficiaryID, IndividualID, JWError, PrimaryToken, SecondaryToken, SecureContentID, ServiceProviderID, UserID } from "../util";

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

export interface UserInfo {
  readonly userID: UserID;
  readonly individualID: IndividualID;
  readonly serviceProviderID: ServiceProviderID;
  readonly token: OwnerToken;
}

export type OnContentSharedWithServiceProvider = (
  contentType: string,
  individualID: IndividualID,
  contentID: AddressID | SecureContentID,
  serviceProviderID: ServiceProviderID,
  primaryToken: PrimaryToken,
) => void;

export type OnContentUnsharedWithServiceProvider = (
  contentType: string,
  individualID: IndividualID,
  contentID: AddressID | SecureContentID,
  serviceProviderID: ServiceProviderID,
) => void;

export type OnContentSharedWithBeneficiary = (
  contentType: string,
  individualID: IndividualID,
  contentID: AddressID | SecureContentID,
  serviceProviderID: ServiceProviderID,
  primaryToken: PrimaryToken,
  beneficiaryID: BeneficiaryID,
  secondaryToken: SecondaryToken,
) => void;

export type OnContentUnsharedWithBeneficiary = (
  contentType: string,
  individualID: IndividualID,
  contentID: AddressID | SecureContentID,
  serviceProviderID: ServiceProviderID,
  beneficiaryID: BeneficiaryID,
) => void;
