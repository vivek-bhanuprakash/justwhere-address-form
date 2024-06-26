/* tslint:disable */
/* eslint-disable */
/**
 * Token Management API
 * API for creating and disabling primary and secondary tokens.
 *
 * The version of the OpenAPI document: 0.0.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import type { Configuration } from './configuration';
import type { AxiosPromise, AxiosInstance, RawAxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
// Some imports not used depending on template conditions
// @ts-ignore
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from './common';
import type { RequestArgs } from './base';
// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS, BaseAPI, RequiredError, operationServerMap } from './base';

/**
 * 
 * @export
 * @interface PrimaryTokenInput
 */
export interface PrimaryTokenInput {
    /**
     * The ID of the service provider (UUID format).
     * @type {string}
     * @memberof PrimaryTokenInput
     */
    'serviceProviderID': string;
    /**
     * The ID of the address (UUID format).
     * @type {string}
     * @memberof PrimaryTokenInput
     */
    'addressID': string;
    /**
     * The ID of the service provider (UUID format).
     * @type {string}
     * @memberof PrimaryTokenInput
     */
    'individualID': string;
}
/**
 * 
 * @export
 * @interface PrimaryTokenOutput
 */
export interface PrimaryTokenOutput {
    /**
     * The ID of the address (UUID format).
     * @type {string}
     * @memberof PrimaryTokenOutput
     */
    'addressID'?: string;
    /**
     * The token represented in hexadecimal format.
     * @type {string}
     * @memberof PrimaryTokenOutput
     */
    'token'?: string;
}
/**
 * 
 * @export
 * @interface SecondaryTokenInput
 */
export interface SecondaryTokenInput {
    /**
     * The ID of the service provider (UUID format).
     * @type {string}
     * @memberof SecondaryTokenInput
     */
    'serviceProviderID': string;
    /**
     * The ID of the beneficiary (UUID format).
     * @type {string}
     * @memberof SecondaryTokenInput
     */
    'beneficiaryID': string;
    /**
     * The token represented in hexadecimal format.
     * @type {string}
     * @memberof SecondaryTokenInput
     */
    'token': string;
}
/**
 * 
 * @export
 * @interface SecondaryTokenOutput
 */
export interface SecondaryTokenOutput {
    /**
     * The token represented in hexadecimal format.
     * @type {string}
     * @memberof SecondaryTokenOutput
     */
    'token'?: string;
}

/**
 * DefaultApi - axios parameter creator
 * @export
 */
export const DefaultApiAxiosParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Creates a primary token with the given serviceProviderID and addressID.
         * @summary Create Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createPrimaryToken: async (primaryTokenInput: PrimaryTokenInput, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'primaryTokenInput' is not null or undefined
            assertParamExists('createPrimaryToken', 'primaryTokenInput', primaryTokenInput)
            const localVarPath = `/tokens/primary`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(primaryTokenInput, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Creates a secondary token with the given serviceProviderID and token.
         * @summary Create Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSecondaryToken: async (secondaryTokenInput: SecondaryTokenInput, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'secondaryTokenInput' is not null or undefined
            assertParamExists('createSecondaryToken', 'secondaryTokenInput', secondaryTokenInput)
            const localVarPath = `/tokens/secondary`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(secondaryTokenInput, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Creates a secondary token with the given request.
         * @summary Returns Secondary Token
         * @param {string} id The ID of the request entity to retrieve and use
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSecondaryTokenFromRequest: async (id: string, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'id' is not null or undefined
            assertParamExists('createSecondaryTokenFromRequest', 'id', id)
            const localVarPath = `/tokens/secondary/request/{id}`
                .replace(`{${"id"}}`, encodeURIComponent(String(id)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Disables a primary token with the given serviceProviderID and addressID.
         * @summary Disable Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        disablePrimaryToken: async (primaryTokenInput: PrimaryTokenInput, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'primaryTokenInput' is not null or undefined
            assertParamExists('disablePrimaryToken', 'primaryTokenInput', primaryTokenInput)
            const localVarPath = `/tokens/primary`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(primaryTokenInput, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Disables a secondary token with the given serviceProviderID and token.
         * @summary Disable Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        disableSecondaryToken: async (secondaryTokenInput: SecondaryTokenInput, options: RawAxiosRequestConfig = {}): Promise<RequestArgs> => {
            // verify required parameter 'secondaryTokenInput' is not null or undefined
            assertParamExists('disableSecondaryToken', 'secondaryTokenInput', secondaryTokenInput)
            const localVarPath = `/tokens/secondary`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }

            const localVarRequestOptions = { method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;


    
            localVarHeaderParameter['Content-Type'] = 'application/json';

            setSearchParams(localVarUrlObj, localVarQueryParameter);
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
            localVarRequestOptions.data = serializeDataIfNeeded(secondaryTokenInput, localVarRequestOptions, configuration)

            return {
                url: toPathString(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * DefaultApi - functional programming interface
 * @export
 */
export const DefaultApiFp = function(configuration?: Configuration) {
    const localVarAxiosParamCreator = DefaultApiAxiosParamCreator(configuration)
    return {
        /**
         * Creates a primary token with the given serviceProviderID and addressID.
         * @summary Create Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async createPrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<PrimaryTokenOutput>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.createPrimaryToken(primaryTokenInput, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['DefaultApi.createPrimaryToken']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * Creates a secondary token with the given serviceProviderID and token.
         * @summary Create Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async createSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SecondaryTokenOutput>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.createSecondaryToken(secondaryTokenInput, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['DefaultApi.createSecondaryToken']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * Creates a secondary token with the given request.
         * @summary Returns Secondary Token
         * @param {string} id The ID of the request entity to retrieve and use
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async createSecondaryTokenFromRequest(id: string, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<SecondaryTokenOutput>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.createSecondaryTokenFromRequest(id, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['DefaultApi.createSecondaryTokenFromRequest']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * Disables a primary token with the given serviceProviderID and addressID.
         * @summary Disable Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async disablePrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.disablePrimaryToken(primaryTokenInput, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['DefaultApi.disablePrimaryToken']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
        /**
         * Disables a secondary token with the given serviceProviderID and token.
         * @summary Disable Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        async disableSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: RawAxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<void>> {
            const localVarAxiosArgs = await localVarAxiosParamCreator.disableSecondaryToken(secondaryTokenInput, options);
            const localVarOperationServerIndex = configuration?.serverIndex ?? 0;
            const localVarOperationServerBasePath = operationServerMap['DefaultApi.disableSecondaryToken']?.[localVarOperationServerIndex]?.url;
            return (axios, basePath) => createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration)(axios, localVarOperationServerBasePath || basePath);
        },
    }
};

/**
 * DefaultApi - factory interface
 * @export
 */
export const DefaultApiFactory = function (configuration?: Configuration, basePath?: string, axios?: AxiosInstance) {
    const localVarFp = DefaultApiFp(configuration)
    return {
        /**
         * Creates a primary token with the given serviceProviderID and addressID.
         * @summary Create Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createPrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: any): AxiosPromise<PrimaryTokenOutput> {
            return localVarFp.createPrimaryToken(primaryTokenInput, options).then((request) => request(axios, basePath));
        },
        /**
         * Creates a secondary token with the given serviceProviderID and token.
         * @summary Create Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: any): AxiosPromise<SecondaryTokenOutput> {
            return localVarFp.createSecondaryToken(secondaryTokenInput, options).then((request) => request(axios, basePath));
        },
        /**
         * Creates a secondary token with the given request.
         * @summary Returns Secondary Token
         * @param {string} id The ID of the request entity to retrieve and use
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        createSecondaryTokenFromRequest(id: string, options?: any): AxiosPromise<SecondaryTokenOutput> {
            return localVarFp.createSecondaryTokenFromRequest(id, options).then((request) => request(axios, basePath));
        },
        /**
         * Disables a primary token with the given serviceProviderID and addressID.
         * @summary Disable Primary Token
         * @param {PrimaryTokenInput} primaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        disablePrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: any): AxiosPromise<void> {
            return localVarFp.disablePrimaryToken(primaryTokenInput, options).then((request) => request(axios, basePath));
        },
        /**
         * Disables a secondary token with the given serviceProviderID and token.
         * @summary Disable Secondary Token
         * @param {SecondaryTokenInput} secondaryTokenInput 
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        disableSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: any): AxiosPromise<void> {
            return localVarFp.disableSecondaryToken(secondaryTokenInput, options).then((request) => request(axios, basePath));
        },
    };
};

/**
 * DefaultApi - object-oriented interface
 * @export
 * @class DefaultApi
 * @extends {BaseAPI}
 */
export class DefaultApi extends BaseAPI {
    /**
     * Creates a primary token with the given serviceProviderID and addressID.
     * @summary Create Primary Token
     * @param {PrimaryTokenInput} primaryTokenInput 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public createPrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: RawAxiosRequestConfig) {
        return DefaultApiFp(this.configuration).createPrimaryToken(primaryTokenInput, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Creates a secondary token with the given serviceProviderID and token.
     * @summary Create Secondary Token
     * @param {SecondaryTokenInput} secondaryTokenInput 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public createSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: RawAxiosRequestConfig) {
        return DefaultApiFp(this.configuration).createSecondaryToken(secondaryTokenInput, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Creates a secondary token with the given request.
     * @summary Returns Secondary Token
     * @param {string} id The ID of the request entity to retrieve and use
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public createSecondaryTokenFromRequest(id: string, options?: RawAxiosRequestConfig) {
        return DefaultApiFp(this.configuration).createSecondaryTokenFromRequest(id, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Disables a primary token with the given serviceProviderID and addressID.
     * @summary Disable Primary Token
     * @param {PrimaryTokenInput} primaryTokenInput 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public disablePrimaryToken(primaryTokenInput: PrimaryTokenInput, options?: RawAxiosRequestConfig) {
        return DefaultApiFp(this.configuration).disablePrimaryToken(primaryTokenInput, options).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Disables a secondary token with the given serviceProviderID and token.
     * @summary Disable Secondary Token
     * @param {SecondaryTokenInput} secondaryTokenInput 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApi
     */
    public disableSecondaryToken(secondaryTokenInput: SecondaryTokenInput, options?: RawAxiosRequestConfig) {
        return DefaultApiFp(this.configuration).disableSecondaryToken(secondaryTokenInput, options).then((request) => request(this.axios, this.basePath));
    }
}



