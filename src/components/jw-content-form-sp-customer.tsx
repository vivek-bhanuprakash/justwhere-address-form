import React, { useEffect, useRef, useState } from "react";

import {
  Address,
  Beneficiary,
  BeneficiaryID,
  BeneficiarySharesRequest,
  DisablePrimaryToken,
  DisablePrimaryTokenRequest,
  DisableSecondaryToken,
  DisableSecondaryTokenRequest,
  GenereratePrimaryToken,
  GenererateSecondaryToken,
  GenericSecureContent,
  GetOwnerSecureContents,
  GetSharesWithBeneficiary,
  GetSharesWithServiceProvider,
  IndividualID,
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
  ServiceProviderID,
  ServiceProviderSharesRequest
} from "../util";
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
  OnErrorFcn} from "./types";
import { useFetchCurrentUserInfo } from "../hooks/useFetchCurrentUserInfo";
import { useFetchServiceProvider } from "../hooks/useFetchServiceProvider";
import { useFetchServiceProviderTemplates } from "../hooks/useFetchServiceProviderTemplates";
import { useFetchContentTemplates } from "../hooks/useFetchContentTemplates";
import { useFetchBeneficiaries } from "../hooks/useFetchBeneficiaries";

const UUID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;

export interface ContentFormProps {
  hostPort: string;
  authToken: string;
  contentTypeFilter: string[];
  // contentID?: AddressID | SecureContentID;
  // contentType?: string;
  serviceProviderID: ServiceProviderID;
  beneficiaryIDs?: BeneficiaryID[];
  onError: OnErrorFcn;
  onContentSharedWithServiceProvider?: OnContentSharedWithServiceProvider;
  onContentUnsharedWithServiceProvider?: OnContentUnsharedWithServiceProvider;
  onContentSharedWithBeneficiary?: OnContentSharedWithBeneficiary;
  onContentUnsharedWithBeneficiary?: OnContentUnsharedWithBeneficiary;
}

const JWContentFormServiceProviderCustomer: React.FC<ContentFormProps> = ({
  hostPort,
  authToken,
  contentTypeFilter,
  // contentID,
  // contentType,
  serviceProviderID,
  beneficiaryIDs,
  onError,
  onContentSharedWithServiceProvider,
  onContentUnsharedWithServiceProvider,
  onContentSharedWithBeneficiary,
  onContentUnsharedWithBeneficiary,
}) => {

  const { currentUser, } = useFetchCurrentUserInfo({ hostPort, authToken, onError });
  const { serviceProvider, } = useFetchServiceProvider({ hostPort, authToken, currentUser, serviceProviderID, onError });
  const { templates: spTemplates, } = useFetchServiceProviderTemplates({ hostPort, authToken, currentUser, serviceProvider, onError });
  const { templates: contentTemplates, } = useFetchContentTemplates({ currentUser, spTemplates, contentTypeFilter, onError });
  const [internalIndividualID, setInternalIndividualID] = useState<IndividualID>("");
  const [secureContents, setSecureContents] = useState<Record<SecureContentID, SecureContent>>({} as Record<SecureContentID, SecureContent>);
  const [selectedSecureContent, setSelectedSecureContent] = useState<SecureContent>({} as SecureContent);
  const [selectedContentTemplate, setSelectedContentTemplate] = useState<SecureContentTemplate>({} as SecureContentTemplate);

  const [showGenPrimaryToken, setShowGenPrimaryToken] = useState<boolean>(false);
  const [showGenSecondaryToken, setShowGenSecondaryToken] = useState<boolean>(false);
  const [showUnsharePrimaryToken, setShowUnsharePrimaryToken] = useState<boolean>(false);
  const [showUnshareSecondaryToken, setShowUnshareSecondaryToken] = useState<boolean>(false);

  const [sharedWithServiceProvider, setSharedWithServiceProvider] = useState<boolean>(false);

  const [reprocessOne, setReprocessOne] = useState<boolean>(false);

  const [sharedWithBeneficiary, setSharedWithBeneficiary] = useState<boolean>(false);

  const { beneficiaries } = useFetchBeneficiaries({ hostPort, authToken, currentUser, beneficiaryIDs: beneficiaryIDs || [], onError });

  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary>();
  const [reprocessTwo, setReprocessTwo] = useState<boolean>(false);

  const intPrimaryToken = useRef<PrimaryToken>("");
  const intSecondaryToken = useRef<SecondaryToken>("");

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

  const onSelectedBeneficiaryChanged: React.ChangeEventHandler<HTMLSelectElement> = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBeneficiary(beneficiaries[event.target.value]);
  };

  const onContentSharedWithServiceProviderInternal = async () => {
    try {
      console.debug("JustWhere: onContentSharedWithServiceProviderInternal:", selectedSecureContent);
      const request: PrimaryTokenRequest = {
        hostPort: hostPort,
        authToken,
        individualID: internalIndividualID || "",
        ...(selectedSecureContent.Type === "ADDRESS" ? { addressID: selectedSecureContent.ID || "" } : { contentID: selectedSecureContent.ID || "" }),
        serviceProviderID: serviceProviderID || "",
      };

      setReprocessOne(false);
      const response: PrimaryTokenResponse = await GenereratePrimaryToken(request);
      intPrimaryToken.current = response.token;
      setReprocessOne(true);

      if (onContentSharedWithServiceProvider !== undefined || typeof onContentSharedWithServiceProvider === "function") {
        try {
          onContentSharedWithServiceProvider(
            selectedSecureContent.Type,
            request.individualID,
            selectedSecureContent.ID,
            request.serviceProviderID,
            response.token,
          );
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
        ...(selectedSecureContent.Type === "ADDRESS" ? { addressID: selectedSecureContent.ID || "" } : { contentID: selectedSecureContent.ID || "" }),
        serviceProviderID: serviceProviderID || "",
      };

      await DisablePrimaryToken(request);
      intPrimaryToken.current = "";
      setReprocessOne(true);

      if (onContentUnsharedWithServiceProvider !== undefined && typeof onContentUnsharedWithServiceProvider === "function") {
        try {
          onContentUnsharedWithServiceProvider(selectedSecureContent.Type, request.individualID, selectedSecureContent.ID, request.serviceProviderID);
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
      const request: SecondaryTokenRequest = {
        hostPort,
        authToken,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        token: intPrimaryToken.current || "",
      };

      setReprocessTwo(false);
      const response = await GenererateSecondaryToken(request);
      intSecondaryToken.current = response.token;
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

    setReprocessTwo(false);
    try {
      const request: DisableSecondaryTokenRequest = {
        hostPort: hostPort,
        authToken,
        serviceProviderID: serviceProvider?.ID || "",
        beneficiaryID: selectedBeneficiary?.ID || "",
        secondaryToken: intSecondaryToken.current || "",
      };

      await DisableSecondaryToken(request);
      intSecondaryToken.current = "";
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

  const resetBeneficiaryShareState = () => {
    setShowGenSecondaryToken(false);
    setShowUnshareSecondaryToken(false);
    setSharedWithBeneficiary(false);
  };

  const resetSecureContentsState = () => {
    setSecureContents({} as Record<SecureContentID, SecureContent>);
  };

  /* select a beneficiary if necessary */
  useEffect(() => {
    if (!beneficiaries || Object.keys(beneficiaries).length === 0) {
      setSelectedBeneficiary({} as Beneficiary);
    } else if (!selectedBeneficiary?.ID) {
      setSelectedBeneficiary(Object.values(beneficiaries)[0] || {} as Beneficiary);
    } else {
      setSelectedBeneficiary(beneficiaries[selectedBeneficiary.ID] || Object.values(beneficiaries)[0] || {} as Beneficiary);
    }
  }, [beneficiaries]);

  /* check if secure content is already shared with beneficiary */
  useEffect(() => {
    if (selectedSecureContent === undefined || selectedSecureContent.ID === undefined || selectedSecureContent.ID.trim().length === 0) {
      resetBeneficiaryShareState();
      return;
    }

    if (serviceProvider === undefined || serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) {
      resetBeneficiaryShareState();
      return;
    }

    if (selectedBeneficiary === undefined || selectedBeneficiary.ID === undefined || selectedBeneficiary.ID.trim().length === 0) {
      resetBeneficiaryShareState();
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
      console.debug("JustWhere: selected secure content is shared", response.shares.length, "time(s) with this beneficiary");
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

        intSecondaryToken.current = "";
      } else {
        setShowGenSecondaryToken(false);
        setShowUnshareSecondaryToken(true);
        setSharedWithBeneficiary(true);

        intSecondaryToken.current = response.shares[0].token || "";
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

    if (serviceProvider.ID === undefined || serviceProvider.ID.trim().length === 0) {
      setShowGenPrimaryToken(false);
      setShowUnsharePrimaryToken(false);
      setSharedWithServiceProvider(false);
      return;
    }

    // is this secure content already shared with the service provider?
    const request: ServiceProviderSharesRequest = {
      hostPort: hostPort,
      authToken: authToken,
      contentID: selectedSecureContent.ID,
      contentTemplate: selectedContentTemplate,
      serviceProviderID: serviceProvider.ID,
    };
    GetSharesWithServiceProvider(request)
      .then((response) => {
        console.debug("JustWhere: selected secure content is shared", response.shares.length, "time(s) with this service provider");
        if (response.shares.length === 0) {
          setShowGenPrimaryToken(true);
          setShowUnsharePrimaryToken(false);
          setSharedWithServiceProvider(false);
          intPrimaryToken.current = "";
        } else {
          setShowGenPrimaryToken(false);
          setShowUnsharePrimaryToken(true);
          setSharedWithServiceProvider(true);
          intPrimaryToken.current = response.shares[0].token || "";
        }
      })
      .catch((error) => {
        console.error("JustWhere: error fetching shares for Service Provider: ", error);
        raiseError(error as JWError);
      });
  }, [selectedSecureContent, serviceProvider, reprocessOne]);

  useEffect(() => {
    if (!selectedSecureContent || selectedSecureContent.ID === undefined || selectedSecureContent.ID.trim().length === 0) {
      setSelectedSecureContent(secureContents?.[Object.keys(secureContents)[0]] || ({} as SecureContent));
      return;
    }

    const selection = secureContents?.[selectedSecureContent.ID] || ({} as SecureContent);
    if (!selection || !selection.ID) {
      console.warn(`JustWhere: the selected secure content (${selectedSecureContent.ID} - ${selectedSecureContent.Type}) was not found in the list of secure contents. resetting to first content`);
      setSelectedSecureContent(secureContents?.[Object.keys(secureContents)[0]] || ({} as SecureContent));
      return;
    }
  }, [secureContents, selectedSecureContent]);

  /* retrieve the contents matching the selected content type */
  useEffect(() => {
    if (currentUser.individualID.trim().length === 0) {
      resetSecureContentsState();
      return;
    }

    if (!selectedContentTemplate.Type || !selectedContentTemplate.Type.trim().length) {
      resetSecureContentsState();
      return;
    }

    const getOwnerSecureContents = async () => {
      try {
        const request: OwnerSecureContentsRequest = {
          hostPort: hostPort,
          authToken: authToken,
          individualID: currentUser.individualID,
          templateFilters: [selectedContentTemplate],
        };
        const response = await GetOwnerSecureContents(request);
        console.debug("JustWhere: retrieved", Object.keys(response.contents).length, "secured contents matching template", selectedContentTemplate.Type);
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
      } catch (error) {
        console.error("JustWhere: error fetching secured contents:", error);
        return raiseError(error as JWError);
      }
    };

    getOwnerSecureContents();
  }, [currentUser.individualID, selectedContentTemplate]);

  /* select a content type if necessary while considering any provided content template */
  useEffect(() => {
    // if there is no selected content template, then select the first content template
    if (!selectedContentTemplate || !selectedContentTemplate.Type || !selectedContentTemplate.Type.trim().length) {
      setSelectedContentTemplate(contentTemplates?.[0] || ({} as SecureContentTemplate));
      return;
    }

    const selection = contentTemplates?.find((template) => template.ID.toLowerCase() === selectedContentTemplate.ID.toLowerCase() || template.Type.toLowerCase() === selectedContentTemplate.Type.toLowerCase());
    if (!selection || !selection.ID) {
      console.warn(`JustWhere: the selected content template (${selectedContentTemplate.ID}, ${selectedContentTemplate.Type}) was not found in the list of content templates. resetting to first template`);
      setSelectedContentTemplate(contentTemplates[0]);
      return;
    }
  }, [contentTemplates]);

  return (
    <div className="@container/address-content grid min-w-60 grid-cols-1 items-center justify-start gap-3">
      <div className="@container/address-header flex justify-start bg-gray-800 p-3">
        {hostPort !== undefined && hostPort.trim().length > 0 ? (
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
        ) : (
          <p className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8">JW</p>
        )}

        <div className="flex-col justify-around self-center">
          {currentUser.userID.trim().length !== 0 ? (
            <>
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Securely Share, Track and Notify</p>
              <p className="ml-4 text-sm font-light text-gray-200">{currentUser.userID}</p>
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
          {Object.keys(secureContents).length > 0 && (
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
          )}
        </div>
      </div>

      {selectedSecureContent?.Type?.length > 0 && (
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
      )}

      {serviceProvider?.ID?.trim().length > 0 && (
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
