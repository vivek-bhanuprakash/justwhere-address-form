import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import JWAddress, { EmbedMode } from "./components/jw-address";
import { JWErrorAuthenticationRequired, JWErrorBadRequest } from "./components/jw-address-form";

enum UserType {
  Unknown,
  Customer,
  SPEmployee,
  BNEmployee,
}

interface Data {
  HostPort: string;
  IndividualID: string;
  AddressID: string;
  ServiceProviderID: string;
  PrimaryToken: string;
  BeneficiaryID: string;
  SecondaryToken: string;
}

const BenPage: React.FC = () => {
  const [cookies] = useCookies();

  const [userEmail, setUserEmail] = useState<string>("");
  const [userType, setUserType] = useState<UserType>(UserType.Unknown);
  const [userTypeName, setUserTypeName] = useState<string>("");

  const [jwHost, setJWHost] = useState<string>("");

  const [activeHP, setActiveHP] = React.useState("");
  const [hps, setHPs] = React.useState<Record<string, Data>>({});

  const [individualID, setIndividualID] = useState<string>("");
  const [addressID, setAddressID] = useState<string>("");

  const [serviceProviderID, setServiceProviderID] = useState("");
  const [primaryToken, setPrimaryToken] = useState<string>("");

  const [beneficiaryID, setBeneficiaryID] = useState<string>("");
  const [secondaryToken, setSecondaryToken] = useState<string>("");

  // const onError = (error: JWErrorAuthenticationRequired | JWErrorBadRequest) => {
  //   console.error(error);
  //   if (error instanceof JWErrorAuthenticationRequired) {
  //     // Unauthorized
  //     window.open(`${jwHost}/api/login`, "_blank");
  //   } else if (error instanceof JWErrorBadRequest) {
  //   } else {
  //     // Anything else
  //   }
  // };

  const setActiveData = (d: Data) => {
    setJWHost(d.HostPort);
    setIndividualID(d.IndividualID);
    setAddressID(d.AddressID);
    setServiceProviderID(d.ServiceProviderID);
    setPrimaryToken(d.PrimaryToken);
    setBeneficiaryID(d.BeneficiaryID);
    setSecondaryToken(d.SecondaryToken);
  };

  const hpChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const d: Data = {
      ...hps[event.target.value],
      HostPort: event.target.value,
    };

    setActiveHP(d.HostPort);
    setActiveData(d);
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
        if (data !== undefined) {
          const m: Record<string, Data> = {} as Record<string, Data>;
          Object.keys(data).map((hostPort: string) => {
            const d: Data = {
              HostPort: hostPort,
              IndividualID: data[hostPort]["individualID"],
              AddressID: data[hostPort]["addressID"],
              ServiceProviderID: data[hostPort]["serviceProviderID"],
              PrimaryToken: data[hostPort]["primaryToken"],
              BeneficiaryID: data[hostPort]["beneficiaryID"],
              SecondaryToken: data[hostPort]["secondaryToken"],
            };
            m[hostPort] = d;
          });
          setHPs(m);
          setActiveHP(Object.keys(data).at(0) || "");
        }
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
    if (activeHP === undefined || activeHP.trim().length === 0) return;

    if (hps === undefined || Object.keys(hps).length === 0) return;

    const d: Data = hps[activeHP];
    setActiveData(d);
  }, [activeHP, hps]);

  useEffect(() => {
    setUserEmail("");
    setUserType(UserType.Unknown);

    if (cookies["X-USER-EMAIL"] !== undefined && cookies["X-USER-TYPE"] !== undefined) {
      setUserEmail(cookies["X-USER-EMAIL"]);

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
      <div className="mt-4">
        <header className="mb-6 bg-green-900 py-4">
          <div className="text-center text-white">
            <div className="mb-2 text-xl font-bold">Rapid Delivery Services</div>
            <div className="mb-2 text-sm font-bold">274 Schultz Gardens, New Greggstad, Virginia - 90292, +1-480-644-6193</div>
          </div>
        </header>
        <main className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="bg-gray-100 p-2">
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
            {userType === UserType.Customer ? (
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
              {userType !== UserType.Unknown ? (
                <>
                  <h2 className="text-md mb-4 font-semibold uppercase">User Information</h2>
                  <div className="mb-2 text-sm font-normal uppercase">{userEmail}</div>
                  <div className="mb-0 text-sm font-normal uppercase">Type: {userTypeName}</div>
                </>
              ) : (
                <>
                  <a href="/app/login" className="text-md font-medium uppercase text-blue-500 underline">
                    Login
                  </a>
                </>
              )}
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
                <select
                  className="block w-full rounded-md border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={activeHP}
                  onChange={hpChanged}
                >
                  {Object.keys(hps).map((hp) => (
                    <option value={hp}>{hp}</option>
                  ))}
                </select>
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

            {userType === UserType.Customer ? (
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
              {userType === UserType.BNEmployee ? (
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
