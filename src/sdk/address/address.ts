import { DefaultApi as APIIndividuals, Configuration as APIIndividualsConfig, AddressInput, Tag as APITag } from "../internal/apis/individuals";
import { IndividualID, AddressID, BeneficiaryID, PrimaryToken, SecondaryToken, ServiceProviderID, Address, Tag } from "../types/types";

const GetAddressUsingPrimaryToken = async (
    hostport: string,
    individualID: IndividualID,
    addressID: AddressID,
    serviceProviderID: ServiceProviderID,
    primaryToken: PrimaryToken): Promise<Address> => {

    const config: APIIndividualsConfig = new APIIndividualsConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APIIndividuals(config);

    const response = await api.getAddress(addressID, primaryToken, serviceProviderID, individualID);
    const address = response.data || null
    return convertToAddress(address);
}

const GetAddressUsingSecondaryToken = async (
    hostport: string,
    individualID: IndividualID,
    addressID: AddressID,
    beneficiaryID: BeneficiaryID,
    secondaryToken: SecondaryToken): Promise<Address> => {
    const config: APIIndividualsConfig = new APIIndividualsConfig({
        basePath: `${hostport}/api`,
        baseOptions: {
            withCredentials: true
        }
    })

    const api = new APIIndividuals(config);

    const response = await api.getAddress(addressID, secondaryToken, beneficiaryID, individualID);
    const address = response.data || null
    return convertToAddress(address);
}

const convertTags = (tag: APITag): Tag => {
    return {
        Name: tag["Name"] || "",
        Value: tag["Value"] || "",
    }
}

const convertToAddress = (input: AddressInput): Address => {
    if (!input) return {ID: "", IndividualID: ""};
    const addr: Address = {
        ID: input["id"] || "",
        IndividualID: input["individualId"] || "",
        Addressee: input["addressee"] || "",
        Street1: input["street"] || "",
        City: input["city"] || "",
        State: input["state"] || "",
        ZipCode: input["zipCode"] || "",
        Country: input["country"] || "",
        Phone: input["phone"] || "",
        Email: input["email"] || ""
    }

    // TODO: process the tags from input and set the Label (Name)

    return addr
        
}

export { GetAddressUsingPrimaryToken, GetAddressUsingSecondaryToken }