import { useCallback, useEffect, useState } from "react";
import { OnErrorFcn } from "../components/types";
import { EMPTY_SERVICE_PROVIDER, GetServiceProviderInfo, IsUuid, IsValidURL, JWError, JWErrorAuthenticationRequired, ServiceProvider } from "../util";
import { CurrentUser, IsEmptyUser } from "./useFetchCurrentUserInfo";

export interface UseFetchServiceProviderProps {
  hostPort: string;
  authToken: string;
  currentUser: CurrentUser;
  serviceProviderID: string;
  onError: OnErrorFcn;
  onReset?: () => void;
}

export interface UseFetchServiceProviderReturn {
  serviceProvider: ServiceProvider;
  error: JWError | null;
}

export const useFetchServiceProvider = ({
  hostPort,
  authToken,
  currentUser,
  serviceProviderID,
  onError,
  onReset,
}: UseFetchServiceProviderProps): UseFetchServiceProviderReturn => {
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>(EMPTY_SERVICE_PROVIDER);
  const [error, setError] = useState<JWError | null>(null);

  const validateInputs = (hostPort: string, authToken: string, serviceProviderID: string): JWError | null => {
    if (!hostPort?.trim()) {
      return new JWError("missing hostPort");
    }

    if (!IsValidURL(hostPort)) {
      return new JWError("hostPort is not a valid URL");
    }

    if (!authToken?.trim()) {
      return new JWErrorAuthenticationRequired("missing auth token");
    }

    if (!serviceProviderID?.trim()) {
      return new JWError("missing or invalid service provider ID");
    }

    if (!IsUuid(serviceProviderID)) {
      return new JWError("service provider ID is not a valid UUID");
    }

    return null;
  };

  // Memoized error handler
  const handleError = useCallback((error: JWError) => {
    setError(error);

    try {
      onReset?.();
    }
    catch (e) {
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
  const fetchServiceProvider = useCallback(async () => {

     if (IsEmptyUser(currentUser)) {
      return { serviceProvider: EMPTY_SERVICE_PROVIDER, error: null };
    }

    if(!hostPort || hostPort.trim().length === 0) {
      return { serviceProvider: EMPTY_SERVICE_PROVIDER, error: null };
    }

    if(!authToken || authToken.trim().length === 0) {
      return { serviceProvider: EMPTY_SERVICE_PROVIDER, error: null };
    }

    const validationError = validateInputs(hostPort, authToken, serviceProviderID);
    if (validationError) {
      return handleError(validationError);
    }

    try {
      const response = await GetServiceProviderInfo({
        hostPort,
        authToken,
        serviceProviderID: serviceProviderID,
      });
      setError(null);
      setServiceProvider(response.serviceProvider);
    } catch (error) {
      return handleError(error as JWError);
    }
  }, [hostPort, authToken, currentUser, serviceProviderID, handleError]);

  useEffect(() => {
    fetchServiceProvider();
  }, [fetchServiceProvider]);

  return { serviceProvider: serviceProvider, error: error };
}
