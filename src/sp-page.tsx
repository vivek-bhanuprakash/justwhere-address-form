import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import JWAddressFormBeneficiaryEmployee from "./components/jw-address-form-ben-employee";
import JWContentFormServiceProviderEmployee from "./components/jw-address-form-sp-employee";
import JWContentFormServiceProviderCustomer from "./components/jw-content-form-sp-customer";
import {
  OnContentSharedWithBeneficiary,
  OnContentSharedWithServiceProvider,
  OnContentUnsharedWithBeneficiary,
  OnContentUnsharedWithServiceProvider
} from "./components/types";
import {
  AddressID,
  BeneficiaryID,
  IndividualID,
  JWError,
  JWErrorAuthenticationRequired,
  PrimaryToken,
  SecondaryToken,
  SecureContentID,
  ServiceProviderID
} from "./util";

enum UserType {
  Unknown,
  Customer,
  SPEmployee,
  BNEmployee,
}

interface Data {
  HostPort: string;
  IndividualID: string;
  ContentID: string;
  ContentType: string;
  ServiceProviderID: string;
  PrimaryToken: string;
  BeneficiaryID: string;
  SecondaryToken: string;
  PreferredBeneficiaries: string;
  PreferredContentTypes: string;
}

const TOKEN_STORAGE_KEY: string = "JWAUTH";

const SPPage: React.FC = () => {
  const [cookies] = useCookies();

  const [userEmail, setUserEmail] = useState<string>("");
  const [userType, setUserType] = useState<UserType>(UserType.Unknown);
  const [userTypeName, setUserTypeName] = useState<string>("");

  const [jwHost, setJWHost] = useState<string>("");
  const [authToken, setAuthToken] = useState<string>("");

  const [activeHP, setActiveHP] = React.useState("");
  const [hps, setHPs] = React.useState<Record<string, Data>>({});

  const [individualID, setIndividualID] = useState<IndividualID>("");
  const [contentID, setContentID] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");

  const [serviceProviderID, setServiceProviderID] = useState<ServiceProviderID>("");
  const [primaryToken, setPrimaryToken] = useState<PrimaryToken>("");

  const [beneficiaryID, setBeneficiaryID] = useState<BeneficiaryID>("");
  const [secondaryToken, setSecondaryToken] = useState<SecondaryToken>("");

  const [preferredBeneficiaries, setPreferredBeneficiaries] = useState<BeneficiaryID[]>([]);
  const [preferredBeneficiariesString, setPreferredBeneficiariesString] = useState<string>("");

  const [preferredContentTypes, setPreferredContentTypes] = useState<string[]>([]);
  const [preferredContentTypesString, setPreferredContentTypesString] = useState<string>("");

  const onError = (error: JWError) => {
    if (jwHost === undefined || jwHost.trim().length === 0) {
      console.debug("App: waiting for JW host to be set");
      return;
    }
    if (error instanceof JWErrorAuthenticationRequired) {
      console.debug("App: JustWhere authentication required");
      window.open(`${jwHost}/api/login`, "_top");
      return;
    }
  };

  const setActiveData = (d: Data) => {
    console.debug("App: setting active data:", d);
    setJWHost(d.HostPort);
    setIndividualID(d.IndividualID);
    setContentID(d.ContentID);
    setContentType(d.ContentType);
    setServiceProviderID(d.ServiceProviderID);
    setPrimaryToken(d.PrimaryToken);
    setBeneficiaryID(d.BeneficiaryID);
    setSecondaryToken(d.SecondaryToken);

    /* convert preferred beneficiaries string to array */
    const pbs = d.PreferredBeneficiaries?.trim() || "";
    setPreferredBeneficiariesString(pbs);
    const preferredBeneficiaries = pbs.split(",").map((s) => s.trim());
    setPreferredBeneficiaries(preferredBeneficiaries);

    /* convert preferred beneficiaries string to array */
    const pcts = d.PreferredContentTypes?.trim() || "";
    setPreferredContentTypesString(pcts);
    const preferredContentTypes = pcts.split(",").map((s) => s.trim());
    setPreferredContentTypes(preferredContentTypes);
  };

  const hpChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const d: Data = {
      ...hps[event.target.value],
      HostPort: event.target.value,
    };

    setActiveHP(d.HostPort);
    setActiveData(d);
  };

  const onContentSharedWithServiceProvider: OnContentSharedWithServiceProvider = (
    contentType: string,
    individualID: IndividualID,
    contentID: AddressID | SecureContentID,
    serviceProviderID: ServiceProviderID,
    token: PrimaryToken,
  ) => {
    setIndividualID(individualID);
    setContentID(contentID);
    setContentType(contentType);
    setServiceProviderID(serviceProviderID);
    setPrimaryToken(token);
  };

  const onContentUnsharedWithServiceProvider: OnContentUnsharedWithServiceProvider = (
    contentType: string,
    individualID: IndividualID,
    contentID: AddressID | SecureContentID,
    serviceProviderID: ServiceProviderID,
  ) => {
    setIndividualID(individualID);
    setContentID("");
    setContentType("");
    setServiceProviderID(serviceProviderID);
    setPrimaryToken("");
    setSecondaryToken("");
  };

  const onContentSharedWithBeneficiary: OnContentSharedWithBeneficiary = (
    contentType: string,
    individualID: IndividualID,
    contentID: AddressID | SecureContentID,
    serviceProviderID: ServiceProviderID,
    primaryToken: PrimaryToken,
    beneficiaryID: BeneficiaryID,
    secondaryToken: SecondaryToken,
  ) => {
    setIndividualID(individualID);
    setContentID(contentID);
    setContentType(contentType);
    setServiceProviderID(serviceProviderID);
    setPrimaryToken(primaryToken);
    setBeneficiaryID(beneficiaryID);
    setSecondaryToken(secondaryToken);
  };

  const onContentUnsharedWithBeneficiary: OnContentUnsharedWithBeneficiary = (
    contentType: string,
    individualID: IndividualID,
    contentID: AddressID | SecureContentID,
    serviceProviderID: ServiceProviderID,
    beneficiaryID: BeneficiaryID,
  ) => {
    setIndividualID(individualID);
    setContentID("");
    setContentType("");
    setServiceProviderID(serviceProviderID);
    setBeneficiaryID(beneficiaryID);
    setSecondaryToken("");
  };

  const onUpdate = () => {
    const hostport = jwHost;
    const indID = individualID;
    const contID = contentID;
    const contType = contentType;
    const spID = serviceProviderID;
    const pTkn = primaryToken;
    const benID = beneficiaryID;
    const sTkn = secondaryToken;
    const prefBenIDs = preferredBeneficiaries;
    const prefBenIDsString = preferredBeneficiariesString;
    const prefContentTypes = preferredContentTypes;
    const prefContentTypesString = preferredContentTypesString;
    const dt = new Date().toISOString();

    setJWHost(dt);
    setIndividualID(dt);
    setContentID(dt);
    setContentType(dt);
    setServiceProviderID(dt);
    setPrimaryToken(dt);
    setBeneficiaryID(dt);
    setSecondaryToken(dt);
    setPreferredBeneficiaries([dt]);
    setPreferredBeneficiariesString(dt);
    setPreferredContentTypes([dt]);
    setPreferredContentTypesString(dt);

    setJWHost(hostport);
    setIndividualID(indID);
    setContentID(contID);
    setContentType(contType);
    setServiceProviderID(spID);
    setPrimaryToken(pTkn);
    setBeneficiaryID(benID);
    setSecondaryToken(sTkn);
    setPreferredBeneficiaries(prefBenIDs);
    setPreferredBeneficiariesString(prefBenIDsString);
    setPreferredContentTypes(prefContentTypes);
    setPreferredContentTypesString(prefContentTypesString);
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
              ContentID: data[hostPort]["contentID"],
              ContentType: data[hostPort]["contentType"],
              ServiceProviderID: data[hostPort]["serviceProviderID"],
              PrimaryToken: data[hostPort]["primaryToken"],
              BeneficiaryID: data[hostPort]["beneficiaryID"],
              SecondaryToken: data[hostPort]["secondaryToken"],
              PreferredBeneficiaries: data[hostPort]["preferredBeneficiaries"],
              PreferredContentTypes: data[hostPort]["preferredContentTypes"],
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
    let token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
    if (token !== "") {
      token = token.split("Bearer ")[1];
      console.debug("token:", token.substring(0, 5) + "..." + token.substring(token.length - 5));
      setAuthToken(token);
    }

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
        setPreferredBeneficiaries([]);
        setPreferredContentTypes([]);
        return;
      }
      if (cookies["X-USER-TYPE"] === "BENEFICIARY") {
        setUserType(UserType.BNEmployee);
        setUserTypeName("Beneficiary Employee");
        setPrimaryToken("");
        setServiceProviderID("");
        setPreferredBeneficiaries([]);
        setPreferredContentTypes([]);
        return;
      }
    }
  }, [cookies]);

  return (
    <>
      <div className="mt-4">
        <header className="mb-6 bg-blue-500 py-4">
          <div className="text-center text-white">
            <div className="mb-2 text-xl font-bold">ACME Banking Services</div>
            <div className="mb-2 text-sm font-bold">755 D'Amore Well, West Kiana, Pennsylvania, 37570-3998, 770-381-4152</div>
          </div>
        </header>
        <main className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="bg-gray-100 p-2">
              {userType === UserType.Customer && jwHost !== undefined && jwHost.trim().length > 0 ? (
                <JWContentFormServiceProviderCustomer
                  hostPort={jwHost}
                  authToken={authToken}
                  contentTypeFilter={preferredContentTypes}
                  contentID={contentID}
                  contentType={contentType}
                  serviceProviderID={serviceProviderID}
                  beneficiaryIDs={preferredBeneficiaries}
                  onError={onError}
                  onContentSharedWithServiceProvider={onContentSharedWithServiceProvider}
                  onContentUnsharedWithServiceProvider={onContentUnsharedWithServiceProvider}
                  onContentSharedWithBeneficiary={onContentSharedWithBeneficiary}
                  onContentUnsharedWithBeneficiary={onContentUnsharedWithBeneficiary}
                />
              ) : (
                <></>
              )}
              {userType === UserType.SPEmployee && jwHost !== undefined && jwHost.trim().length > 0 ? (
                <JWContentFormServiceProviderEmployee
                  hostPort={jwHost}
                  authToken={authToken}
                  individualID={individualID}
                  serviceProviderID={serviceProviderID}
                  contentTypeFilter={preferredContentTypes}
                  onError={onError}
                />
              ) : (
                <></>
              )}
              {userType === UserType.BNEmployee && jwHost !== undefined && jwHost.trim().length > 0 ? (
                <JWAddressFormBeneficiaryEmployee
                  hostPort={jwHost}
                  authToken={authToken}
                  individualID={individualID}
                  addressID={contentID}
                  beneficiaryID={beneficiaryID}
                  secondaryToken={secondaryToken}
                  onError={onError}
                />
              ) : (
                <></>
              )}
            </div>
            {userType === UserType.Customer ? (
              <div className="">
                <div className="bg-gray-200 p-4">
                  <h2 className="mb-4 text-lg font-semibold uppercase">Output</h2>
                  <div className="mb-0">
                    <label htmlFor="primaryToken" className="mb-1 block text-xs font-semibold uppercase">
                      Service Content Key
                    </label>
                    <textarea
                      id="primaryToken"
                      className="w-full rounded-md border px-3 py-2 text-sm font-light"
                      rows={4}
                      value={primaryToken}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryToken(event.target.value)}
                    ></textarea>
                  </div>
                  <div className="mt-5">
                    <label htmlFor="secondaryToken" className="mb-1 block text-xs font-semibold uppercase">
                      Beneficiary Content Key
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
              <></>
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
                  id="hostport"
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
                  id="individualID"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={individualID}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setIndividualID(event.target.value)}
                ></input>
              </div>
              {/*
              <div className="mb-4">
                <label htmlFor="contentID" className="mb-1 block text-xs font-semibold uppercase">
                  Content ID
                </label>
                <input
                  type="text"
                  id="contentID"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={contentID}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContentID(event.target.value)}
                ></input>
              </div>
              <div className="mb-0">
                <label htmlFor="contentType" className="mb-1 block text-xs font-semibold uppercase">
                  Content Type
                </label>
                <input
                  type="text"
                  id="contentType"
                  className="w-full rounded-md border px-3 py-2 text-sm font-normal"
                  value={contentType}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setContentType(event.target.value)}
                ></input>
              </div>

               */}
            </div>

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
              {userType === UserType.Customer ? (
                <>
                  <div className="mb-4">
                    <label htmlFor="preferredContentTypes" className="mb-1 block text-xs font-semibold uppercase">
                      Preferred Content Types
                    </label>
                    <textarea
                      id="preferredContentTypes"
                      className="w-full rounded-md border px-3 py-2 text-sm font-light"
                      rows={4}
                      value={preferredContentTypesString}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                        /* convert preferred beneficiaries string to array */
                        const preferredContentTypesString = event.target.value;
                        setPreferredContentTypesString(preferredContentTypesString);
                        const preferredContentTypes = preferredContentTypesString.split(",").map((s) => s.trim());
                        setPreferredContentTypes(preferredContentTypes);
                      }}
                    ></textarea>
                  </div>
                  <div className="mb-0">
                    <label htmlFor="preferredBeneficiaries" className="mb-1 block text-xs font-semibold uppercase">
                      Preferred Beneficiaries
                    </label>
                    <textarea
                      id="preferredBeneficiaries"
                      className="w-full rounded-md border px-3 py-2 text-sm font-light"
                      rows={4}
                      value={preferredBeneficiariesString}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                        /* convert preferred beneficiaries string to array */
                        const preferredBeneficiariesString = event.target.value;
                        setPreferredBeneficiariesString(preferredBeneficiariesString);
                        const preferredBeneficiaries = preferredBeneficiariesString.split(",").map((s) => s.trim());
                        setPreferredBeneficiaries(preferredBeneficiaries);
                      }}
                    ></textarea>
                  </div>
                </>
              ) : (
                <></>
              )}
              {userType === UserType.SPEmployee ? (
                // <div className="mb-0">
                //   <label htmlFor="primaryToken" className="mb-1 block text-xs font-semibold uppercase">
                //     Content Key
                //   </label>
                //   <textarea
                //     id="primaryToken"
                //     className="w-full rounded-md border px-3 py-2 text-sm font-light"
                //     rows={4}
                //     value={primaryToken}
                //     onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrimaryToken(event.target.value)}
                //   ></textarea>
                // </div>
                <div className="mb-0">
                  <div className="mb-4">
                    <label htmlFor="preferredContentTypes" className="mb-1 block text-xs font-semibold uppercase">
                      Preferred Content Types
                    </label>
                    <textarea
                      id="preferredContentTypes"
                      className="w-full rounded-md border px-3 py-2 text-sm font-light"
                      rows={4}
                      value={preferredContentTypesString}
                      onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                        /* convert preferred beneficiaries string to array */
                        const preferredContentTypesString = event.target.value;
                        setPreferredContentTypesString(preferredContentTypesString);
                        const preferredContentTypes = preferredContentTypesString.split(",").map((s) => s.trim());
                        setPreferredContentTypes(preferredContentTypes);
                      }}
                    ></textarea>
                  </div>
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

export default SPPage;
