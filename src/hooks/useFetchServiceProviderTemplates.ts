import { useCallback, useEffect, useState } from "react";
import { OnErrorFcn } from "../components/types";
import { GetTemplatesForServiceProvider, IsEmptyServiceProvider, IsValidURL, JWError, JWErrorAuthenticationRequired, JWErrorNotFound, SecureContentTemplate, ServiceProvider } from "../util";
import { CurrentUser, IsEmptyUser } from "./useFetchCurrentUserInfo";

export interface UseFetchServiceProviderTemplatesProps {
  hostPort: string;
  authToken: string;
  currentUser: CurrentUser;
  serviceProvider: ServiceProvider;
  onError: OnErrorFcn;
  onReset?: () => void;
}

export interface UseFetchServiceProviderTemplatesReturn {
  templates: SecureContentTemplate[]
  error: JWError | null;
}

export const useFetchServiceProviderTemplates = ({
  hostPort,
  authToken,
  currentUser,
  serviceProvider,
  onError,
  onReset,
}: UseFetchServiceProviderTemplatesProps): UseFetchServiceProviderTemplatesReturn => {
  const [templates, setTemplates] = useState<SecureContentTemplate[]>([]);
  const [error, setError] = useState<JWError | null>(null);

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
  const fetchServiceProviderTemplates = useCallback(async () => {

    if(IsEmptyUser(currentUser)) {
      return { templates: [], error: null };
    }

    if(IsEmptyServiceProvider(serviceProvider)) {
      return { templates: [], error: null };
    }

    if (!hostPort?.trim()) {
      return { templates: [], error: null };
    }

    if (!authToken?.trim()) {
      return { templates: [], error: null };
    }

    try {
      const defaultTemplates = await GetTemplatesForServiceProvider({
        hostPort,
        authToken,
        serviceProviderID: currentUser.serviceProviderID,
      });

      console.debug("JustWhere: retrieved", defaultTemplates.length, "default template(s)");

      let spTemplates = new Array<SecureContentTemplate>();
      try {

        spTemplates = await GetTemplatesForServiceProvider({
          hostPort,
          authToken,
          serviceProviderID: serviceProvider.ID
        });
        console.debug("JustWhere: retrieved", spTemplates.length, "service provider template(s)");

        const allTemplates = [...spTemplates];

        // any sp template having same type as a default template will take
        // precedence over the default template
        const seenTypes = spTemplates.reduce((acc, cur) => {
          acc.add(cur.Type.trim().toLowerCase());
          return acc;
        }, new Set<string>());

        defaultTemplates.forEach((template) => {
          if (seenTypes.has(template.Type.trim().toLowerCase())) {
            console.debug("JustWhere: skipping default template", template.Type.trim().toLowerCase(), "as it is already present in the service provider templates");
            return;
          }
          seenTypes.add(template.Type.trim().toLowerCase());
          allTemplates.push(template);
        });

        setTemplates(allTemplates);
        console.debug("JustWhere: total templates", allTemplates.length);

      } catch (e) {
        if (!(e instanceof JWErrorNotFound)) {
          throw e;
        } else {
          console.debug("JustWhere: no service provider templates available");
          setTemplates(defaultTemplates);
          console.debug("JustWhere: total templates", defaultTemplates.length);
        }
      }

    } catch (error) {
      return handleError(error as JWError);
    }
  }, [hostPort, authToken, currentUser, serviceProvider, handleError]);

  useEffect(() => {
    fetchServiceProviderTemplates();
  }, [fetchServiceProviderTemplates]);

  return { templates: templates, error: error };
}
