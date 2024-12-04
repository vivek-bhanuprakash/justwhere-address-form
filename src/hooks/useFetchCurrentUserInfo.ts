import { useCallback, useEffect, useState } from "react";
import { OnErrorFcn } from '../components/types';
import { GetCurrentUserInfo, IsValidURL, JWError, JWErrorAuthenticationRequired } from '../util';

export interface CurrentUser {
  userID: string;
  individualID: string;
  serviceProviderID: string;
  token: string;
}

export const EMPTY_USER: CurrentUser = {
  userID: "",
  individualID: "",
  serviceProviderID: "",
  token: ""
};

export const IsEmptyUser = (user: CurrentUser): boolean => {
  return user.userID === "" && user.individualID === "" && user.serviceProviderID === "" && user.token === "";
};

export interface UseFetchCurrentUserProps {
  hostPort: string;
  authToken: string;
  onError: OnErrorFcn;
  onReset?: () => void;
}

export interface UseFetchCurrentUserReturn {
  currentUser: CurrentUser;
  error: JWError | null;
}

export const useFetchCurrentUserInfo = ({
  hostPort,
  authToken,
  onError,
  onReset,
}: UseFetchCurrentUserProps): UseFetchCurrentUserReturn => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(EMPTY_USER);
  const [error, setError] = useState<JWError | null>(null);

  const validateInputs = (hostPort: string, authToken: string): JWError | null => {
    if (!hostPort?.trim()) {
      return new JWError("missing hostPort");
    }

    if (!IsValidURL(hostPort)) {
      return new JWError("hostPort is not a valid URL");
    }

    if (!authToken?.trim()) {
      return new JWErrorAuthenticationRequired("missing auth token");
    }

    return null;
  };

  // Memoized error handler
  const handleError = useCallback((error: JWError) => {
    setError(error);

    try {
      onReset?.();
    } catch (e) {
      console.error("JustWhere: error in onReset callback", e);
      return;
    }

    if (typeof onError === 'function') {
      try {
        onError(error);
      } catch (e) {
        console.error("JustWhere: error in onError callback", e);
      }
    }
  }, [onError, onReset]);

  // Memoized fetch function
  const fetchUserInfo = useCallback(async () => {
    const validationError = validateInputs(hostPort, authToken);
    if (validationError) {
      return handleError(validationError);
    }

    try {
      const uinfo = await GetCurrentUserInfo({ hostPort, authToken });
      setCurrentUser({
        userID: uinfo.userID.trim(),
        individualID: uinfo.individualID.trim(),
        serviceProviderID: uinfo.serviceProviderID.trim(),
        token: uinfo.token.trim()
      });
    } catch (error) {
      return handleError(error as JWError);
    }
  }, [hostPort, authToken, handleError]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  return { currentUser: currentUser, error: error };
};
