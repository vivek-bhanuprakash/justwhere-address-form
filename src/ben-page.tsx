import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import JWAddress, { JWErrorAuthenticationRequired, JWErrorBadRequest } from "./components/jw-address-form";

enum UserType {
  Unknown,
  Customer,
  SPEmployee,
  BNEmployee,
}

const BenPage: React.FC = () => {
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

  const onError = (error: JWErrorAuthenticationRequired | JWErrorBadRequest) => {
    console.error(error);
    if (error instanceof JWErrorAuthenticationRequired) {
      // Unauthorized
      window.open(`${jwHost}/api/login`, "_blank");
    } else if (error instanceof JWErrorBadRequest) {
    } else {
      // Anything else
    }
  };

  const onNewPrimaryToken = (token: string) => {
    setPrimaryToken(token);
  };

  const onNewSecondaryToken = (token: string) => {
    setSecondaryToken(token);
  };

  const onUpdate = () => {
    const hostport = jwHost;
    const indID = individualID;
    const addID = addressID;
    const spID = serviceProviderID;
    const pTkn = primaryToken;
    const benID = beneficiaryID;
    const sTkn = secondaryToken;
    const dt = new Date().toISOString();

    setJWHost(dt);
    setIndividualID(dt);
    setAddressID(dt);
    setServiceProviderID(dt);
    setPrimaryToken(dt);
    setBeneficiaryID(dt);
    setSecondaryToken(dt);

    setJWHost(hostport);
    setIndividualID(indID);
    setAddressID(addID);
    setServiceProviderID(spID);
    setPrimaryToken(pTkn);
    setBeneficiaryID(benID);
    setSecondaryToken(sTkn);
  };

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
        setUserType(UserType.Customer);
        setUserTypeName("Customer");
        return;
      }
      if (cookies["X-USER-TYPE"] === "SERVICE_PROVIDER") {
        setUserType(UserType.SPEmployee);
        setUserTypeName("Service Provider Employee");
        setSecondaryToken("");
        setBeneficiaryID("");
        return;
      }
      if (cookies["X-USER-TYPE"] === "BENEFICIARY") {
        setUserType(UserType.BNEmployee);
        setUserTypeName("Beneficiary Employee");
        setPrimaryToken("");
        setServiceProviderID("");
        return;
      }
    }
  }, [cookies]);

  return (
    <>
      <div className="mt-4 max-h-screen">
        <header className="mb-6 bg-green-900 py-4">
          <div className="text-center text-white">
            <div className="mb-2 text-xl font-bold">Rapid Delivery Services</div>
            <div className="mb-2 text-sm font-bold">274 Schultz Gardens, New Greggstad, Virginia - 90292, +1-480-644-6193</div>
          </div>
        </header>
        <main className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="bg-gray-100 p-4">
              <JWAddress
                hostPort={jwHost}
                individualID={individualID}
                addressID={addressID}
                serviceProviderID={serviceProviderID}
                primaryToken={primaryToken}
                beneficiaryID={beneficiaryID}
                secondaryToken={secondaryToken}
                onNewPrimaryToken={onNewPrimaryToken}
                onNewSecondaryToken={onNewSecondaryToken}
                onError={onError}
              />
            </div>
            {userType == UserType.Customer ? (
              <div className="">
                <div className="bg-gray-200 p-4">
                  <h2 className="mb-4 text-lg font-semibold uppercase">Output</h2>
                  <div className="mb-0">
                    <label htmlFor="secondaryToken" className="mb-1 block text-xs font-semibold uppercase">
                      Address Key
                    </label>
                    <textarea
                      id="secondaryToken"
                      className="w-full rounded-md border px-3 py-2 text-sm font-light"
                      rows={4}
                      value={secondaryToken}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setSecondaryToken(event.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="bg-gray-200 p-4">
              <h2 className="text-md mb-4 font-semibold uppercase">User Information</h2>
              <div className="mb-2 text-sm font-normal uppercase">{userEmail}</div>
              <div className="mb-0 text-sm font-normal uppercase">Type: {userTypeName}</div>
            </div>

            <div className="hidden bg-gray-200 p-4 text-left">
              <button className="rounded-md bg-blue-500 px-4 py-2 text-white" onClick={onUpdate}>
                Update
              </button>
            </div>

            <div className="bg-gray-200 p-4">
              <div className="mb-0">
                <label htmlFor="hostport" className="mb-1 block text-xs font-semibold uppercase">
                  JustWhere Host
                </label>
                <input
                  type="text"
                  id="hostport"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={jwHost}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setJWHost(event.target.value)}
                ></input>
              </div>
            </div>

            <div className="bg-gray-200 p-4">
              <div className="mb-4">
                <label className="text-md mb-1 block font-semibold uppercase">Customer</label>
              </div>
              <div className="mb-4">
                <label htmlFor="individualID" className="mb-1 block text-xs font-semibold uppercase">
                  ID
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={individualID}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIndividualID(event.target.value)}
                ></input>
              </div>
              <div className="mb-0">
                <label htmlFor="addressID" className="mb-1 block text-xs font-semibold uppercase">
                  Address
                </label>
                <input
                  type="text"
                  id="addressID"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={addressID}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setAddressID(event.target.value)}
                ></input>
              </div>
            </div>

            {userType == UserType.Customer ? (
              <div className="bg-gray-200 p-4">
                <div className="mb-4">
                  <label className="text-md mb-1 block font-semibold uppercase">Service Provider</label>
                </div>
                <div className="mb-4">
                  <label htmlFor="serviceProviderID" className="mb-1 block text-xs font-semibold uppercase">
                    ID
                  </label>
                  <input
                    type="text"
                    id="serviceProviderID"
                    className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                    value={serviceProviderID}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setServiceProviderID(event.target.value)}
                  ></input>
                </div>

                <div className="mb-0">
                  <label htmlFor="primaryToken" className="mb-1 block text-xs font-semibold uppercase">
                    Address Key
                  </label>
                  <textarea
                    id="primaryToken"
                    className="w-full rounded-md border px-3 py-2 text-sm font-light"
                    rows={4}
                    value={primaryToken}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryToken(event.target.value)}
                  ></textarea>
                </div>
              </div>
            ) : (
              <></>
            )}
            <div className="bg-gray-200 p-4">
              <div className="mb-4">
                <label className="text-md mb-1 block font-semibold uppercase">Beneficiary</label>
              </div>
              <div className="mb-4">
                <label htmlFor="beneficiaryID" className="mb-1 block text-xs font-semibold uppercase">
                  ID
                </label>
                <input
                  type="text"
                  id="beneficiaryID"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={beneficiaryID}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setBeneficiaryID(event.target.value)}
                ></input>
              </div>
              {userType == UserType.BNEmployee ? (
                <div className="mb-0">
                  <label htmlFor="secondaryToken" className="mb-1 block text-xs font-semibold uppercase">
                    Address Key
                  </label>
                  <textarea
                    id="secondaryToken"
                    className="w-full rounded-md border px-3 py-2 text-sm font-light"
                    rows={4}
                    value={secondaryToken}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setSecondaryToken(event.target.value)}
                  ></textarea>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BenPage;
