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
  JWErrorAuthenticationRequired,
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
  serviceProviderID: ServiceProviderID;
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
  beneficiaryIDs,
  onError,
  onContentSharedWithServiceProvider,
  onContentUnsharedWithServiceProvider,
  onContentSharedWithBeneficiary,
  onContentUnsharedWithBeneficiary,
}) => {
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo>({ userID: "", individualID: "", serviceProviderID: "", token: "" });
  const [internalIndividualID, setInternalIndividualID] = useState<IndividualID>("");

  const [secureContents, setSecureContents] = useState<Record<SecureContentID, SecureContent>>({} as Record<SecureContentID, SecureContent>);
  const [selectedSecureContent, setSelectedSecureContent] = useState<SecureContent>({} as SecureContent);

  const [contentTemplates, setContentTemplates] = useState<SecureContentTemplate[]>([]);
  const [selectedContentTemplate, setSelectedContentTemplate] = useState<SecureContentTemplate>({} as SecureContentTemplate);

  const [showGenPrimaryToken, setShowGenPrimaryToken] = useState<boolean>(false);
  const [showGenSecondaryToken, setShowGenSecondaryToken] = useState<boolean>(false);
  const [showUnsharePrimaryToken, setShowUnsharePrimaryToken] = useState<boolean>(false);
  const [showUnshareSecondaryToken, setShowUnshareSecondaryToken] = useState<boolean>(false);

  const [sharedWithServiceProvider, setSharedWithServiceProvider] = useState<boolean>(false);
  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>({} as ServiceProvider);
  const [reprocessOne, setReprocessOne] = useState<boolean>(false);

  const [sharedWithBeneficiary, setSharedWithBeneficiary] = useState<boolean>(false);
  const [beneficiaries, setBeneficiaries] = useState<Record<BeneficiaryID, Beneficiary>>({});
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

  const resetServiceProviderState = () => {
    setServiceProvider({} as ServiceProvider);
  };

  const resetBeneficiariesState = () => {
    setBeneficiaries({} as Record<BeneficiaryID, Beneficiary>);
    setSelectedBeneficiary({} as Beneficiary);
  };

  const resetBeneficiaryShareState = () => {
    setShowGenSecondaryToken(false);
    setShowUnshareSecondaryToken(false);
    setSharedWithBeneficiary(false);
  };

  const resetSecureContentsState = () => {
    setSecureContents({} as Record<SecureContentID, SecureContent>);
  };

  const resetSelectedSecureContent = () => {
    setSelectedSecureContent({} as SecureContent);
  };

  const resetContentTemplatesState = () => {
    setContentTemplates([]);
  };

  const resetSelectedContentTemplate = () => {
    setSelectedContentTemplate({} as SecureContentTemplate);
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

    if (authToken === undefined || authToken.trim().length === 0) {
      console.error("JustWhere: no authToken provided or authToken is not a string");
      raiseError(new JWErrorAuthenticationRequired("no authToken or authToken is not a string or is empty"));
      return;
    }

    const req: CurrentUserInfoRequest = { hostPort: hostPort, authToken: authToken };
    GetCurrentUserInfo(req)
      .then((response) => {
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
    // Early return if no user ID
    if (!currentUserInfo.individualID?.trim()) {
      resetServiceProviderState();
      return;
    }

    // Early return if no valid service provider ID
    if (!serviceProviderID?.trim()) {
      resetServiceProviderState();
      console.error("JustWhere: no valid service provider ID provided or service provider ID is not a string");
      return raiseError(new JWError("no valid service provider ID provided or service provider ID is not a string"));
    }

    const fetchServiceProviderInfo = async () => {
      try {
        const req: ServiceProviderInfoRequest = {
          hostPort,
          authToken,
          serviceProviderID,
        };

        const response = await GetServiceProviderInfo(req);
        setServiceProvider(response.serviceProvider);
      } catch (error) {
        console.error("JustWhere: error fetching service provider details:", error);
        return raiseError(error as JWError);
      }
    };

    fetchServiceProviderInfo();
  }, [currentUserInfo.individualID, serviceProviderID]);

  /* retrieve preferred beneficiaries details */
  useEffect(() => {
    if (currentUserInfo.individualID.trim().length === 0) {
      resetBeneficiariesState();
      return;
    }

    if (!beneficiaryIDs || !Array.isArray(beneficiaryIDs) || beneficiaryIDs.some((item) => typeof item !== "string") || beneficiaryIDs.length === 0) {
      resetBeneficiariesState();
      return;
    }

    const fetchBeneficiaries = async (benIDs: BeneficiaryID[]) => {
      try {
        const responses = await Promise.all(benIDs.map((benID) => GetBeneficiaryInfo({ hostPort, authToken, beneficiaryID: benID.trim() })));

        const beneficiaries = responses.map((response) => response.beneficiary).filter(Boolean) as Beneficiary[];

        console.debug(`JustWhere: retrieved ${beneficiaries.length} beneficiaries`);

        const beneficiariesInfo = beneficiaries.reduce<Record<BeneficiaryID, Beneficiary>>(
          (acc, cur) => ({
            ...acc,
            [cur.ID]: cur,
          }),
          {},
        );

        setBeneficiaries(beneficiariesInfo);

        if (beneficiaries.length > 0) {
          setSelectedBeneficiary(beneficiaries[0]);
        }
      } catch (error) {
        console.error("JustWhere: error fetching beneficiaries:", error);
        resetBeneficiariesState();
        return raiseError(error as JWError);
      }
    };

    fetchBeneficiaries([...beneficiaryIDs]);
  }, [currentUserInfo.individualID, beneficiaryIDs]);

  /* select a beneficiary if necessary */
  useEffect(() => {}, [beneficiaries]);

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

  /* select a secure content if necessary while considering any provided content id*/
  useEffect(() => {
    if (!secureContents || Object.keys(secureContents).length === 0) {
      resetSelectedSecureContent();
      return;
    }

    let currentSelection = selectedSecureContent;

    // is there an existing selected secure content?
    if (currentSelection.ID !== undefined && currentSelection.ID.trim().length !== 0) {
      // a secure content is already selected

      // check if the selected secure content exists in the secure contents list because the content list may have been updated
      {
        const foundContent = secureContents[currentSelection.ID];
        if (!foundContent) {
          console.warn(
            "JustWhere: the selected secure content with ID",
            currentSelection.ID,
            "was not found in the list of secure contents. resetting to first content",
          );
          currentSelection = secureContents[Object.keys(secureContents)[0]];
          setSelectedSecureContent(currentSelection);
        } else {
          currentSelection = foundContent; // should be same as the selected content
        }
      }

      if (contentID === undefined || contentID.trim().length === 0) {
        // no content ID provided, so keep the current selection
        return;
      }

      // if provided content ID is the same as the selected content, then do nothing
      if (currentSelection.ID.toLowerCase() === contentID.toLowerCase()) {
        return;
      }

      // provided content type is different from the selected content template
      // if it exists in the list, then select it
      const foundContent = secureContents[contentID];

      if (foundContent === undefined) {
        console.warn("JustWhere: no content found with ID", contentID, "in the current list of secure contents. keeping the current selection");
        return;
      }

      setSelectedSecureContent(foundContent);
    } else {
      // no previous selected content

      // if no content ID is provided, then select the first content from the list
      if (contentID === undefined || contentID.trim().length === 0) {
        setSelectedSecureContent(secureContents[Object.keys(secureContents)[0]]);
        return;
      }

      // if provided content ID does not exist in the list, then select the first content from the list
      const foundContent = secureContents[contentID];

      if (foundContent === undefined) {
        console.warn("JustWhere: no content found with ID", contentID, "in the current list of secure contents. setting to first content");
        setSelectedSecureContent(secureContents[Object.keys(secureContents)[0]]);
        return;
      }

      // provided content type exists in the list, select it
      setSelectedSecureContent(foundContent);
    }
  }, [secureContents, contentID]);

  /* retrieve the contents matching the selected content type */
  useEffect(() => {
    if (currentUserInfo.individualID.trim().length === 0) {
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
          individualID: currentUserInfo.individualID,
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
        setSelectedSecureContent({} as SecureContent);
        setSecureContents(contentMap);
      } catch (error) {
        console.error("JustWhere: error fetching secured contents:", error);
        return raiseError(error as JWError);
      }
    };

    getOwnerSecureContents();
  }, [currentUserInfo.individualID, selectedContentTemplate]);

  /* select a content type if necessary while considering any provided content template */
  useEffect(() => {
    if (contentTemplates === undefined || contentTemplates.length === 0) {
      resetSelectedContentTemplate();
      return;
    }

    let currentTemplate = selectedContentTemplate;

    // is there an existing selected content template?
    if (currentTemplate.ID !== undefined && currentTemplate.ID.trim().length !== 0) {
      // a template is already selected

      // check if the selected template exists in the content template list because the content template list may have been updated
      {
        const foundTemplate = contentTemplates.find(
          (template) => template.ID.toLowerCase() === currentTemplate.ID.toLowerCase() || template.Type.toLowerCase() === currentTemplate.Type.toLowerCase(),
        );
        if (!foundTemplate) {
          console.warn(
            `JustWhere: the selected content template (${currentTemplate.ID}, ${currentTemplate.Type}) was not found in the list of content templates. resetting to first template`,
          );
          currentTemplate = contentTemplates[0];
          setSelectedContentTemplate(currentTemplate);
        } else {
          currentTemplate = foundTemplate; // should be same as the selected template
        }
      }

      if (contentType === undefined || contentType.trim().length === 0) {
        // no content type provided, so keep the current selection
        return;
      }

      // if provided content type is the same as the selected content template, then do nothing
      if (currentTemplate.ID.toLowerCase() === contentType.toLowerCase()) {
        return;
      }

      // provided content type is different from the selected content template
      // if it exists in the list, then select it
      const foundTemplate = contentTemplates.find(
        (template) => template.Type.toLowerCase() === contentType.toLowerCase() || template.ID.toLowerCase() === contentType.toLowerCase(),
      );

      if (foundTemplate === undefined) {
        console.warn(
          `JustWhere: no content template of type ${currentTemplate.Type}) was found in the list of content templates. keeping the current selection`,
        );
        return;
      }

      setSelectedContentTemplate(foundTemplate);
    } else {
      // no previous selected content template

      // if no content type is provided, then select the first template from the list
      if (contentType === undefined || contentType.trim().length === 0) {
        setSelectedContentTemplate(contentTemplates[0]);
        return;
      }

      // if provided content type does not exist in the list, then select the first template from the list
      const foundTemplate = contentTemplates.find(
        (template) => template.Type.toLowerCase() === contentType.toLowerCase() || template.ID.toLowerCase() === contentType.toLowerCase(),
      );

      if (foundTemplate === undefined) {
        console.warn(`JustWhere: no content template of type ${contentType} was found in the list of content templates. setting to first template`);
        setSelectedContentTemplate(contentTemplates[0]);
        return;
      }

      // provided content type exists in the list, select it
      setSelectedContentTemplate(foundTemplate);
    }
  }, [contentType, contentTemplates]);

  /* retrieve the templates matching the content filter */
  useEffect(() => {
    if (!currentUserInfo.individualID.trim()) {
      resetContentTemplatesState();
      return;
    }

    if (!contentTypeFilter || !contentTypeFilter.length) {
      resetContentTemplatesState();
      return;
    }

    if (!Array.isArray(contentTypeFilter) || !contentTypeFilter.every((item) => typeof item === "string")) {
      resetContentTemplatesState();
      return;
    }

    const providedFilters = new Set(contentTypeFilter.map((f) => f.toLowerCase().trim()));

    const fetchTemplates = async () => {
      try {
        const req: ServiceProviderTemplatesRequest = {
          hostPort,
          authToken,
          serviceProviderID: currentUserInfo.serviceProviderID,
        };

        const allTemplates = await GetTemplatesForServiceProvider(req);

        const matchedTemplates = allTemplates.filter(
          (template) => providedFilters.has(template.ID.toLowerCase().trim()) || providedFilters.has(template.Type.toLowerCase().trim()),
        );

        setContentTemplates(matchedTemplates);

        console.debug("JustWhere: retrieved", matchedTemplates.length, "matching content templates");
        {
          // let selectedTemplate = allTemplates[0];
          // if (contentType) {
          //   selectedTemplate =
          //     allTemplates.find(
          //       (template) =>
          //         template.ID.toLowerCase().trim() === contentType?.trim().toLowerCase() ||
          //         template.Type.toLowerCase().trim() === contentType?.trim().toLowerCase(),
          //     ) || ({} as SecureContentTemplate);
          //   if (!selectedTemplate || selectedTemplate.ID === undefined || selectedTemplate.ID.trim().length === 0) {
          //     console.warn("JustWhere: no matching content template found for", contentType, ". setting to first template");
          //     selectedTemplate = allTemplates[0];
          //   }
          // }
          // // if selected template is not the same as the selected content template, then set the selected content template
          // if (selectedContentTemplate.ID === undefined || selectedContentTemplate.ID.trim().length === 0) {
          //   setSelectedContentTemplate(selectedTemplate);
          // } else if (selectedTemplate.ID.trim() !== selectedContentTemplate.ID.trim()) {
          //   setSelectedContentTemplate(selectedTemplate);
          // }
        }
      } catch (error) {
        console.error("JustWhere: error fetching templates:", error);
        raiseError(error as JWError);
      }
    };

    fetchTemplates();
  }, [currentUserInfo.individualID, contentTypeFilter]);

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
