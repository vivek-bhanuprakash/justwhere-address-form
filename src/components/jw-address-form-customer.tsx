import React, { useEffect, useRef, useState } from "react";
import {
  Address,
  AddressID,
  Beneficiary,
  BeneficiaryID,
  BeneficiarySharesRequest,
  CurrentUserInfoRequest,
  DisablePrimaryToken,
  DisablePrimaryTokenRequest,
  DisableSecondaryToken,
  DisableSecondaryTokenRequest,
  GenereratePrimaryToken,
  GenererateSecondaryToken,
  GetCurrentUserInfo,
  GetOwnerAddresses,
  GetSharesWithBeneficiary,
  GetSharesWithServiceProvider,
  IndividualID,
  IsValidURL,
  JWError,
  OwnerAddressesRequest,
  PrimaryToken,
  PrimaryTokenRequest,
  PrimaryTokenResponse,
  SecondaryToken,
  SecondaryTokenRequest,
  ServiceProvider,
  ServiceProviderID,
  ServiceProviderSharesRequest
} from "../util";
import { GetBeneficiaryInfo, GetServiceProviderInfo, ServiceProviderInfoRequest } from "../util/providers/providers";
import { OnErrorFcn, OnNewPrimaryToken, OnNewSecondaryToken } from "./types";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = (props: InputProps) => {
  return (
    <input
      type="text"
      className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      {...props}
    />
  );
};

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
const Label: React.FC<LabelProps> = (props: LabelProps) => {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-900" {...props}>
      {props.children}
    </label>
  );
};

export interface UserInfo {
  userID: string;
  individualID: string;
}

export interface AddressProps {
  hostPort: string;
  authToken: string;
  addressID?: AddressID;
  serviceProviderID?: ServiceProviderID;
  primaryToken?: PrimaryToken;
  beneficiaryID?: BeneficiaryID;
  beneficiaryIDs?: BeneficiaryID[];
  onError?: OnErrorFcn;
  onNewPrimaryToken?: OnNewPrimaryToken;
  onNewSecondaryToken?: OnNewSecondaryToken;
}

const JWAddressFormCustomer: React.FC<AddressProps> = ({
  hostPort,
  authToken,
  addressID,
  serviceProviderID,
  primaryToken,
  beneficiaryID,
  beneficiaryIDs,
  onError,
  onNewPrimaryToken,
  onNewSecondaryToken,
}) => {
  const [internalIndividualID, setInternalIndividualID] = useState<IndividualID>("");
  const [internalAddressID, setInternalAddressID] = useState<AddressID>("");
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "" });
  const [myAddresses, setMyAddresses] = useState<Record<AddressID, Address>>({});
  const [address, setAddress] = useState<Address>();

  const [showGenPrimaryToken, setShowGenPrimaryToken] = useState<boolean>(false);
  const [showGenSecondaryToken, setShowGenSecondaryToken] = useState<boolean>(false);
  const [showUnsharePrimaryToken, setShowUnsharePrimaryToken] = useState<boolean>(false);
  const [showUnshareSecondaryToken, setShowUnshareSecondaryToken] = useState<boolean>(false);

  const [sharedWithServiceProvider, setSharedWithServiceProvider] = useState<boolean>(false);
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>();
  const [reprocessOne, setReprocessOne] = useState<boolean>(false);

  const [sharedWithBeneficiary, setSharedWithBeneficiary] = useState<boolean>(false);
  const [beneficiaries, setBeneficiaries] = useState<Record<BeneficiaryID, Beneficiary>>({});
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary>();
  const [reprocessTwo, setReprocessTwo] = useState<boolean>(false);

  const internalPrimaryToken = useRef<PrimaryToken>("");
  const internalSecondaryTokens = useRef<SecondaryToken[]>([]);

  const raiseError = (err: JWError) => {
    if (onError === undefined || typeof onError !== "function") {
      console.warn("JustWhere: onError function is not provided or not a function");
      return;
    }
    try {
      onError(err);
    } catch (e) {
      console.error("JustWhere: error in onError callback: ", e);
    }
  };

  const onSelectedMyAddressChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAddress(myAddresses[event.target.value]);
  };

  const onSelectedBeneficiaryChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBeneficiary(beneficiaries[event.target.value]);
  };

  const onGenerateSecondaryToken = async () => {
    try {
      if (onNewSecondaryToken === undefined || typeof onNewSecondaryToken !== "function") {
        console.warn("JustWhere: onNewSecondaryToken function is not provided or is not a function. no token will be generated.");
        return raiseError(new JWError("onNewSecondaryToken callback not provided. no token will be generated"));
      }

      setReprocessTwo(false);
      const request: SecondaryTokenRequest = {
        hostPort,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        token: internalPrimaryToken.current || "",
      };

      const response = await GenererateSecondaryToken(request);
      setReprocessTwo(true);
      try {
        onNewSecondaryToken(internalIndividualID || "", address?.ID || "", request.serviceProviderID, request.token, request.beneficiaryID, response.token);
      } catch (e) {
        console.error("JustWhere: onNewSecondaryToken callback function threw an error: ", e);
        return raiseError(new JWError((e as Error).message));
      }
    } catch (e) {
      console.error("JustWhere: error generating secondary token: ", e);
      return raiseError(e as JWError);
    }
  };

  const onGeneratePrimaryToken = async () => {
    try {
      if (onNewPrimaryToken === undefined || typeof onNewPrimaryToken !== "function") {
        console.warn("JustWhere: onNewPrimaryToken callback function is not provided or is not a function. no token will be generated.");
        return raiseError(new JWError("onNewPrimaryToken callback not provided. no token will be generated"));
      }

      const request: PrimaryTokenRequest = {
        hostPort: hostPort,
        individualID: internalIndividualID || "",
        addressID: address?.ID || "",
        serviceProviderID: serviceProviderID || "",
      };

      const response: PrimaryTokenResponse = await GenereratePrimaryToken(request);
      try {
        onNewPrimaryToken(request.individualID, request.addressID, request.serviceProviderID, response.token);
      } catch (e) {
        console.error("JustWhere: onNewPrimaryToken callback function threw an error: ", e);
        return raiseError(new JWError((e as Error).message));
      }
    } catch (e) {
      console.error("JustWhere: error generating primary token: ", e);
      return raiseError(e as JWError);
    }
  };

  const onUnshareAddressWithServiceProvider = async () => {
    try {
      if (sharedWithServiceProvider === false) return;
      setReprocessOne(false);

      const request: DisablePrimaryTokenRequest = {
        hostPort: hostPort,
        individualID: internalIndividualID || "",
        addressID: address?.ID || "",
        serviceProviderID: serviceProviderID || "",
      };

      await DisablePrimaryToken(request);
      setReprocessOne(true);
    } catch (e) {
      console.error("JustWhere: error unsharing address from service provider: ", e);
      return raiseError(e as JWError);
    }
  };

  const onUnshareAddressWithBeneficiary = async () => {
    if (sharedWithBeneficiary === false) return;
    if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) return;
    if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) return;
    if (internalSecondaryTokens.current.length === 0) return;

    setReprocessTwo(false);
    internalSecondaryTokens.current.forEach(async (token) => {
      try {
        const request: DisableSecondaryTokenRequest = {
          hostPort: hostPort,
          serviceProviderID: serviceProvider?.ID || "",
          beneficiaryID: selectedBeneficiary?.ID || "",
          secondaryToken: token || "",
        };

        await DisableSecondaryToken(request);
        setReprocessTwo(true);
      } catch (e) {
        console.error("JustWhere: error unsharing address from beneficiary: ", e);
        return raiseError(e as JWError);
      }
    });
  };

  /* load current user info */
  useEffect(() => {
    setShowGenPrimaryToken(false);
    setShowGenSecondaryToken(false);
    setShowUnsharePrimaryToken(false);
    setShowUnshareSecondaryToken(false);
    setAddress({} as Address);
    setMyAddresses({} as Record<AddressID, Address>);

    if (hostPort === undefined || typeof hostPort !== "string" || hostPort.trim().length === 0) {
      console.error("JustWhere: no hostPort provided or hostPort is not a string");
      raiseError(new JWError("no hostPort or hostPort is not a string or is empty"));
      return;
    }

    if (!IsValidURL(hostPort)) {
      console.error("JustWhere: hostPort is not a valid URL");
      raiseError(new JWError("hostPort is not a valid URL"));
      return;
    }

    const req: CurrentUserInfoRequest = { hostPort: hostPort };
    GetCurrentUserInfo(req)
      .then((response) => {
        setCurrentUserInfo({ userID: response.userID.trim(), individualID: response.individualID.trim() });
        setInternalIndividualID(response.individualID.trim());
      })
      .catch((error) => {
        console.error("JustWhere: error fetching current user info: ", error);
        raiseError(error as JWError);
      });
  }, [hostPort, authToken]);

  /* retrieve service provider details */
  useEffect(() => {
    setServiceProvider({} as ServiceProvider);

    if (currentUserInfo.individualID.trim().length === 0) return;

    if (serviceProviderID !== undefined && typeof serviceProviderID === "string" && serviceProviderID.trim().length !== 0) {
      const req: ServiceProviderInfoRequest = { hostPort: hostPort, serviceProviderID: serviceProviderID };
      GetServiceProviderInfo(req)
        .then((response) => {
          setServiceProvider(response.serviceProvider);
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }
  }, [currentUserInfo, serviceProviderID]);

  /* retrieve beneficiary details */
  useEffect(() => {
    setBeneficiaries({} as Record<BeneficiaryID, Beneficiary>);
    setSelectedBeneficiary({} as Beneficiary);

    if (currentUserInfo.individualID.trim().length === 0) return;

    if (Array.isArray(beneficiaryIDs) && beneficiaryIDs.length > 0) {
      const fn = async (benIDs: BeneficiaryID[]) => {
        const responses = await Promise.all(benIDs.map((benID) => GetBeneficiaryInfo({ hostPort: hostPort, beneficiaryID: benID.trim() })));
        const beneficiaries = responses.map((response) => response.beneficiary || ({} as Beneficiary));
        console.debug("JustWhere: retrieved", beneficiaries.length, "beneficiaries");
        /* convert to record */
        const beneficiariesInfo = beneficiaries.reduce(
          (acc, cur) => {
            acc[cur.ID] = cur;
            return acc;
          },
          {} as Record<BeneficiaryID, Beneficiary>,
        );

        setBeneficiaries(beneficiariesInfo);

        if (beneficiaries.length > 0) {
          setSelectedBeneficiary(beneficiaries[0]);
        }
      };
      fn([...beneficiaryIDs]);
    }
  }, [currentUserInfo, beneficiaryIDs]);

  /* retrieve addresses and select default address, or provided address */
  useEffect(() => {
    // if user is not logged in, nothing to do
    if (currentUserInfo.individualID.trim().length === 0) return;

    const addressProvided = addressID !== undefined && typeof addressID === "string" && addressID.trim().length !== 0;
    const providedAddressID = addressProvided ? addressID : "";

    const selectedAddressID = address === undefined ? "" : address.ID === undefined ? "" : address.ID;
    const addressSelected = selectedAddressID.trim().length !== 0;

    if (!addressProvided && !addressSelected) {
      // fetch addresses and select first address
      const request: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
      GetOwnerAddresses(request)
        .then((response) => {
          setMyAddresses(response.addresses);
          setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }

    if (!addressProvided && addressSelected) {
      const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
      GetOwnerAddresses(req)
        .then((response) => {
          setMyAddresses(response.addresses);

          if (response.addresses[selectedAddressID] === undefined) {
            setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
            console.debug("JustWhere: previously selected address not found in retrieved addresses. assuming it was deleted. setting to first address");
          }
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }

    if (addressProvided && !addressSelected) {
      // check if addressID belongs to current logged in user
      // if yes, then set internalAddressID to addressID
      // if no, then set internalAddressID to first address in myAddresses
      const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
      GetOwnerAddresses(req)
        .then((response) => {
          setMyAddresses(response.addresses);

          if (response.addresses[providedAddressID] !== undefined) {
            setAddress(response.addresses[providedAddressID]);
          } else {
            setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
          }
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }

    if (addressProvided && addressSelected) {
      if (providedAddressID !== selectedAddressID) {
        const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
        GetOwnerAddresses(req)
          .then((response) => {
            setMyAddresses(response.addresses);

            if (response.addresses[providedAddressID] !== undefined) {
              setAddress(response.addresses[addressID || ""]);
            } else {
              // provided address does not belong to current user (anymore?)
              // check if the currently selected address is also part of the retrieved addresses
              // because it may have been deleted from the backend in the meantime

              if (response.addresses[selectedAddressID] === undefined) {
                setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
                console.debug("JustWhere: previously selected address not found in retrieved addresses. assuming it was deleted. setting to first address");
              }
            }
          })
          .catch((error) => {
            raiseError(error as JWError);
          });
      }
    }
  }, [currentUserInfo, addressID]);

  /* check if address is already shared with service provider */
  useEffect(() => {
    setShowGenPrimaryToken(false);
    setShowUnsharePrimaryToken(false);
    setSharedWithServiceProvider(false);

    if (address === undefined || address.ID === undefined || address.ID.trim().length === 0) return;
    if (serviceProviderID === undefined || serviceProviderID.trim().length === 0) return;

    const primaryTokenProvided = primaryToken !== undefined && typeof primaryToken === "string" && primaryToken.trim().length !== 0;

    // is this address already shared with the service provider?
    const req: ServiceProviderSharesRequest = { hostPort: hostPort, addressID: address?.ID || "", serviceProviderID: serviceProviderID };
    GetSharesWithServiceProvider(req)
      .then((response) => {
        if (response.shares.length === 0) {
          console.debug("JustWhere: address is not shared with service provider");
          setShowGenPrimaryToken(true);
          setShowUnsharePrimaryToken(false);
          setSharedWithServiceProvider(false);

          internalPrimaryToken.current = "";

          if (primaryTokenProvided) {
            console.debug("JustWhere: provided primary token will ignored because address is not shared with service provider");
          }
        } else {
          setShowGenPrimaryToken(false);
          setShowUnsharePrimaryToken(true);
          setSharedWithServiceProvider(true);

          // address is shared multiple times with service provider
          console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this service provider");
          // locate the primaryToken in the shares
          const found = response.shares.find((share) => share.token === primaryToken);

          if (primaryTokenProvided) {
            if (found !== undefined) {
              // primaryToken is provided and found in prior shares
              console.debug("JustWhere: provided primary token found in prior share and will be used to generate secondary token");
            } else {
              // primaryToken is provided but not found in shares
              console.warn(
                "JustWhere: provided primary token not found in prior shares of this address with this service provider but will be used to generate secondary token",
              );
            }
            internalPrimaryToken.current = primaryToken || "";
          } else {
            if (response.shares.length > 1) {
              console.warn(
                "JustWhere: no primary token provided. multiple shares found for this address with this service provider. using the first share's token to generate secondary token",
              );
            } else {
              console.debug(
                "JustWhere: no primary token provided. only one share found for this address with this service provider. using the first share's token to generate secondary token",
              );
            }
            // use the first share's token
            internalPrimaryToken.current = response.shares[0].token || "";
          }
        }
      })
      .catch((error) => {
        console.error("JustWhere: error fetching shares for Service Provider: ", error);
        raiseError(error as JWError);
      });
  }, [address, serviceProviderID, primaryToken, reprocessOne]);

  /* check if address is already shared with beneficiary */
  useEffect(() => {
    setShowGenSecondaryToken(false);
    setShowUnshareSecondaryToken(false);
    setSharedWithBeneficiary(false);

    if (address === undefined || address.ID === undefined || address.ID.trim().length === 0) return;
    if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) return;
    if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) return;

    const req: BeneficiarySharesRequest = { hostPort: hostPort, addressID: address?.ID || "", beneficiaryID: selectedBeneficiary.ID };
    GetSharesWithBeneficiary(req).then((response) => {
      console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this beneficiary overall");
      // only keep shares that match the current service provider and beneficiary for this address
      response.shares = response.shares.filter((share) => {
        const shareSP = share.serviceProviderID?.trim() || "";
        const providedSP = serviceProvider.ID?.trim() || "";
        return shareSP === providedSP && shareSP.length > 0;
      });

      console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this beneficiary via this service provider");

      if (response.shares.length === 0) {
        setShowGenSecondaryToken(true);
        setShowUnshareSecondaryToken(false);
        setSharedWithBeneficiary(false);

        internalSecondaryTokens.current = [];
      } else {
        setShowGenSecondaryToken(false);
        setShowUnshareSecondaryToken(true);
        setSharedWithBeneficiary(true);

        internalSecondaryTokens.current = (response.shares.map((share) => share.token) || []) as SecondaryToken[];
      }
    });
  }, [address, serviceProvider, selectedBeneficiary, reprocessTwo]);

  return (
    <div className="@container/address-content grid min-w-60 grid-cols-1 items-center justify-start gap-3">
      <div className="@container/address-header flex justify-start bg-gray-800 p-2">
        {hostPort !== undefined && hostPort.trim().length > 0 ? (
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
        ) : (
          <p className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8">JW</p>
        )}

        <div className="flex-col justify-around self-center">
          {currentUserInfo.userID.trim().length !== 0 ? (
            <>
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Securely Share, Track and Notify</p>
              <p className="ml-4 text-sm font-light text-gray-200">{currentUserInfo.userID}</p>
            </>
          ) : (
            <>
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Securely Share, Track and Notify</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-2">
        <Label htmlFor="myaddresses">My Addresses</Label>
        <select
          id="myaddresses"
          className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={address?.ID}
          onChange={onSelectedMyAddressChanged}
        >
          {Object.keys(myAddresses).map((myAddress) => (
            <option value={myAddress}>{myAddresses[myAddress].Street1}</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="address-type">Type</Label>
        <Input id="address-type" value={address?.Label} />
      </div>

      <div>
        <Label htmlFor="address-name">Name</Label>
        <Input id="address-name" value={address?.Name} />
      </div>

      <div>
        <Label htmlFor="address-street1">Street</Label>
        <Input id="address-street1" value={address?.Street1} />
      </div>

      <div className="@xs/address-content:grid-cols-2 grid gap-3">
        <div>
          <Label htmlFor="address-city">City</Label>
          <Input id="address-city" value={address?.City} />
        </div>
        <div>
          <Label htmlFor="address-state">State</Label>
          <Input id="address-state" value={address?.State} />
        </div>
      </div>

      <div className="@xs/address-content:grid-cols-2 grid gap-3">
        <div>
          <Label htmlFor="address-zipcode">Post Code</Label>
          <Input id="address-zipcode" value={address?.PostCode} />
        </div>
        <div>
          <Label htmlFor="address-country">Country</Label>
          <Input id="address-country" value={address?.Country} />
        </div>
      </div>

      <div className="@xs/address-content:grid-cols-2 grid gap-3">
        <div>
          <Label htmlFor="address-phone">Phone</Label>
          <Input type="tel" id="address-phone" value={address?.Phone} />
        </div>
        <div>
          <Label htmlFor="address-email">Email</Label>
          <Input type="email" id="address-email" value={address?.Email} />
        </div>
      </div>

      {address?.Tags !== undefined && Object.keys(address.Tags).length > 0 ? (
        <div className="@xs/address-content:grid-cols-2 grid gap-3">
          {Object.entries(address.Tags).map(([tagName, tagValue], index: number, entries) => (
            <div key={index} className={`${index === entries.length - 1 && entries.length % 2 !== 0 ? "col-span-2" : "col-span-1"}`}>
              <Label htmlFor={"address-tag-" + tagName.toLowerCase()}>{tagName}</Label>
              <Input id={"address-tag-" + tagName.toLowerCase()} value={tagValue + ""} />
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}

      {serviceProviderID !== undefined && serviceProviderID.trim().length > 0 ? (
        <div>
          <hr className="h-px my-4 bg-gray-300 border-0" />
          {sharedWithServiceProvider ? (
            <>
              <Label>Address is already shared with {serviceProvider?.Name}</Label>
              <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                  onClick={onUnshareAddressWithServiceProvider}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                  </svg>
                  <p className="mx-1 inline">Remove Share</p>
                </button>
              </div>
            </>
          ) : (
            <>
              <Label>Sharing with {serviceProvider?.Name}</Label>
              <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                  onClick={onGeneratePrimaryToken}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                  </svg>
                  <p className="mx-1 inline">Share</p>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <></>
      )}

      {beneficiaries !== undefined && Object.keys(beneficiaries).length > 0 && sharedWithServiceProvider ? (
        <>
          <hr className="h-px my-4 bg-gray-300 border-0" />
          <Label htmlFor="preferredBeneficiaries">Preferred Beneficiaries</Label>
          <select
            id="preferredBeneficiaries"
            className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            value={selectedBeneficiary?.ID}
            onChange={onSelectedBeneficiaryChanged}
          >
            {Object.keys(beneficiaries).map((beneficiaryID) => (
              <option value={beneficiaryID}>{beneficiaries[beneficiaryID].Name}</option>
            ))}
          </select>
          {selectedBeneficiary !== undefined && selectedBeneficiary.ID !== undefined && selectedBeneficiary.ID.trim().length > 0 ? (
            <>
              {sharedWithBeneficiary ? (
                <>
                  <Label>Address is already shared with {selectedBeneficiary?.Name}</Label>
                  <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                      onClick={onUnshareAddressWithBeneficiary}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                        <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                      </svg>
                      <p className="mx-1 inline">Remove Share</p>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
                      onClick={onGenerateSecondaryToken}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                        <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
                      </svg>
                      <p className="mx-1 inline">Share</p>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default JWAddressFormCustomer;
