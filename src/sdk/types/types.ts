export type IndividualID = string;
export type AddressID = string;
export type ServiceProviderID = string;
export type BeneficiaryID = string;
export type PrimaryToken = string;
export type SecondaryToken = string;

// Regular expression to check if string pattern is a UUID
// Source: https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
export const ID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

export type TagValue = null | string | number | boolean | object;

export interface Address {
  ID: AddressID;
  IndividualID: IndividualID;
  Type?: string;
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

export const IsUuid = (id: string): boolean => {
  return ID_PATTERN.test(id);
};
