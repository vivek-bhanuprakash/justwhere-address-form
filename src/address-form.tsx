import React, { Component, useState } from 'react';
import { Configuration, DefaultApi, SecondaryTokenInput, SecondaryTokenOutput } from './apis/tokens';
import { DefaultApi as apiIndividuals, AddressInput, AddressOutput } from './apis/individuals';

import { AxiosError, RawAxiosRequestConfig } from 'axios';


const MY_INDIVIDUAL_ID = "5bae1372-010f-4e2d-bbf7-51b925770223"
const MY_ADDRESS_ID = "ad277532-8424-4f7e-848b-6ba43164ebe6"
const MY_OWNER_TOKEN = "4e70926e9dded1647349209ae6b5c71b59390f7c7d03d10d900b05b5d42a91d1649267d96be901e01f3a664920af32bf98b1068b523693bf35bbc36a4309b649acac5dcc239f1e5a2bc51d87d3311fbe41a3371d21046d010e392127e219517a59889e9b7ef9f929ec1d8b5e90cfc978591a519cf8364419903e4b679190"
const DEFAULT_SERVICE_PROVIDER_ID = "1b8cef34-b25d-42cb-9a9e-5b2e9615dda7"
const DEFAULT_PRIMARY_TOKEN = "73c32a30773387882a7e124e02dd1a473bd878e24bd00946571f6d7277fe1b982a2246f7f1618b859916d8ea0bc0c54cd7ab5167a05182f201fcdc34b1fc9ac1e6cc238896562bd74208f64d116d1a69806ff96a04c5cbf936170caeac58a04a5aa9244ab56ef12645bfcd9effd589a28a4dfe5b727776f7d2fb39f31222"
const DEFAULT_BENEFICIARY_ID = "51837c98-c2f3-45a7-ad17-6dc8a5928e2b"
const DEFAULT_SECONDARY_TOKEN = ""

const AddressComponent: React.FC = () => {
    const [basePath, setBasePath] = useState<string>('http://localhost:3000');
    const [individualID, setIndividualID] = useState<string>(MY_INDIVIDUAL_ID);
    const [addressID, setAddressID] = useState<string>(MY_ADDRESS_ID);
    const [ownerToken, setOwnerToken] = useState<string>(MY_OWNER_TOKEN);

    const [serviceProviderID, setServiceProviderID] = useState(DEFAULT_SERVICE_PROVIDER_ID);
    const [primaryToken, setPrimaryToken] = useState<string>(DEFAULT_PRIMARY_TOKEN);

    const [beneficiaryID, setBeneficiaryID] = useState<string>(DEFAULT_BENEFICIARY_ID);
    const [secondaryToken, setSecondaryToken] = useState<string>(DEFAULT_SECONDARY_TOKEN);



    const fetchAddressForBeneficiary = async (addressID: string, id: string, token: string) => {
        const config: Configuration = new Configuration({
            basePath: `${basePath}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new apiIndividuals(config);
        try {
            const response = await api.getAddress(addressID, token, id);
            console.log(response.data);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                console.log("fetchAddressForBeneficiary: addressID ", addressID, ", beneficiaryID ", id, ", token ", token, " status ", err.response?.statusText)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${basePath}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
            } else {
                // Anything else
                console.log('Error', err.message);
            }
        }

    }

    const getAddressUsingSecondaryToken = async () => {
        const address = await fetchAddressForBeneficiary(addressID, beneficiaryID, secondaryToken)
        console.log("address using token: ", address);
    }

    const generateSecondaryToken = async () => {

        const input: SecondaryTokenInput = {
            serviceProviderID: DEFAULT_SERVICE_PROVIDER_ID,
            token: DEFAULT_PRIMARY_TOKEN,
            beneficiaryID: DEFAULT_BENEFICIARY_ID
        }

        const config: Configuration = new Configuration({
            basePath: `${basePath}/api`,
            baseOptions: {
                withCredentials: true
            }
        })

        const api = new DefaultApi(config);

        try {
            const response = await api.createSecondaryToken(input);
            const token = response.data.token || "";
            console.log("secondaryToken: ", token);
            setSecondaryToken(token);
        } catch (e) {
            const err = e as AxiosError;
            if (err.response) {
                // The client was given an error response (5xx, 4xx)
                if (err.response.status === 401) {
                    // Unauthorized
                    window.open(`${basePath}/api/login`, "_blank");
                }
            } else if (err.request) {
                // The client never received a response, and the request was never left
            } else {
                // Anything else
                console.log('Error', err.message);
            }
        }

    };

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50 py-6 sm:py-12">
            <form className="mx-5 my-5 w-full max-w-lg">
                <div className="flex flex-wrap gap-3">
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="address-label">Label </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="address-label" type="text" placeholder="Home" />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="addressee"> Name </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="addressee" type="text" placeholder="Mr. John Smith" />
                    </div>
                    <div className="flex w-full gap-3">
                        <div className="w-1/3">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="city"> City </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="city" type="text" placeholder="Albuquerque" />
                        </div>
                        <div className="w-1/3">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="state"> State </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="state" type="text" placeholder="New Mexico" />
                        </div>
                        <div className="w-1/3">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="zip"> Zip </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="zip" type="text" placeholder="90210" />
                        </div>
                    </div>
                    <div className="flex w-full gap-3">
                        <div className="w-1/2">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="phone">Phone</label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="phone" type="text" placeholder="+1 (234) 555-1234" />
                        </div>
                        <div className="w-1/2">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="email"> Email </label>
                            <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:border-gray-500 focus:bg-white focus:outline-none" id="email" type="text" placeholder="email@domain.com" />
                        </div>
                    </div>
                    <div className="flex w-full items-center justify-end gap-3">
                        <button id="btnGenSecondaryToken" onClick={generateSecondaryToken} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Gen Sec Tkn</button>
                        <button id="btnGetAddressUsingSecondaryToken" onClick={getAddressUsingSecondaryToken} className="focus:shadow-outline rounded bg-orange-400 px-4 py-2 font-normal text-white hover:bg-orange-600 focus:outline-none" type="button">Get Adr Sec Tkn</button>
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="jwHost">JustWhere Host</label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="jwHost" type="text" placeholder="JustWhere Host" value={basePath} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="individualID">Individual ID </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="individualID" type="text" placeholder="Individual ID" value={individualID} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="addressID">Address ID </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="addressID" type="text" placeholder="Address ID" value={addressID} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="serviceProviderID">Service Provider ID </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="serviceProviderID" type="text" placeholder="Service Provider ID" value={serviceProviderID} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="primaryToken">Service Provider Token </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="primaryToken" type="text" placeholder="Primary Token" value={primaryToken} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="beneficiaryID">Beneficiary ID </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="beneficiaryID" type="text" placeholder="Beneficiary ID" value={beneficiaryID} />
                    </div>
                    <div className="w-full">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700" htmlFor="secondaryToken">Secondary Token </label>
                        <input className="block w-full appearance-none rounded border border-gray-200 bg-gray-200 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none" id="secondaryToken" type="text" placeholder="Secondary Token" value={secondaryToken} />
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AddressComponent;
