
export interface PrimaryTokenRequest {
    individualID: IndividualID;
    addressID: AddressID;
    serviceProviderID: ServiceProviderID;
}

export interface PrimaryTokenResponse {
    request: PrimaryTokenRequest;
    token: PrimaryToken;
}

export interface SecondaryTokenRequest {
    individualID: IndividualID;
    addressID: AddressID;
    serviceProviderID: ServiceProviderID;
    beneficiaryID: BeneficiaryID;
    primaryToken: PrimaryToken;
}

export interface SecondaryTokenResponse {
    request: SecondaryTokenRequest;
    token: SecondaryToken;
}

type IndividualID = string
type AddressID = string
type ServiceProviderID = string
type BeneficiaryID = string
type PrimaryToken = string
type SecondaryToken = string

export interface Tag {
    Name: string;
    Value?: null | string | number | boolean | object;
}

export interface Tags {
    [Key: string]: Tag;
}

export interface Address {
    ID: AddressID;
    IndividualID: IndividualID;
    Label?: string;
    Addressee?: string;
    Street1?: string;
    Street2?: string;
    Street3?: string;
    City?: string;
    State?: string;
    ZipCode?: string;
    Country?: string;
    Phone?: string;
    Email?: string;
    Tags?: Tags;
}

export type { IndividualID, AddressID, ServiceProviderID, BeneficiaryID, PrimaryToken, SecondaryToken }