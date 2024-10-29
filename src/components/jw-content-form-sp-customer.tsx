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
  GenericSecureContent,
  GetCurrentUserInfo,
  GetOwnerSecureContents,
  GetSharesWithBeneficiary,
  GetSharesWithServiceProvider,
  GetTemplatesForServiceProvider,
  IndividualID,
  IsValidURL,
  JWError,
  OwnerSecureContentsRequest,
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
  ServiceProviderTemplatesRequest,
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
  contentTypeFilter: string[];
  contentID?: AddressID | SecureContentID;
  contentType?: string;
  serviceProviderID?: ServiceProviderID;
  primaryToken?: PrimaryToken;
  beneficiaryIDs?: BeneficiaryID[];
  onError?: OnErrorFcn;
  onContentSharedWithServiceProvider?: OnContentSharedWithServiceProvider;
  onContentUnsharedWithServiceProvider?: OnContentUnsharedWithServiceProvider;
  onContentSharedWithBeneficiary?: OnContentSharedWithBeneficiary;
  onContentUnsharedWithBeneficiary?: OnContentUnsharedWithBeneficiary;
}

const JWContentFormServiceProviderCustomer: React.FC<ContentFormProps> = ({
  hostPort,
  authToken,
  contentTypeFilter,
  contentID,
  contentType,
  serviceProviderID,
  primaryToken,
  beneficiaryIDs,
  onError,
  onContentSharedWithServiceProvider,
  onContentUnsharedWithServiceProvider,
  onContentSharedWithBeneficiary,
  onContentUnsharedWithBeneficiary,
}) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "", serviceProviderID: "", token: "" });
  const [internalIndividualID, setInternalIndividualID] = useState<IndividualID>("");

  const [myAddresses, setMyAddresses] = useState<Record<AddressID, Address>>({});
  const [address, setAddress] = useState<Address>();

  const [secureContents, setSecureContents] = useState<Record<SecureContentID, SecureContent>>({} as Record<SecureContentID, SecureContent>);
  const [selectedSecureContent, setSelectedSecureContent] = useState<SecureContent>({} as SecureContent);

  const [contentTemplates, setContentTemplates] = useState<SecureContentTemplate[]>([]);
  const [selectedContentTemplate, setSelectedContentTemplate] = useState<SecureContentTemplate>({} as SecureContentTemplate);

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
    for (const ct of contentTemplates) {
      if (ct.Type.toLowerCase() === event.target.value.toLowerCase()) {
        setSelectedContentTemplate(ct);
        break;
      }
    }
  };

  const onSelectedMyContentChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSecureContent(secureContents?.[event.target.value] || ({} as SecureContent));
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
        authToken,
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
        authToken,
        individualID: internalIndividualID || "",
        addressID: address?.ID || "",
        serviceProviderID: serviceProviderID || "",
      };

      await DisablePrimaryToken(request);
      setReprocessOne(true);

      if (onContentUnsharedWithServiceProvider !== undefined && typeof onContentUnsharedWithServiceProvider === "function") {
        try {
          onContentUnsharedWithServiceProvider(selectedSecureContent.Type, request.individualID, request.addressID, request.serviceProviderID);
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
        authToken,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        token: internalPrimaryToken.current || "",
      };

      const response = await GenererateSecondaryToken(request);
      setReprocessTwo(true);
      if (onContentSharedWithBeneficiary !== undefined && typeof onContentSharedWithBeneficiary === "function") {
        try {
          onContentSharedWithBeneficiary(
            selectedSecureContent.Type,
            internalIndividualID || "",
            selectedSecureContent.ID,
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
        authToken,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        secondaryToken: internalSecondaryToken.current || "",
      };

      await DisableSecondaryToken(request);
      setReprocessTwo(true);
      if (onContentUnsharedWithBeneficiary !== undefined && typeof onContentUnsharedWithBeneficiary === "function") {
        try {
          onContentUnsharedWithBeneficiary(
            selectedSecureContent.Type,
            internalIndividualID || "",
            selectedSecureContent.ID,
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

    setContentTemplates([]);
    setSelectedContentTemplate({} as SecureContentTemplate);

    setSecureContents({} as Record<SecureContentID, SecureContent>);
    setSelectedSecureContent({} as SecureContent);

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

    const req: CurrentUserInfoRequest = { hostPort: hostPort, authToken: authToken };
    GetCurrentUserInfo(req)
      .then((response) => {
        console.debug("JustWhere: current user info response: ", response);
        setCurrentUserInfo({
          userID: response.userID.trim(),
          individualID: response.individualID.trim(),
          serviceProviderID: response.serviceProviderID.trim(),
          token: response.token.trim(),
        });
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

  // /* retrieve addresses and select default address, or provided address */
  // useEffect(() => {
  //   // if user is not logged in, nothing to do
  //   if (currentUserInfo.individualID.trim().length === 0) return;

  //   const addressProvided = addressID !== undefined && typeof addressID === "string" && addressID.trim().length !== 0;
  //   const providedAddressID = addressProvided ? addressID : "";

  //   const selectedAddressID = address === undefined ? "" : address.ID === undefined ? "" : address.ID;
  //   const addressSelected = selectedAddressID.trim().length !== 0;

  //   if (!addressProvided && !addressSelected) {
  //     // fetch addresses and select first address
  //     const request: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
  //     GetOwnerAddresses(request)
  //       .then((response) => {
  //         setMyAddresses(response.addresses);
  //         setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
  //       })
  //       .catch((error) => {
  //         raiseError(error as JWError);
  //       });
  //   }

  //   if (!addressProvided && addressSelected) {
  //     const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
  //     GetOwnerAddresses(req)
  //       .then((response) => {
  //         setMyAddresses(response.addresses);

  //         if (response.addresses[selectedAddressID] === undefined) {
  //           setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
  //           console.debug("JustWhere: previously selected address not found in retrieved addresses. assuming it was deleted. setting to first address");
  //         }
  //       })
  //       .catch((error) => {
  //         raiseError(error as JWError);
  //       });
  //   }

  //   if (addressProvided && !addressSelected) {
  //     // check if addressID belongs to current logged in user
  //     // if yes, then set internalAddressID to addressID
  //     // if no, then set internalAddressID to first address in myAddresses
  //     const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
  //     GetOwnerAddresses(req)
  //       .then((response) => {
  //         setMyAddresses(response.addresses);

  //         if (response.addresses[providedAddressID] !== undefined) {
  //           setAddress(response.addresses[providedAddressID]);
  //         } else {
  //           setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
  //         }
  //       })
  //       .catch((error) => {
  //         raiseError(error as JWError);
  //       });
  //   }

  //   if (addressProvided && addressSelected) {
  //     if (providedAddressID !== selectedAddressID) {
  //       const req: OwnerAddressesRequest = { hostPort: hostPort, individualID: currentUserInfo.individualID };
  //       GetOwnerAddresses(req)
  //         .then((response) => {
  //           setMyAddresses(response.addresses);

  //           if (response.addresses[providedAddressID] !== undefined) {
  //             setAddress(response.addresses[addressID || ""]);
  //           } else {
  //             // provided address does not belong to current user (anymore?)
  //             // check if the currently selected address is also part of the retrieved addresses
  //             // because it may have been deleted from the backend in the meantime

  //             if (response.addresses[selectedAddressID] === undefined) {
  //               setAddress(response.addresses[response.addresses[0]?.ID] || ({} as Address));
  //               console.debug("JustWhere: previously selected address not found in retrieved addresses. assuming it was deleted. setting to first address");
  //             }
  //           }
  //         })
  //         .catch((error) => {
  //           raiseError(error as JWError);
  //         });
  //     }
  //   }
  // }, [currentUserInfo, addressID]);

  /* check if address is already shared with beneficiary */
  useEffect(() => {
    if (selectedSecureContent === undefined || selectedSecureContent.ID === undefined || selectedSecureContent.ID.trim().length === 0) {
      setShowGenSecondaryToken(false);
      setShowUnshareSecondaryToken(false);
      setSharedWithBeneficiary(false);
      return;
    }

    if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) {
      setShowGenSecondaryToken(false);
      setShowUnshareSecondaryToken(false);
      setSharedWithBeneficiary(false);
      return;
    }

    if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) {
      setShowGenSecondaryToken(false);
      setShowUnshareSecondaryToken(false);
      setSharedWithBeneficiary(false);
      return;
    }

    const request: BeneficiarySharesRequest = {
      hostPort: hostPort,
      authToken: authToken,
      contentID: selectedSecureContent.ID,
      contentTemplate: selectedContentTemplate,
      beneficiaryID: selectedBeneficiary.ID,
    };
    GetSharesWithBeneficiary(request).then((response) => {
      console.debug("JustWhere: selected secure content is shared", response.shares.length, "time(s) with this beneficiary overall");
      // only keep shares that match the current service provider and beneficiary for this address
      response.shares = response.shares.filter((share) => {
        const shareSP = share.serviceProviderID?.trim() || "";
        const providedSP = serviceProvider.ID?.trim() || "";
        return shareSP === providedSP && shareSP.length > 0;
      });

      console.debug("JustWhere: selected secure content is shared", response.shares.length, "time(s) with this beneficiary via this service provider");

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
  }, [selectedSecureContent, serviceProvider, selectedBeneficiary, reprocessTwo]);

  /* check if secure content is already shared with service provider */
  useEffect(() => {
    if (selectedSecureContent === undefined || selectedSecureContent.ID === undefined || selectedSecureContent.ID.trim().length === 0) {
      setShowGenPrimaryToken(false);
      setShowUnsharePrimaryToken(false);
      setSharedWithServiceProvider(false);
      return;
    }

    if (serviceProviderID === undefined || serviceProviderID.trim().length === 0) {
      setShowGenPrimaryToken(false);
      setShowUnsharePrimaryToken(false);
      setSharedWithServiceProvider(false);
      return;
    }

    const primaryTokenProvided = primaryToken !== undefined && typeof primaryToken === "string" && primaryToken.trim().length !== 0;

    // is this secure content already shared with the service provider?
    const request: ServiceProviderSharesRequest = {
      hostPort: hostPort,
      authToken: authToken,
      contentID: selectedSecureContent.ID,
      contentTemplate: selectedContentTemplate,
      serviceProviderID: serviceProviderID,
    };
    GetSharesWithServiceProvider(request)
      .then((response) => {
        if (response.shares.length === 0) {
          console.debug("JustWhere: secure content is not shared with service provider");
          setShowGenPrimaryToken(true);
          setShowUnsharePrimaryToken(false);
          setSharedWithServiceProvider(false);

          internalPrimaryToken.current = "";

          if (primaryTokenProvided) {
            console.debug("JustWhere: provided primary token will ignored because secure content is not shared with service provider");
          }
        } else {
          setShowGenPrimaryToken(false);
          setShowUnsharePrimaryToken(true);
          setSharedWithServiceProvider(true);

          // address is shared multiple times with service provider
          console.debug("JustWhere: selected secure content is shared", response.shares.length, "time(s) with this service provider");
          // locate the primaryToken in the shares
          const found = response.shares.find((share) => share.token === primaryToken);

          if (primaryTokenProvided) {
            if (found !== undefined) {
              // primaryToken is provided and found in prior shares
              console.debug("JustWhere: provided primary token found in prior share and will be used to generate secondary token");
            } else {
              // primaryToken is provided but not found in shares
              console.warn(
                "JustWhere: provided primary token not found in prior shares of this secure content with this service provider but will be used to generate secondary token",
              );
            }
            internalPrimaryToken.current = primaryToken || "";
          } else {
            if (response.shares.length > 1) {
              console.warn(
                "JustWhere: no primary token provided. multiple shares found for this secure content with this service provider. using the first share's token to generate secondary token",
              );
            } else {
              console.debug(
                "JustWhere: no primary token provided. only one share found for this secure content with this service provider. using the first share's token to generate secondary token",
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
  }, [selectedSecureContent, serviceProviderID, primaryToken, reprocessOne]);

  /* retrieve the contents matching the selected content type and set a default one if one is provided provided */
  useEffect(() => {
    if (currentUserInfo.individualID.trim().length === 0) {
      setSecureContents({} as Record<SecureContentID, SecureContent>);
      setSelectedSecureContent({} as SecureContent);
      return;
    }

    if (selectedContentTemplate === undefined || selectedContentTemplate.Type === undefined || selectedContentTemplate.Type.trim().length === 0) {
      setSecureContents({} as Record<SecureContentID, SecureContent>);
      setSelectedSecureContent({} as SecureContent);
      return;
    }

    const contentIDProvided = contentID !== undefined && typeof contentID === "string" && contentID.trim().length !== 0;

    const getOwnerSecureContents = async () => {
      try {
        const request: OwnerSecureContentsRequest = {
          hostPort: hostPort,
          authToken: authToken,
          individualID: currentUserInfo.individualID,
          templateFilters: [selectedContentTemplate],
        };
        const response = await GetOwnerSecureContents(request);
        console.debug("JustWhere: retrieved", Object.keys(response.contents).length, "secured contents matching template filter", selectedContentTemplate.Type);
        const contentMap = Object.entries(response.contents).reduce(
          (acc, [_, contents]) => {
            contents.forEach((content) => {
              acc[content.ID] = content;
            });
            return acc;
          },
          {} as Record<SecureContentID, SecureContent>,
        );
        setSecureContents(contentMap);

        // if contentID is provided, select it
        if (contentIDProvided) {
          // if current selected content is not the same as the one provided, then look it up in the contentMap
          if (contentID !== selectedSecureContent.ID && contentID !== selectedSecureContent.Type) {
            const foundContent = contentMap[contentID];
            if (foundContent === undefined) {
              setSelectedSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContent));
              console.warn("JustWhere: no secured content found matching the provided contentID:", contentID);
              return;
            }

            if (contentType !== foundContent.Type) {
              setSelectedSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContent));
              console.warn("JustWhere: secured content with provided contentID does not have content type", contentType);
              return;
            }

            setSelectedSecureContent(foundContent);
          }
        } else {
          setSelectedSecureContent(Object.keys(contentMap).length > 0 ? contentMap[Object.keys(contentMap)[0]] : ({} as SecureContent));
        }
      } catch (error) {
        console.error("JustWhere: error fetching secured contents:", error);
        raiseError(error as JWError);
      }
    };

    getOwnerSecureContents();
  }, [selectedContentTemplate, contentID]);

  /* retrieve the templates matching the content filter and set a default one if contentType is not provided */
  useEffect(() => {
    if (!currentUserInfo.individualID.trim()) {
      setContentTemplates([]);
      setSelectedContentTemplate({} as SecureContentTemplate);
      return;
    }

    if (contentTypeFilter === undefined || contentTypeFilter.length === 0) {
      setContentTemplates([]);
      setSelectedContentTemplate({} as SecureContentTemplate);
      return;
    }

    if (!Array.isArray(contentTypeFilter) || !contentTypeFilter.length || !contentTypeFilter.every((item) => typeof item === "string")) {
      setContentTemplates([]);
      setSelectedContentTemplate({} as SecureContentTemplate);
    }

    const normalizedTypes = new Set(contentTypeFilter.map((f) => f.toLowerCase().trim()));

    if (contentType?.trim()) {
      normalizedTypes.add(contentType.toLowerCase().trim());
    }

    const fetchTemplates = async () => {
      try {
        const req: ServiceProviderTemplatesRequest = {
          hostPort,
          authToken,
          serviceProviderID: currentUserInfo.serviceProviderID,
        };

        const templates = await GetTemplatesForServiceProvider(req);

        const matchedTemplates = templates.filter(
          (template) => normalizedTypes.has(template.ID.toLowerCase().trim()) || normalizedTypes.has(template.Type.toLowerCase().trim()),
        );

        setContentTemplates(matchedTemplates);

        console.debug("JustWhere: retrieved", matchedTemplates.length, "matching content templates");
        let selectedTemplate = templates[0];
        if (contentType) {
          selectedTemplate =
            templates.find((template) => template.ID.toLowerCase().trim() === contentType || template.Type.toLowerCase().trim() === contentType) ||
            ({} as SecureContentTemplate);
          if (!selectedTemplate || selectedTemplate.ID.trim().length === 0) {
            console.warn("JustWhere: no matching content template found for", contentType, ". setting to first template");
            selectedTemplate = templates[0];
          }
        }
        setSelectedContentTemplate(selectedTemplate);
      } catch (error) {
        console.error("JustWhere: error fetching templates:", error);
        raiseError(error as JWError);
      }
    };

    fetchTemplates();
  }, [currentUserInfo, contentTypeFilter, contentType]);

  // /* check if address is already shared with service provider */
  // useEffect(() => {
  //   setShowGenPrimaryToken(false);
  //   setShowUnsharePrimaryToken(false);
  //   setSharedWithServiceProvider(false);

  //   if (address === undefined || address.ID === undefined || address.ID.trim().length === 0) return;
  //   if (serviceProviderID === undefined || serviceProviderID.trim().length === 0) return;

  //   const primaryTokenProvided = primaryToken !== undefined && typeof primaryToken === "string" && primaryToken.trim().length !== 0;

  //   // is this address already shared with the service provider?
  //   const req: ServiceProviderAddressSharesRequest = { hostPort: hostPort, addressID: address?.ID || "", serviceProviderID: serviceProviderID };
  //   GetAddressSharesWithServiceProvider(req)
  //     .then((response) => {
  //       if (response.shares.length === 0) {
  //         console.debug("JustWhere: address is not shared with service provider");
  //         setShowGenPrimaryToken(true);
  //         setShowUnsharePrimaryToken(false);
  //         setSharedWithServiceProvider(false);

  //         internalPrimaryToken.current = "";

  //         if (primaryTokenProvided) {
  //           console.debug("JustWhere: provided primary token will ignored because address is not shared with service provider");
  //         }
  //       } else {
  //         setShowGenPrimaryToken(false);
  //         setShowUnsharePrimaryToken(true);
  //         setSharedWithServiceProvider(true);

  //         // address is shared multiple times with service provider
  //         console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this service provider");
  //         // locate the primaryToken in the shares
  //         const found = response.shares.find((share) => share.token === primaryToken);

  //         if (primaryTokenProvided) {
  //           if (found !== undefined) {
  //             // primaryToken is provided and found in prior shares
  //             console.debug("JustWhere: provided primary token found in prior share and will be used to generate secondary token");
  //           } else {
  //             // primaryToken is provided but not found in shares
  //             console.warn(
  //               "JustWhere: provided primary token not found in prior shares of this address with this service provider but will be used to generate secondary token",
  //             );
  //           }
  //           internalPrimaryToken.current = primaryToken || "";
  //         } else {
  //           if (response.shares.length > 1) {
  //             console.warn(
  //               "JustWhere: no primary token provided. multiple shares found for this address with this service provider. using the first share's token to generate secondary token",
  //             );
  //           } else {
  //             console.debug(
  //               "JustWhere: no primary token provided. only one share found for this address with this service provider. using the first share's token to generate secondary token",
  //             );
  //           }
  //           // use the first share's token
  //           internalPrimaryToken.current = response.shares[0].token || "";
  //         }
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("JustWhere: error fetching shares for Service Provider: ", error);
  //       raiseError(error as JWError);
  //     });
  // }, [address, serviceProviderID, primaryToken, reprocessOne]);

  // /* check if address is already shared with beneficiary */
  // useEffect(() => {
  //   setShowGenSecondaryToken(false);
  //   setShowUnshareSecondaryToken(false);
  //   setSharedWithBeneficiary(false);

  //   if (address === undefined || address.ID === undefined || address.ID.trim().length === 0) return;
  //   if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) return;
  //   if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) return;

  //   const req: BeneficiaryAddressSharesRequest = { hostPort: hostPort, addressID: address?.ID || "", beneficiaryID: selectedBeneficiary.ID };
  //   GetAddressSharesWithBeneficiary(req).then((response) => {
  //     console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this beneficiary overall");
  //     // only keep shares that match the current service provider and beneficiary for this address
  //     response.shares = response.shares.filter((share) => {
  //       const shareSP = share.serviceProviderID?.trim() || "";
  //       const providedSP = serviceProvider.ID?.trim() || "";
  //       return shareSP === providedSP && shareSP.length > 0;
  //     });

  //     console.debug("JustWhere: selected address is shared", response.shares.length, "time(s) with this beneficiary via this service provider");

  //     if (response.shares.length === 0) {
  //       setShowGenSecondaryToken(true);
  //       setShowUnshareSecondaryToken(false);
  //       setSharedWithBeneficiary(false);

  //       internalSecondaryToken.current = "";
  //     } else {
  //       setShowGenSecondaryToken(false);
  //       setShowUnshareSecondaryToken(true);
  //       setSharedWithBeneficiary(true);

  //       internalSecondaryToken.current = response.shares[0].token || "";
  //     }
  //   });
  // }, [address, serviceProvider, selectedBeneficiary, reprocessTwo]);

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
            value={selectedContentTemplate.Type}
            onChange={onSelectedContentTypeChanged}
          >
            {contentTemplates.map((contentType) => (
              <option value={contentType.Type}>{contentType.Label}</option>
            ))}
          </select>
        </div>

        <div>
          {Object.keys(secureContents).length > 0 ? (
            <>
              <Label htmlFor="mysecurecontents">Select {selectedContentTemplate.Label}</Label>
              {selectedContentTemplate.Type.toUpperCase() === "ADDRESS" ? (
                <select
                  id="mysecurecontents"
                  className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={selectedSecureContent.ID}
                  onChange={onSelectedMyContentChanged}
                >
                  {Object.keys(secureContents).map((myContentID) => (
                    <option value={myContentID}>{secureContents[myContentID].Label}</option>
                  ))}
                </select>
              ) : (
                <select
                  id="mysecurecontents"
                  className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={selectedSecureContent.ID}
                  onChange={onSelectedMyContentChanged}
                >
                  {Object.keys(secureContents).map((myContent) => (
                    <option value={myContent}>{secureContents[myContent].Label}</option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>

      {selectedSecureContent !== undefined && selectedSecureContent.Type !== undefined && selectedSecureContent.Type.length > 0 ? (
        <>
          {selectedSecureContent.Type.toUpperCase() === "ADDRESS" ? (
            <div className="flex flex-col gap-3 p-3 pt-0">
              <AddressForm address={selectedSecureContent.Content as Address} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3 pt-0">
              <SecureContentForm
                contentData={selectedSecureContent?.Content as GenericSecureContent}
                contentTemplateFields={selectedContentTemplate?.Fields || []}
              />
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
            <label htmlFor="jw-preferredBeneficiaries" className="block text-sm font-semibold uppercase tracking-normal text-gray-900">
              Preferred Beneficiaries
            </label>
            <select
              id="jw-preferredBeneficiaries"
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
