import { JWError, JWErrorAuthenticationRequired, JWErrorBadRequest, JWErrorForbidden } from "../util";

type ErrorType = JWErrorBadRequest | JWErrorAuthenticationRequired | JWErrorForbidden | JWError;
export type OnErrorFcn = (err: ErrorType) => void;
