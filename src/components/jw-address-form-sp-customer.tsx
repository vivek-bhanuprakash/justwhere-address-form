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
  ServiceProviderSharesRequest,
} from "../util";
import { GetBeneficiaryInfo, GetServiceProviderInfo, ServiceProviderInfoRequest } from "../util/providers/providers";
import AddressForm from "./internal/address";
import Label from "./internal/label";
import ShareBtn from "./internal/shareBtn";
import UnshareBtn from "./internal/unshareBtn";
import {
  OnContentSharedWithBeneficiary,
  OnContentSharedWithServiceProvider,
  OnContentUnsharedWithBeneficiary,
  OnContentUnsharedWithServiceProvider,
  OnErrorFcn,
  SecureContentType,
  UserInfo,
} from "./types";

export interface AddressProps {
  hostPort: string;
  authToken: string;
  addressID?: AddressID;
  serviceProviderID?: ServiceProviderID;
  primaryToken?: PrimaryToken;
  beneficiaryIDs?: BeneficiaryID[];
  onError?: OnErrorFcn;
  onContentSharedWithServiceProvider?: OnContentSharedWithServiceProvider;
  onContentUnsharedWithServiceProvider?: OnContentUnsharedWithServiceProvider;
  onContentSharedWithBeneficiary?: OnContentSharedWithBeneficiary;
  onContentUnsharedWithBeneficiary?: OnContentUnsharedWithBeneficiary;
}

const JWAddressFormServiceProviderCustomer: React.FC<AddressProps> = ({
  hostPort,
  authToken,
  addressID,
  serviceProviderID,
  primaryToken,
  beneficiaryIDs,
  onError,
  onContentSharedWithServiceProvider,
  onContentUnsharedWithServiceProvider,
  onContentSharedWithBeneficiary,
  onContentUnsharedWithBeneficiary,
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
  const internalSecondaryToken = useRef<SecondaryToken>("");

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

  const onContentSharedWithServiceProviderInternal = async () => {
    try {
      const request: PrimaryTokenRequest = {
        hostPort: hostPort,
        individualID: internalIndividualID || "",
        addressID: address?.ID || "",
        serviceProviderID: serviceProviderID || "",
      };

      setReprocessOne(false);
      const response: PrimaryTokenResponse = await GenereratePrimaryToken(request);
      setReprocessOne(true);

      if (onContentSharedWithServiceProvider !== undefined || typeof onContentSharedWithServiceProvider === "function") {
        try {
          onContentSharedWithServiceProvider(SecureContentType.ADDRESS, request.individualID, request.addressID, request.serviceProviderID, response.token);
        } catch (e) {
          console.error("JustWhere: onContentSharedWithServiceProvider callback function threw an error: ", e);
          return raiseError(new JWError((e as Error).message));
        }
      } else {
        console.warn("JustWhere: onContentSharedWithServiceProvider callback function is not provided or is not a function");
      }
    } catch (e) {
      console.error("JustWhere: error generating service provider token: ", e);
      return raiseError(e as JWError);
    }
  };

  const onContentUnsharedWithServiceProviderInternal = async () => {
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

      if (onContentUnsharedWithServiceProvider !== undefined && typeof onContentUnsharedWithServiceProvider === "function") {
        try {
          onContentUnsharedWithServiceProvider(SecureContentType.ADDRESS, request.individualID, request.addressID, request.serviceProviderID);
        } catch (e) {
          console.error("JustWhere: onContentUnsharedWithServiceProvider callback function threw an error: ", e);
          return raiseError(new JWError((e as Error).message));
        }
      } else {
        console.warn("JustWhere: onContentUnsharedWithServiceProvider callback function is not provided or is not a function");
      }
    } catch (e) {
      console.error("JustWhere: error unsharing address from service provider: ", e);
      return raiseError(e as JWError);
    }
  };

  const onContentSharedWithBeneficiaryInternal = async () => {
    try {
      setReprocessTwo(false);
      const request: SecondaryTokenRequest = {
        hostPort,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        token: internalPrimaryToken.current || "",
      };

      const response = await GenererateSecondaryToken(request);
      setReprocessTwo(true);
      if (onContentSharedWithBeneficiary !== undefined && typeof onContentSharedWithBeneficiary === "function") {
        try {
          onContentSharedWithBeneficiary(
            SecureContentType.ADDRESS,
            internalIndividualID || "",
            address?.ID || "",
            request.serviceProviderID,
            request.token,
            request.beneficiaryID,
            response.token,
          );
        } catch (e) {
          console.error("JustWhere: onContentSharedWithBeneficiary callback function threw an error: ", e);
          return raiseError(new JWError((e as Error).message));
        }
      } else {
        console.warn("JustWhere: onContentSharedWithBeneficiary callback function is not provided or is not a function");
      }
    } catch (e) {
      console.error("JustWhere: error generating beneficiary token: ", e);
      return raiseError(e as JWError);
    }
  };

  const onContentUnsharedWithBeneficiaryInternal = async () => {
    if (sharedWithBeneficiary === false) return;
    if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) return;
    if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) return;
    if (internalSecondaryToken.current.length === 0) return;

    setReprocessTwo(false);
    try {
      const request: DisableSecondaryTokenRequest = {
        hostPort: hostPort,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        secondaryToken: internalSecondaryToken.current || "",
      };

      await DisableSecondaryToken(request);
      setReprocessTwo(true);
      if (onContentUnsharedWithBeneficiary !== undefined && typeof onContentUnsharedWithBeneficiary === "function") {
        try {
          onContentUnsharedWithBeneficiary(
            SecureContentType.ADDRESS,
            internalIndividualID || "",
            address?.ID || "",
            request.serviceProviderID,
            request.beneficiaryID,
          );
        } catch (e) {
          console.error("JustWhere: onContentUnsharedWithBeneficiary callback function threw an error: ", e);
          return raiseError(new JWError((e as Error).message));
        }
      } else {
        console.warn("JustWhere: onContentUnsharedWithBeneficiary callback function is not provided or is not a function");
      }
    } catch (e) {
      console.error("JustWhere: error unsharing address from beneficiary: ", e);
      return raiseError(e as JWError);
    }
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

        internalSecondaryToken.current = "";
      } else {
        setShowGenSecondaryToken(false);
        setShowUnshareSecondaryToken(true);
        setSharedWithBeneficiary(true);

        internalSecondaryToken.current = response.shares[0].token || "";
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

      <AddressForm address={address || ({} as Address)} />

      {serviceProviderID !== undefined && serviceProviderID.trim().length > 0 ? (
        <div className="mt-3">
          {/* <hr className="h-px mt-3 bg-gray-300 border-0" /> */}
          {sharedWithServiceProvider ? (
            <>
              <label className="mb-4 block text-xs uppercase font-semibold tracking-normal text-gray-900">
                <span className="inline-flex items-center justify-center w-4 h-4 me-1 text-xs font-semibold text-gray-100 bg-green-700 rounded-full">
                  <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5" />
                  </svg>
                </span>
                Shared with {serviceProvider?.Name}
              </label>
              <UnshareBtn onClick={onContentUnsharedWithServiceProviderInternal} />
            </>
          ) : (
            <>
              <Label>Sharing with {serviceProvider?.Name}</Label>
              <ShareBtn onClick={onContentSharedWithServiceProviderInternal} />
            </>
          )}
        </div>
      ) : (
        <></>
      )}

      {beneficiaries !== undefined && Object.keys(beneficiaries).length > 0 && sharedWithServiceProvider ? (
        <>
          <hr className="h-px mt-3 bg-gray-300 border-0" />
          <div className="mt-3">
            <label htmlFor="preferredBeneficiaries" className="mb-2 block text-xs font-semibold uppercase tracking-normal text-gray-900">
              Preferred Beneficiaries of {serviceProvider?.Name}
            </label>
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
              <div>
                {sharedWithBeneficiary ? (
                  <>
                    <label className="mt-3 mb-4 block text-xs uppercase font-semibold tracking-normal text-gray-900">
                      <span className="inline-flex items-center justify-center w-4 h-4 me-1 text-xs font-semibold text-gray-100 bg-green-700 rounded-full">
                        <svg className="w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5" />
                        </svg>
                      </span>
                      Shared with {selectedBeneficiary?.Name}
                    </label>
                    <UnshareBtn onClick={onContentUnsharedWithBeneficiaryInternal} />
                  </>
                ) : (
                  <>
                    <ShareBtn onClick={onContentSharedWithBeneficiaryInternal} />
                  </>
                )}
              </div>
            ) : (
              <></>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default JWAddressFormServiceProviderCustomer;
