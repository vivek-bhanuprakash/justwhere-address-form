import React, { Component, useState } from 'react';
import { Configuration as APITokensConfig, DefaultApi as APITokens, PrimaryTokenInput, SecondaryTokenInput } from './apis/tokens';
import { Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals, AddressInput, AddressOutput } from './apis/individuals';

import { AxiosError, RawAxiosRequestConfig } from 'axios';


const MY_INDIVIDUAL_ID = "5bae1372-010f-4e2d-bbf7-51b925770223"
const MY_ADDRESS_ID = "ad277532-8424-4f7e-848b-6ba43164ebe6"
const MY_OWNER_TOKEN = "4e70926e9dded1647349209ae6b5c71b59390f7c7d03d10d900b05b5d42a91d1649267d96be901e01f3a664920af32bf98b1068b523693bf35bbc36a4309b649acac5dcc239f1e5a2bc51d87d3311fbe41a3371d21046d010e392127e219517a59889e9b7ef9f929ec1d8b5e90cfc978591a519cf8364419903e4b679190"
const DEFAULT_SERVICE_PROVIDER_ID = "1b8cef34-b25d-42cb-9a9e-5b2e9615dda7"
const DEFAULT_PRIMARY_TOKEN = "73c32a30773387882a7e124e02dd1a473bd878e24bd00946571f6d7277fe1b982a2246f7f1618b859916d8ea0bc0c54cd7ab5167a05182f201fcdc34b1fc9ac1e6cc238896562bd74208f64d116d1a69806ff96a04c5cbf936170caeac58a04a5aa9244ab56ef12645bfcd9effd589a28a4dfe5b727776f7d2fb39f31222"
const DEFAULT_BENEFICIARY_ID = "51837c98-c2f3-45a7-ad17-6dc8a5928e2b"
const DEFAULT_SECONDARY_TOKEN = ""

const AddressComponent: React.FC = () => {
    const [address, setAddress] = useState<AddressOutput>();
    const [jwHost, setJWHost] = useState<string>('https://localhost');
    const [individualID, setIndividualID] = useState<string>(MY_INDIVIDUAL_ID);
    const [addressID, setAddressID] = useState<string>(MY_ADDRESS_ID);
    const [ownerToken, setOwnerToken] = useState<string>(MY_OWNER_TOKEN);

    const [serviceProviderID, setServiceProviderID] = useState(DEFAULT_SERVICE_PROVIDER_ID);
    const [primaryToken, setPrimaryToken] = useState<string>(DEFAULT_PRIMARY_TOKEN);

    const [beneficiaryID, setBeneficiaryID] = useState<string>(DEFAULT_BENEFICIARY_ID);
    const [secondaryToken, setSecondaryToken] = useState<string>(DEFAULT_SECONDARY_TOKEN);

    const genereratePrimaryToken = async (individualID: string, addressID: string, serviceProviderID: string): Promise<string> => {
        const input: PrimaryTokenInput = {
            individualID: individualID,
            addressID: addressID,
            serviceProviderID: serviceProviderID
        }

        const config: APITokensConfig = new APITokensConfig({
            basePath: `${jwHost}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new APITokens(config);

        const response = await api.createPrimaryToken(input);
        const token = response.data.token || "";
        return token;
    }

    const genererateSecondaryToken = async (serviceProviderID: string, beneficiaryID: string, primaryToken: string): Promise<string> => {
        const input: SecondaryTokenInput = {
            serviceProviderID: serviceProviderID,
            beneficiaryID: beneficiaryID,
            token: primaryToken
        }

        const config: APITokensConfig = new APITokensConfig({
            basePath: `${jwHost}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new APITokens(config);

        const response = await api.createSecondaryToken(input);
        const token = response.data.token || "";
        return token;
    }

    const getAddressUsingPrimaryToken = async (addressID: string, serviceProviderID: string, primaryToken: string): Promise<AddressOutput> => {

        const config: APIIndividualsConfig = new APIIndividualsConfig({
            basePath: `${jwHost}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new APIIndividuals(config);

        const response = await api.getAddress(addressID, primaryToken, serviceProviderID);
        const address = response.data || null
        return address;
    }

    const getAddressUsingSecondaryToken = async (addressID: string, beneficiaryID: string, secondaryToken: string): Promise<AddressOutput> => {
        const config: APIIndividualsConfig = new APIIndividualsConfig({
            basePath: `${jwHost}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new APIIndividuals(config);

        const response = await api.getAddress(addressID, secondaryToken, beneficiaryID);
        const address = response.data || null
        return address;

    }

    const getAddressUsingOwnerToken = async (addressID: string, individualID: string, ownerToken: string): Promise<AddressOutput> => {
        const config: APIIndividualsConfig = new APIIndividualsConfig({
            basePath: `${jwHost}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new APIIndividuals(config);

        const response = await api.getAddress(addressID, ownerToken, "", individualID);
        const address = response.data || null
        return address;
    }

    const createPrimaryToken = async () => {
        let message = "";
        if (individualID === "") {
            message = "Individual ID is required"
        }
        if (addressID === "") {
            message = "Address ID is required"
        }
        if (serviceProviderID === "") {
            message = "Service Provider ID is required"
        }
        if (message !== "") {
            setPrimaryToken(message)
            return;
        }
        try {
            const token = await genereratePrimaryToken(individualID, addressID, serviceProviderID);
            setPrimaryToken(token);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.error("createPrimaryToken: ", err.response?.status, ":", err.response?.statusText)
                setPrimaryToken(err.message)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${jwHost}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.error("createPrimaryToken: ", err)
                setPrimaryToken(err.message)
            } else {
                // Anything else
                console.error("createPrimaryToken: ", err)
            }
        }
    }

    const createSecondaryToken = async () => {
        let message = "";
        if (serviceProviderID === "") {
            message = "Service Provider ID is required"
        }
        if (beneficiaryID === "") {
            message = "Beneficiary ID is required"
        }
        if (primaryToken === "") {
            message = "Primary Token is required"
        }
        if (message !== "") {
            setSecondaryToken(message)
            return;
        }
        try {
            const token = await genererateSecondaryToken(serviceProviderID, beneficiaryID, primaryToken);
            setSecondaryToken(token);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.error("createSecondaryToken: ", err.response?.status, ":", err.response?.statusText)
                setPrimaryToken(err.message)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${jwHost}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.error("createSecondaryToken: ", err)
                setPrimaryToken(err.message)
            } else {
                // Anything else
                console.error("createSecondaryToken: ", err)
            }
        }
    }

    const fetchAddressForServiceProvider = async () => {
        let message = "";
        if (addressID === "") {
            message = "Address ID is required"
        }
        if (serviceProviderID === "") {
            message = "Service Provider ID is required"
        }
        if (primaryToken === "") {
            message = "Primary Token is required"
        }
        if (message !== "") {
            console.error(message);
            return;
        }
        try {
            const address = await getAddressUsingPrimaryToken(addressID, serviceProviderID, primaryToken);
            setAddress(address);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.error("fetchAddressForServiceProvider: ", err.response?.status, ":", err.response?.statusText)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${jwHost}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.error("fetchAddressForServiceProvider: ", err)
            } else {
                // Anything else
                console.error("fetchAddressForServiceProvider: ", err)
            }
        }

    }

    const fetchAddressForBeneficiary = async () => {
        let message = "";
        if (addressID === "") {
            message = "Address ID is required"
        }
        if (beneficiaryID === "") {
            message = "Beneficiary ID is required"
        }
        if (secondaryToken === "") {
            message = "Secondary Token is required"
        }
        if (message !== "") {
            console.error(message);
            return;
        }
        try {
            const address = await getAddressUsingSecondaryToken(addressID, beneficiaryID, secondaryToken);
            setAddress(address);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.error("fetchAddressForBeneficiary: ", err.response?.status, ":", err.response?.statusText)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${jwHost}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.error("fetchAddressForBeneficiary: ", err)
            } else {
                // Anything else
                console.error("fetchAddressForBeneficiary: ", err)
            }
        }
    }

    const fetchAddressForIndividual = async () => {
        let message = "";
        if (addressID === "") {
            message = "Address ID is required"
        }
        if (individualID === "") {
            message = "Individual ID is required"
        }
        if (ownerToken === "") {
            message = "Owner Token is required"
        }
        if (message !== "") {
            console.error(message);
            return;
        }
        try {
            const address = await getAddressUsingOwnerToken(addressID, individualID, ownerToken);
            setAddress(address);
        }
        catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.error("fetchAddressForIndividual: ", err.response?.status, ":", err.response?.statusText)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${jwHost}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
                console.error("fetchAddressForIndividual: ", err)
            } else {
                // Anything else
                console.error("fetchAddressForIndividual: ", err)
            }
        }
    }

    return (
        <span>
            <div className="relative flex flex-col overflow-hidden bg-gray-50 py-6 sm:py-12">
                <form className="mx-5 my-5 w-full max-w-lg">
                    <div className="flex flex-wrap gap-3">
                        <div className="w-full">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="address-label">Label </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="address-label" type="text" placeholder="Home" />
                        </div>
                        <div className="w-full">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="addressee"> Name </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="addressee" type="text" placeholder="Mr. John Smith" value={address?.addressee} />
                        </div>
                        <div className="flex w-full gap-3">
                            <div className="w-1/3">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="city"> City </label>
                                <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="city" type="text" placeholder="Albuquerque" value={address?.city} />
                            </div>
                            <div className="w-1/3">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="state"> State </label>
                                <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="state" type="text" placeholder="New Mexico" value={address?.state} />
                            </div>
                            <div className="w-1/3">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="zip"> Zip </label>
                                <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="zip" type="text" placeholder="90210" value={address?.zipCode} />
                            </div>
                        </div>
                        <div className="flex w-full gap-3">
                            <div className="w-1/2">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="phone">Phone</label>
                                <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="phone" type="text" placeholder="+1 (234) 555-1234" value={address?.phone} />
                            </div>
                            <div className="w-1/2">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="email"> Email </label>
                                <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="email" type="text" placeholder="email@domain.com" value={address?.email} />
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div className="relative flex flex-col overflow-hidden bg-gray-50 py-6 sm:py-12">
                <div className="flex w-full items-center justify-start gap-3">
                    <button id="btnGenPrimaryToken" onClick={createPrimaryToken} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Gen. Primary Token</button>
                    <button id="btnGenSecondaryToken" onClick={createSecondaryToken} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Gen. Secondary Token</button>
                </div>
                <div className="flex w-full items-center justify-start gap-3">
                    <button id="btnGetAddressUsingPrimaryToken" onClick={fetchAddressForServiceProvider} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Get Address w/Primary Token</button>
                    <button id="btnGetAddressUsingSecondaryToken" onClick={fetchAddressForBeneficiary} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Get Address w/Secondary Token</button>
                    <button id="btnGetAddressUsingOwnerToken" onClick={fetchAddressForIndividual} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Get Address w/Owner Token</button>
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="jwHost">JustWhere Host</label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="jwHost" type="text" placeholder="JustWhere Host" value={jwHost} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJWHost(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="individualID">Individual ID </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="individualID" type="text" placeholder="Individual ID" value={individualID} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIndividualID(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="addressID">Address ID </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="addressID" type="text" placeholder="Address ID" value={addressID} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddressID(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="serviceProviderID">Service Provider ID </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="serviceProviderID" type="text" placeholder="Service Provider ID" value={serviceProviderID} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setServiceProviderID(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="primaryToken">Service Provider Token </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="primaryToken" type="text" placeholder="Primary Token" value={primaryToken} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPrimaryToken(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="beneficiaryID">Beneficiary ID </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="beneficiaryID" type="text" placeholder="Beneficiary ID" value={beneficiaryID} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setBeneficiaryID(event.target.value)} />
                </div>
                <div className="w-full">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="secondaryToken">Secondary Token </label>
                    <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="secondaryToken" type="text" placeholder="Secondary Token" value={secondaryToken} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSecondaryToken(event.target.value)} />
                </div>
            </div>
        </span>
    );
}

export default AddressComponent;
