import React, { useEffect, useState } from 'react';
import JWAddress, { EmbedMode, JWErrorBadRequest } from './components/jw-address';
import { useCookies } from 'react-cookie';

enum UserType {
    Unknown,
    Customer,
    SPEmployee,
    BNEmployee
}

const SPPage: React.FC = () => {
    const [cookies] = useCookies();

    const [userEmail, setUserEmail] = useState<string>("");
    const [userType, setUserType] = useState<UserType>(UserType.Unknown);
    const [userTypeName, setUserTypeName] = useState<string>("");

    const [jwHost, setJWHost] = useState<string>("");

    const [individualID, setIndividualID] = useState<string>("");
    const [addressID, setAddressID] = useState<string>("");

    const [serviceProviderID, setServiceProviderID] = useState("");
    const [primaryToken, setPrimaryToken] = useState<string>("");

    const [beneficiaryID, setBeneficiaryID] = useState<string>("");
    const [secondaryToken, setSecondaryToken] = useState<string>("");

    // const onError = (error: JWErrorAuthenticationRequired | JWErrorBadRequest) => {
    //     console.error(error);
    //     if (error instanceof JWErrorAuthenticationRequired) {
    //         // Unauthorized
    //         window.open(`${jwHost}/api/login`, "_blank");
    //     } else if (error instanceof JWErrorBadRequest) {

    //     } else {
    //         // Anything else
    //     }
    // }

    const onNewPrimaryToken = (token: string) => {
        setPrimaryToken(token);
    }

    const onNewSecondaryToken = (token: string) => {
        setSecondaryToken(token);
    }

    const onUpdate = () => {
        const hostport = jwHost
        const indID = individualID
        const addID = addressID
        const spID = serviceProviderID
        const pTkn = primaryToken
        const benID = beneficiaryID
        const sTkn = secondaryToken
        const dt = new Date().toISOString()

        setJWHost(dt)
        setIndividualID(dt)
        setAddressID(dt)
        setServiceProviderID(dt)
        setPrimaryToken(dt)
        setBeneficiaryID(dt)
        setSecondaryToken(dt)

        setJWHost(hostport)
        setIndividualID(indID)
        setAddressID(addID)
        setServiceProviderID(spID)
        setPrimaryToken(pTkn)
        setBeneficiaryID(benID)
        setSecondaryToken(sTkn)
    }

    useEffect(() => {
        const abortController: AbortController = new AbortController();
        fetch("/app/data", { signal: abortController.signal })
            .then((response) => response.json())
            .then((data) => {
                const hostport: string = data["hostport"] || "";
                const indID: string = data["individualID"] || "";
                const adrID: string = data["addressID"] || "";
                const spID: string = data["serviceProviderID"] || "";
                const pTkn: string = data["primaryToken"] || "";
                const benID: string = data["beneficiaryID"] || "";
                const sTkn: string = data["secondaryToken"] || "";

                if (hostport !== "") setJWHost(hostport);
                if (indID !== "") setIndividualID(indID);
                if (adrID !== "") setAddressID(adrID);
                if (spID !== "") setServiceProviderID(spID);
                if (pTkn !== "") setPrimaryToken(pTkn);
                if (benID !== "") setBeneficiaryID(benID);
                if (sTkn !== "") setSecondaryToken(sTkn);

            })
            .catch((error) => {
                console.error("Error fetching data:", error);
            });

        return () => {
            abortController.abort();
            console.log("aborted any pending fetch");
        };
    }, []);

    useEffect(() => {
        setUserEmail("");
        setUserType(UserType.Unknown);

        if (cookies["X-USER-EMAIL"] !== undefined) {
            setUserEmail(cookies["X-USER-EMAIL"]);
        }

        if (cookies["X-USER-TYPE"] !== undefined) {
            if (cookies["X-USER-TYPE"] === "INDIVIDUAL") {
                setUserType(UserType.Customer)
                setUserTypeName("Customer")
                return
            }
            if (cookies["X-USER-TYPE"] === "SERVICE_PROVIDER") {
                setUserType(UserType.SPEmployee)
                setUserTypeName("Service Provider Employee")
                setSecondaryToken("")
                setBeneficiaryID("")
                return
            }
            if (cookies["X-USER-TYPE"] === "BENEFICIARY") {
                setUserType(UserType.BNEmployee)
                setUserTypeName("Beneficiary Employee")
                setPrimaryToken("")
                setServiceProviderID("")
                return
            }
        }
    }, [cookies])

    return (
        <>
            <div className="mt-4">
                <header className="bg-blue-500 py-4 mb-6">
                    <div className="text-white text-center">
                        <div className="text-xl font-bold mb-2">ACME Banking Services</div>
                        <div className="text-sm font-bold mb-2">755 D'Amore Well, West Kiana, Pennsylvania, 37570-3998, 770-381-4152</div>
                    </div>
                </header>
                <main className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="grid gap-4">
                        <div className="bg-gray-100 p-4">
                            <h2 className="text-lg font-semibold mb-4 uppercase">Address</h2>
                            <JWAddress
                                embedAs={EmbedMode.SERVICE_PROVIDER}
                                hostPort={jwHost}
                                individualID={individualID}
                                addressID={addressID}
                                serviceProviderID={serviceProviderID}
                                primaryToken={primaryToken}
                                beneficiaryID={beneficiaryID}
                                secondaryToken={secondaryToken}
                                onNewPrimaryToken={onNewPrimaryToken}
                                onNewSecondaryToken={onNewSecondaryToken}
                            />
                        </div>
                        {userType == UserType.Customer ? (
                            <div className="">
                                <div className="bg-gray-200 p-4">
                                    <h2 className="text-lg font-semibold mb-4 uppercase">Output</h2>
                                    <div className="mb-0">
                                        <label htmlFor="primaryToken" className="text-xs uppercase font-semibold block mb-1">Address Key</label>
                                        <textarea
                                            id="primaryToken" className="text-sm font-light w-full px-3 py-2 border rounded-md" rows={4}
                                            value={primaryToken}
                                            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryToken(event.target.value)}></textarea>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>

                    <div className="grid gap-4">
                        <div className="bg-gray-200 p-4">
                            <h2 className="text-md font-semibold mb-4 uppercase">User Information</h2>
                            <div className="mb-2 text-sm uppercase font-normal">{userEmail}</div>
                            <div className="mb-0 text-sm uppercase font-normal">Type: {userTypeName}</div>
                        </div>

                        <div className="text-left bg-gray-200 p-4 hidden">
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={onUpdate}>Update</button>
                        </div>

                        <div className="bg-gray-200 p-4">
                            <div className="mb-0">
                                <label htmlFor="hostport" className="text-xs uppercase font-semibold block mb-1">JustWhere Host</label>
                                <input
                                    type="text" id="hostport" className="text-sm font-normal w-full px-3 py-2 border rounded-md"
                                    value={jwHost}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJWHost(event.target.value)}></input>
                            </div>
                        </div>

                        <div className="bg-gray-200 p-4">
                            <div className="mb-4">
                                <label className="text-md uppercase font-semibold block mb-1">Customer</label>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="individualID" className="text-xs uppercase font-semibold block mb-1">ID</label>
                                <input
                                    type="text" id="firstName" className="text-sm font-normal w-full px-3 py-2 border rounded-md"
                                    value={individualID}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIndividualID(event.target.value)}></input>
                            </div>
                            <div className="mb-0">
                                <label htmlFor="addressID" className="text-xs uppercase font-semibold block mb-1">Address</label>
                                <input
                                    type="text" id="addressID" className="text-sm font-normal w-full px-3 py-2 border rounded-md"
                                    value={addressID}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddressID(event.target.value)}
                                ></input>
                            </div>
                        </div>

                        <div className="bg-gray-200 p-4">
                            <div className="mb-4">
                                <label className="text-md uppercase font-semibold block mb-1">Service Provider</label>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="serviceProviderID" className="text-xs uppercase font-semibold block mb-1">ID</label>
                                <input
                                    type="text" id="serviceProviderID" className="text-sm font-normal w-full px-3 py-2 border rounded-md"
                                    value={serviceProviderID}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setServiceProviderID(event.target.value)}></input>
                            </div>
                            {userType == UserType.SPEmployee ? (
                                <div className="mb-0">
                                    <label htmlFor="primaryToken" className="text-xs uppercase font-semibold block mb-1">Address Key</label>
                                    <textarea
                                        id="primaryToken" className="text-sm font-light w-full px-3 py-2 border rounded-md" rows={4}
                                        value={primaryToken}
                                        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryToken(event.target.value)}></textarea>
                                </div>
                            ) : (
                                <></>
                            )
                            }
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default SPPage;
