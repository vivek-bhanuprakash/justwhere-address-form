import { useCallback, useEffect, useState } from "react";
import { OnErrorFcn } from "../components/types";
import { GetTemplatesForServiceProvider, IsEmptyServiceProvider, IsValidURL, JWError, JWErrorAuthenticationRequired, JWErrorNotFound, SecureContentTemplate, ServiceProvider } from "../util";
import { CurrentUser, IsEmptyUser } from "./useFetchCurrentUserInfo";

export interface UseFetchContentTemplatesProps {
    currentUser: CurrentUser;
    spTemplates: SecureContentTemplate[],
    contentTypeFilter: string[];
    onError: OnErrorFcn;
    onReset?: () => void;
}

export interface UseFetchContentTemplatesReturn {
    templates: SecureContentTemplate[]
    error: JWError | null;
}

export const useFetchContentTemplates = ({
    currentUser,
    spTemplates,
    contentTypeFilter,
    onError,
    onReset,
}: UseFetchContentTemplatesProps): UseFetchContentTemplatesReturn => {
    const [templates, setTemplates] = useState<SecureContentTemplate[]>([]);
    const [error, setError] = useState<JWError | null>(null);

    const validateInputs = (contentTypeFilter: string[]): JWError | null => {
        if (!contentTypeFilter || !contentTypeFilter.length) {
            return new JWError("no content type filter provided or content type filter is not an array of strings");
        }

        if (!Array.isArray(contentTypeFilter) || !contentTypeFilter.every((item) => typeof item === "string")) {
            return new JWError("no content type filter provided or content type filter is not an array of strings");
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
    const fetchContentTemplates = useCallback(async () => {

        if (IsEmptyUser(currentUser)) {
            return { templates: [], error: null };
        }

        if (!spTemplates || !spTemplates.length) {
            return { templates: [], error: null };
        }

        if(!contentTypeFilter || !contentTypeFilter.length) {
            return { templates: [], error: null };
        }

        const validationError = validateInputs(contentTypeFilter);
        if (validationError) {
            handleError(validationError);
            return;
        }

        // filter spTemplates by provided content type filter
        const filteredTemplates = Array<SecureContentTemplate>();
        for (const cTemplate of spTemplates) {
            for (const fTemplate of contentTypeFilter) {
                if (cTemplate.Type.toLowerCase().trim() === fTemplate.toLowerCase().trim() || cTemplate.ID.toLowerCase().trim() === fTemplate.toLowerCase().trim()) {
                    filteredTemplates.push(cTemplate);
                }
            }
        }

        console.debug(`JustWhere: ${filteredTemplates.length} service provider templates match content type filter`, contentTypeFilter);

        setTemplates(filteredTemplates);

    }, [currentUser, spTemplates, contentTypeFilter, handleError]);

    useEffect(() => {
        fetchContentTemplates();
    }, [fetchContentTemplates]);

    return { templates: templates, error: error };
}
