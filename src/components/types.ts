import { JWError, JWErrorAuthenticationRequired, JWErrorBadRequest, JWErrorForbidden } from "../sdk";

type ErrorType = JWErrorBadRequest | JWErrorAuthenticationRequired | JWErrorForbidden | JWError;
export type OnErrorFcn = (err: ErrorType) => void;
