import { useCallback, useEffect, useState } from "react";
import { OnErrorFcn } from "../components/types";
import { Beneficiary, BeneficiaryID, EMPTY_BENEFICIARY, EMPTY_SERVICE_PROVIDER, GetBeneficiaryInfo, GetServiceProviderInfo, IsUuid, IsValidURL, JWError, JWErrorAuthenticationRequired, ServiceProvider } from "../util";
import { CurrentUser, IsEmptyUser } from "./useFetchCurrentUserInfo";

export interface UseFetchBeneficiariesProps {
  hostPort: string;
  authToken: string;
  currentUser: CurrentUser;
  beneficiaryIDs: BeneficiaryID[];
  onError: OnErrorFcn;
  onReset?: () => void;
}

export interface UseFetchBeneficiariesReturn {
  beneficiaries: Record<BeneficiaryID, Beneficiary>;
  error: JWError | null;
}

export const useFetchBeneficiaries = ({
  hostPort,
  authToken,
  currentUser,
  beneficiaryIDs,
  onError,
  onReset,
}: UseFetchBeneficiariesProps): UseFetchBeneficiariesReturn => {
  const [beneficiaries, setBeneficiaries] = useState<Record<BeneficiaryID, Beneficiary>>({});
  const [error, setError] = useState<JWError | null>(null);

  const validateInputs = (hostPort: string, authToken: string, beneficiaryIDs: string[]): JWError | null => {
    if (!hostPort?.trim()) {
      return new JWError("missing hostPort");
    }

    if (!IsValidURL(hostPort)) {
      return new JWError("hostPort is not a valid URL");
    }

    if (!authToken?.trim()) {
      return new JWErrorAuthenticationRequired("missing auth token");
    }

    if (beneficiaryIDs.some((id) => !IsUuid(id))) {
      return new JWError(`some of the provided beneficiary IDs are not valid UUIDs`);
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
  const fetchBeneficiaries = useCallback(async () => {
    if (IsEmptyUser(currentUser)) {
      setBeneficiaries({});
      return;
    }

    if(!beneficiaryIDs || beneficiaryIDs.length === 0) {
      setBeneficiaries({});
      return;
    }

    const validationError = validateInputs(hostPort, authToken, beneficiaryIDs);
    if (validationError) {
      handleError(validationError);
      return;
    }

    try {
      const benIDs = [...beneficiaryIDs];
      
      const responses = await Promise.all(benIDs.map((benID) => GetBeneficiaryInfo({ hostPort, authToken, beneficiaryID: benID.trim() })));

      const beneficiaries = responses.map((response) => response.beneficiary).filter(Boolean) as Beneficiary[];

      console.debug(`JustWhere: retrieved ${beneficiaries.length} beneficiaries`);

      const beneficiariesInfo = beneficiaries.reduce<Record<BeneficiaryID, Beneficiary>>(
        (acc, cur) => ({
          ...acc,
          [cur.ID]: cur,
        }),
        {},
      );

      setBeneficiaries(beneficiariesInfo);

    } catch (error) {
      console.error("JustWhere: error fetching beneficiaries:", error);
      handleError(new JWError((error as Error).message));
    }
  }, [hostPort, authToken, currentUser, beneficiaryIDs, handleError]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  return { beneficiaries, error };
}
