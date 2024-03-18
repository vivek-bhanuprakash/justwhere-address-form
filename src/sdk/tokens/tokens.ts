import { DefaultApi as APITokens, Configuration as APITokensConfig, PrimaryTokenInput, SecondaryTokenInput } from "../internal/apis/tokens";
import { PrimaryTokenRequest, PrimaryTokenResponse, SecondaryTokenRequest, SecondaryTokenResponse } from "../types/types";



const GenereratePrimaryToken = async (hostport: string, request: PrimaryTokenRequest): Promise<PrimaryTokenResponse> => {

    const input: PrimaryTokenInput = {
        individualID: request.individualID,
        addressID: request.addressID,
        serviceProviderID: request.serviceProviderID
    }

    const config: APITokensConfig = new APITokensConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APITokens(config);

    const response = await api.createPrimaryToken(input);
    const token = response.data.token || "";
    return { request: request, token: token };
}

const GenererateSecondaryToken = async (hostport: string, request: SecondaryTokenRequest): Promise<SecondaryTokenResponse> => {

    const input: SecondaryTokenInput = {
        serviceProviderID: request.serviceProviderID,
        beneficiaryID: request.beneficiaryID,
        token: request.primaryToken
    }

    const config: APITokensConfig = new APITokensConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APITokens(config);

    const response = await api.createSecondaryToken(input);
    const token = response.data.token || "";
    return {request: request, token: token};
}

export { GenereratePrimaryToken, GenererateSecondaryToken };