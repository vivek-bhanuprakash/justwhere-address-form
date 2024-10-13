export type UserID = string;
export type IndividualID = string;
export type AddressID = string;
export type SecureContentID = string;
export type ServiceProviderID = string;
export type BeneficiaryID = string;
export type PrimaryToken = string;
export type SecondaryToken = string;
export type SecureContentType = string;

// Regular expression to check if string pattern is a UUID
// Source: https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
export const ID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export type TagValue = null | string | number | boolean | object;

export interface Tag {
  Name: string;
  Value: TagValue;
  Private: boolean;
  Editable: boolean;
  Required: boolean;
}

export type Tags = Record<string, Tag>;

export interface Address {
  ID: AddressID;
  IndividualID: IndividualID;
  Label?: string;
  Name?: string;
  Street1?: string;
  Street2?: string;
  Street3?: string;
  City?: string;
  State?: string;
  PostCode?: string;
  Country?: string;
  Phone?: string;
  Email?: string;
  Tags?: Record<string, TagValue>;
}

interface Provider {
  Name: string;
  Contact: string;
  Description: string;
  Category: string;
  Street1: string;
  Street2?: string;
  Street3?: string;
  City: string;
  State: string;
  PostCode: string;
  Country?: string;
  Phone: string;
  Email: string;
  Website?: string;
  Tags?: object;
}

export interface Beneficiary extends Provider {
  ID: BeneficiaryID;
}

export interface ServiceProvider extends Provider {
  ID: ServiceProviderID;
}

/*
export interface EmployeeRecord {
  ID: SecureContentID;
  EmployeeID: string;
  Name: string;
  DateOfBirth: string;
  HireDate: string;
  SSN: string;
  Tags: Record<string, string>;
}

export interface InsuranceRecord {
  ID: SecureContentID;
  Name: string;
  PolicyNumber: string;
  Amount: string;
  EffectiveDate: string;
  ExpiryDate: string;
  Tags: Record<string, string>;
}

export interface NoteRecord {
  ID: SecureContentID;
  Title: string;
  Content: string;
  Tags: Record<string, string>;
}
*/

export interface SecureContent {
  ID: SecureContentID;
  Type: string;
  Content: Record<string, string>;
}

/*
export enum SecureContentType {
  UNKNOWN,
  ADDRESS,
  INSURANCE_RECORD,
  EMPLOYEE_RECORD,
  NOTE,
}
*/

/*
export interface SecureContent {
  ID: SecureContentID;
  Type: string;
  Content: Address | EmployeeRecord | InsuranceRecord | NoteRecord;
}
*/

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

export class JWErrorNotFound extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorNotFound";
  }
}

export class JWErrorBadRequest extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorBadRequest";
  }
}

export class JWErrorServerError extends JWError {
  constructor(message: string) {
    super(message);
    this.name = "JWErrorServerError";
  }
}

export const IsUuid = (id: string): boolean => {
  return ID_PATTERN.test(id);
};

const TOKEN_STORAGE_KEY: string = "JWAUTH";

export interface AuthToken {
  token: string;
}

export const UseAuthToken = (authToken: AuthToken) => {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, authToken.token);
};

export const GetAuthToken = (): AuthToken => {
  let token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
  if (token !== "") {
    token = token.split("Bearer ")[1];
  }
  return { token };
};

export const IsValidURL = (url: string): boolean => {
  let isValid = false;
  try {
    new URL(url);
    isValid = true;
  } catch (_) {
    isValid = false;
  }
  return isValid;
};

export interface SecureContentTemplateField {
  ID: string;
  Label: string;
  Required?: boolean;
  Type: string; // Consider using a more specific type for input types
}

export interface SecureContentTemplate {
  ID: string;
  Name: string;
  Fields: SecureContentTemplateField[];
}
