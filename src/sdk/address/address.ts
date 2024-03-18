import { AddressOutput } from "../../apis/individuals";
import { DefaultApi as APIIndividuals, Configuration as APIIndividualsConfig, AddressInput, Tag as APITag } from "../internal/apis/individuals";
import { IndividualID, AddressID, BeneficiaryID, PrimaryToken, SecondaryToken, ServiceProviderID, Address, Tag } from "../types/types";

const GetAddressUsingPrimaryToken = async (
    hostport: string,
    individualID: IndividualID,
    addressID: AddressID,
    serviceProviderID: ServiceProviderID,
    primaryToken: PrimaryToken): Promise<AddressOutput> => {

    const config: APIIndividualsConfig = new APIIndividualsConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APIIndividuals(config);

    const response = await api.getAddress(addressID, primaryToken, serviceProviderID, individualID);
    const address = response.data || null
    return address;
}

const GetAddressUsingSecondaryToken = async (
    hostport: string,
    individualID: IndividualID,
    addressID: AddressID,
    beneficiaryID: BeneficiaryID,
    secondaryToken: SecondaryToken): Promise<AddressOutput> => {
    const config: APIIndividualsConfig = new APIIndividualsConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APIIndividuals(config);

    const response = await api.getAddress(addressID, secondaryToken, beneficiaryID, individualID);
    const address = response.data || null
    return address;
}

const convertTags = (tag: APITag): Tag => {
    return {
        Name: tag["Name"] || "",
        Value: tag["Value"] || "",
    }
}

export { GetAddressUsingPrimaryToken, GetAddressUsingSecondaryToken }