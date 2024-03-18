import { DefaultApi as APITokens, Configuration as APITokensConfig, PrimaryTokenInput, SecondaryTokenInput } from "../internal/apis/tokens";
import { IndividualID, AddressID, ServiceProviderID, BeneficiaryID, PrimaryToken, SecondaryToken } from "../types/types";



const GenereratePrimaryToken = async (
    hostport: string,
    individualID: IndividualID,
    addressID: AddressID,
    serviceProviderID: ServiceProviderID): Promise<PrimaryToken> => {

        const input: PrimaryTokenInput = {
        individualID: individualID,
        addressID: addressID,
        serviceProviderID: serviceProviderID
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
    return token;
}

const GenererateSecondaryToken = async (
    hostport: string,
    serviceProviderID: ServiceProviderID,
    beneficiaryID: BeneficiaryID, 
    primaryToken: PrimaryToken): Promise<SecondaryToken> => {

    const input: SecondaryTokenInput = {
        serviceProviderID: serviceProviderID,
        beneficiaryID: beneficiaryID,
        token: primaryToken
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
    return token;
}

export { GenereratePrimaryToken, GenererateSecondaryToken };