import React, { useEffect, useRef, useState } from "react";

import {
  Address,
  AddressID,
  Beneficiary,
  BeneficiaryID,
  BeneficiarySharesRequest,
  CurrentUserInfoRequest,
  DefaultTemplates,
  DisablePrimaryToken,
  DisablePrimaryTokenRequest,
  DisableSecondaryToken,
  DisableSecondaryTokenRequest,
  FetchSecuredContents,
  FetchSecuredContentsRequest,
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
  SecureContent,
  SecureContentID,
  SecureContentTemplate,
  ServiceProvider,
  ServiceProviderID,
  ServiceProviderSharesRequest,
} from "../util";
import { GetBeneficiaryInfo, GetServiceProviderInfo, ServiceProviderInfoRequest } from "../util/providers/providers";
import AddressForm from "./internal/address";
import Label from "./internal/label";
import SecureContentForm from "./internal/secure_content_form";
import ShareBtn from "./internal/shareBtn";
import UnshareBtn from "./internal/unshareBtn";
import {
  OnContentSharedWithBeneficiary,
  OnContentSharedWithServiceProvider,
  OnContentUnsharedWithBeneficiary,
  OnContentUnsharedWithServiceProvider,
  OnErrorFcn,
  UserInfo,
} from "./types";

export interface ContentFormProps {
  hostPort: string;
  authToken: string;
  contentTypeFilter?: string[];
  contentID?: AddressID | SecureContentID;
  contentType?: string;
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

// wraps both the secure content and the address in a single object
// the type field is used to determine which content type is being wrapped
// and then either the address or the secure content is used
// Te label field is used to display the content name in the content specific dropdown
interface SecureContentWrapper {
  ID: SecureContentID;
  Type: string;
  Label: string;
  Address: Address;
  SecureContent: SecureContent;
}

// indicates which property of the secure content to use as the content name
// to display in the content dropdown
const ContentNameMap: Record<string, string> = {
  insurance_details: "name",
  notes: "title",
  employee_records: "name",
};

const contentName = (content: SecureContent): string => {
  if (content.Type === undefined || content.Type.trim().length === 0) return "";
  if (content.Content === undefined || Object.keys(content.Content).length === 0) return "";

  const contentName = ContentNameMap[content.Type.toLowerCase()];
  if (contentName === undefined || contentName.trim().length === 0) return "";

  return content.Content[contentName];
};

const JWContentFormServiceProviderCustomer: React.FC<ContentFormProps> = ({
  hostPort,
  authToken,
  contentTypeFilter,
  contentID,
  contentType,
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
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "" });
  const [internalIndividualID, setInternalIndividualID] = useState<IndividualID>("");

  const [myAddresses, setMyAddresses] = useState<Record<AddressID, Address>>({});
  const [address, setAddress] = useState<Address>();

  const [mySecureContents, setMySecureContents] = useState<Record<SecureContentID, SecureContentWrapper>>({} as Record<SecureContentID, SecureContentWrapper>);
  const [secureContent, setSecureContent] = useState<SecureContentWrapper>({} as SecureContentWrapper);

  const [contentTypes, setContentTypes] = useState<SecureContentTemplate[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<SecureContentTemplate>({} as SecureContentTemplate);

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

  const onSelectedContentTypeChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    for (const ct of contentTypes) {
      if (ct.ID === event.target.value) {
        setSelectedContentType(ct);
        break;
      }
    }
  };

  const onSelectedMyContentChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSecureContent(mySecureContents?.[event.target.value] || ({} as SecureContentWrapper));
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
          onContentSharedWithServiceProvider("ADDRESS", request.individualID, request.addressID, request.serviceProviderID, response.token);
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
          onContentUnsharedWithServiceProvider("ADDRESS", request.individualID, request.addressID, request.serviceProviderID);
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
            "ADDRESS",
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
          onContentUnsharedWithBeneficiary("ADDRESS", internalIndividualID || "", address?.ID || "", request.serviceProviderID, request.beneficiaryID);
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

  const loadAndSelectAddress = async () => {
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
  };

  /*
  const loadAndSelectSecureContent = async () => {
    const contentIDProvided = contentID !== undefined && typeof contentID === "string" && contentID.trim().length !== 0;
    const providedContentID = contentIDProvided ? contentID : "";

    const selectedContentID = secureContent === undefined ? "" : secureContent.ID === undefined ? "" : secureContent.ID;
    const contentSelected = selectedContentID.trim().length !== 0;

    if (!contentIDProvided && !contentSelected) {
      // fetch addresses and select first address
      const request: FetchSecuredContentsRequest = { hostPort: hostPort, authToken: authToken };
      FetchSecuredContents(request)
        .then((response) => {
          // TODO:
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }

    if (!contentIDProvided && contentSelected) {
      const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
      GetOwnerAddresses(req)
        .then((response) => {
          setMyContents(response.addresses);

          if (response.addresses[selectedAddressID] === undefined) {
            setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
            console.debug("JustWhere: previously selected address not found in retrieved addresses. assuming it was deleted. setting to first address");
          }
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }

    if (contentIDProvided && !contentSelected) {
      // check if addressID belongs to current logged in user
      // if yes, then set internalAddressID to addressID
      // if no, then set internalAddressID to first address in myAddresses
      const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
      GetOwnerAddresses(req)
        .then((response) => {
          setMyContents(response.addresses);

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

    if (contentIDProvided && contentSelected) {
      if (providedAddressID !== selectedAddressID) {
        const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
        GetOwnerAddresses(req)
          .then((response) => {
            setMyContents(response.addresses);

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
  };

  */

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

  /* retrieve preferred beneficiaries details */
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

  /* retrieve the contents matching the selected content type */
  useEffect(() => {
    if (currentUserInfo.individualID.trim().length === 0) return;
    if (selectedContentType === undefined || selectedContentType.ID === undefined || selectedContentType.ID.trim().length === 0) return;

    const contentIDProvided = contentID !== undefined && typeof contentID === "string" && contentID.trim().length !== 0;

    if (selectedContentType.ID.toUpperCase() === "ADDRESS") {
      loadAndSelectAddress();
    } else {
      const req: FetchSecuredContentsRequest = { hostPort: hostPort, authToken: authToken, contentFilter: [selectedContentType.ID] };
      FetchSecuredContents(req)
        .then((response) => {
          console.debug("JustWhere: retrieved", response.contents.length, "secured contents:", response.contents);
          const contentMap = response.contents.reduce(
            (acc, cur) => {
              acc[cur.ID] = {
                ID: cur.ID,
                Type: cur.Type,
                Label: contentName(cur),
                Address: {},
                SecureContent: cur,
              } as SecureContentWrapper;
              return acc;
            },
            {} as Record<SecureContentID, SecureContentWrapper>,
          );

          console.debug("JustWhere: secured contents:", contentMap);

          setMySecureContents(contentMap);

          if (contentIDProvided) {
            const foundContent = contentMap[contentID];
            if (foundContent === undefined) {
              setSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContentWrapper));
              console.warn("JustWhere: no secured content found matching the provided contentID:", contentID);
              return;
            }

            if (contentType !== foundContent.Type) {
              setSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContentWrapper));
              console.warn("JustWhere: secured content with provided contentID does not have content type", contentType);
              return;
            }

            setSecureContent(foundContent);
          } else {
            setSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContentWrapper));
          }
        })
        .catch((error) => {
          raiseError(error as JWError);
        });
    }
  }, [currentUserInfo, selectedContentType, contentID]);

  // retrieve secured contents matching the content filter, and set the selected secured content matching the provided contentID
  useEffect(() => {
    setMySecureContents({} as Record<SecureContentID, SecureContentWrapper>);
    setSecureContent({} as SecureContentWrapper);

    if (currentUserInfo.individualID.trim().length === 0) return;

    // contentTypeFilter must be provided and must be a non-zero length array of strings
    const contentTypeFilterProvided =
      contentTypeFilter !== undefined &&
      Array.isArray(contentTypeFilter) &&
      contentTypeFilter.length !== 0 &&
      contentTypeFilter.every((ctf) => typeof ctf === "string");

    if (!contentTypeFilterProvided) {
      console.error("JustWhere: contentTypeFilter is not provided or is not a string array");
      raiseError(new JWError("contentTypeFilter is not provided or is not a string array"));
      return;
    }

    const ctFilters = new Set<string>([]);
    // add the lowercase contentTypeFilter values to the ctypeFilter set
    for (const ctf of contentTypeFilter) {
      ctFilters.add(ctf.toLowerCase().trim());
    }

    const contentTypeProvided = contentType !== undefined && typeof contentType === "string" && contentType.trim().length !== 0;

    if (contentTypeProvided) {
      ctFilters.add(contentType.toLowerCase().trim());
    }

    const ctTemplates = DefaultTemplates();
    const cTypes: SecureContentTemplate[] = [];
    for (const ctTemplate of ctTemplates) {
      if (ctFilters.has(ctTemplate.ID.toLowerCase().trim())) {
        cTypes.push(ctTemplate);
      }
    }
    setContentTypes(cTypes);

    if (contentTypeProvided) {
      if (ctFilters.has(contentType.toLowerCase().trim())) {
        setSelectedContentType(cTypes.find((ct) => ct.ID.toLowerCase().trim() === contentType.toLowerCase().trim()) || ({} as SecureContentTemplate));
      } else {
        console.warn("JustWhere: contentType provided does not match any of the contentTypes in the templates");
        setSelectedContentType(cTypes.length > 0 ? cTypes[0] : ({} as SecureContentTemplate));
        return;
      }
    } else {
      setSelectedContentType(cTypes.length > 0 ? cTypes[0] : ({} as SecureContentTemplate));
    }
  }, [currentUserInfo, contentTypeFilter, contentType]);

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
      <div className="@container/address-header flex justify-start bg-gray-800 p-3">
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

      <div className="bg-gray-200 flex flex-col gap-3 p-3">
        <div>
          <Label htmlFor="contentTypes">Select Content Type</Label>
          <select
            id="contentTypes"
            className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            value={selectedContentType.ID}
            onChange={onSelectedContentTypeChanged}
          >
            {contentTypes.map((contentType) => (
              <option value={contentType.ID}>{contentType.Name}</option>
            ))}
          </select>
        </div>

        <div>
          {Object.keys(mySecureContents).length > 0 ? (
            <>
              <Label htmlFor="mysecurecontents">Select {selectedContentType.Name}</Label>
              {selectedContentType.ID.toUpperCase() === "ADDRESS" ? (
                <select
                  id="mysecurecontents"
                  className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={address?.ID}
                  onChange={onSelectedMyAddressChanged}
                >
                  {Object.keys(myAddresses).map((myAddress) => (
                    <option value={myAddress}>{myAddresses[myAddress].Street1}</option>
                  ))}
                </select>
              ) : (
                <select
                  id="mysecurecontents"
                  className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={contentID}
                  onChange={onSelectedMyContentChanged}
                >
                  {Object.keys(mySecureContents).map((myContent) => (
                    <option value={myContent}>{mySecureContents[myContent].Label}</option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>

      {secureContent !== undefined && secureContent.Type !== undefined && secureContent.Type.length > 0 ? (
        <>
          {secureContent.Type.toUpperCase() === "ADDRESS" ? (
            <div className="flex flex-col gap-3 p-3 pt-0">
              <AddressForm address={address || ({} as Address)} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3 pt-0">
              <SecureContentForm contentData={secureContent?.SecureContent || ({} as SecureContent)} contentTemplate={selectedContentType?.Fields || []} />
            </div>
          )}
        </>
      ) : (
        <></>
      )}

      {serviceProviderID !== undefined && serviceProviderID.trim().length > 0 ? (
        <div className="bg-gray-200 flex flex-col gap-3 p-3">
          {/* <hr className="h-px mt-3 bg-gray-300 border-0" /> */}
          {sharedWithServiceProvider ? (
            <>
              <div className="grid gap-3">
                <div className="inline-flex rounded-md">
                  <span className="text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                      <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
                    </svg>
                  </span>
                  <label className="mx-2 block text-sm font-semibold uppercase tracking-normal text-gray-900">Shared With {serviceProvider?.Name}</label>
                </div>
                <UnshareBtn onClick={onContentUnsharedWithServiceProviderInternal} />
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm font-semibold uppercase tracking-normal text-gray-900">Sharing with {serviceProvider?.Name}</label>
              <ShareBtn onClick={onContentSharedWithServiceProviderInternal} />
            </>
          )}
        </div>
      ) : (
        <></>
      )}

      {beneficiaries !== undefined && Object.keys(beneficiaries).length > 0 && sharedWithServiceProvider ? (
        <>
          <div className="bg-gray-200 flex flex-col gap-3 p-3">
            <label htmlFor="preferredBeneficiaries" className="block text-sm font-semibold uppercase tracking-normal text-gray-900">
              Preferred Beneficiaries
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
                    <div className="grid gap-3">
                      <div className="inline-flex rounded-md">
                        <span className="text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                            <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
                          </svg>
                        </span>
                        <label className="mx-2 block text-sm font-semibold uppercase tracking-normal text-gray-900">
                          Shared with {selectedBeneficiary?.Name}
                        </label>
                      </div>
                      <UnshareBtn onClick={onContentUnsharedWithBeneficiaryInternal} />
                    </div>
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

export default JWContentFormServiceProviderCustomer;
