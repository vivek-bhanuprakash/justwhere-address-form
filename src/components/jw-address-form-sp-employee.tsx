import React, { useCallback, useEffect, useState } from "react";
import { IsEmptyUser, useFetchCurrentUserInfo as useFetchCurrentUserInfo } from "../hooks/useFetchCurrentUserInfo";
import { useFetchServiceProvider } from "../hooks/useFetchServiceProvider";
import { useFetchServiceProviderTemplates } from "../hooks/useFetchServiceProviderTemplates";

import {
  Address, AllAddressSharesWithServiceProviderRequest, AllSecureContentSharesWithServiceProviderRequest, GenericSecureContent, GetAllAddressSharesWithServiceProvider, GetAllSecureContentSharesWithServiceProvider, GetSecureContentUsingPrimaryToken, IndividualID, JWError, NULL_UUID, PrimaryToken, PrimaryTokenSecureContentRequest,
  SecureContent,
  SecureContentID,
  SecureContentTemplate, ServiceProviderID
} from "../util";
import AddressForm from "./internal/address";
import Label from "./internal/label";
import SecureContentForm from "./internal/secure_content_form";
import { OnErrorFcn } from "./types";
import { useFetchContentTemplates } from "../hooks/useFetchContentTemplates";
import NothingShared from "./internal/nothing_shared";

const UUID_PATTERN = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;

export interface ContentFormProps {
  hostPort: string;
  authToken: string;
  individualID: IndividualID;
  contentTypeFilter: string[];
  serviceProviderID: ServiceProviderID;
  onError: OnErrorFcn;
}

const maskFields = (address: Address): Address => {
  address.IndividualID = valueOrHidden(address?.IndividualID);
  address.ID = valueOrHidden(address?.ID);
  address.Label = valueOrHidden(address?.Label);
  address.Name = valueOrHidden(address?.Name);
  address.Street1 = valueOrHidden(address?.Street1);
  address.Street2 = valueOrHidden(address?.Street2);
  address.Street3 = valueOrHidden(address?.Street3);
  address.City = valueOrHidden(address?.City);
  address.State = valueOrHidden(address?.State);
  address.PostCode = valueOrHidden(address?.PostCode);
  address.Country = valueOrHidden(address?.Country);
  address.Phone = valueOrHidden(address?.Phone);
  address.Email = valueOrHidden(address?.Email);

  for (const key in address.Tags) {
    const tag = address.Tags[key];
    if (tag === undefined) address.Tags[key] = "hidden";
    if (tag === null) address.Tags[key] = "hidden";
    if (tag === "") address.Tags[key] = "hidden";
  }

  return address;
};

const valueOrHidden = (field: string | undefined): string => {
  if (field === undefined || field === null || field.trim().length === 0) return "hidden";
  return field;
};

const JWContentFormServiceProviderEmployee: React.FC<ContentFormProps> = ({
  hostPort,
  authToken,
  individualID,
  contentTypeFilter,
  serviceProviderID,
  onError,
}) => {
  const { currentUser, } = useFetchCurrentUserInfo({ hostPort, authToken, onError });
  const { serviceProvider, } = useFetchServiceProvider({ hostPort, authToken, currentUser, serviceProviderID, onError });
  const { templates: spTemplates, } = useFetchServiceProviderTemplates({ hostPort, authToken, currentUser, serviceProvider, onError });
  const { templates: contentTemplates, } = useFetchContentTemplates({ currentUser, spTemplates, contentTypeFilter, onError });
  const [selectedContentTemplate, setSelectedContentTemplate] = useState<SecureContentTemplate>({} as SecureContentTemplate);
  const [secureContents, setSecureContents] = useState<Record<SecureContentID, SecureContent>>({} as Record<SecureContentID, SecureContent>);
  const [selectedSecureContent, setSelectedSecureContent] = useState<SecureContent>({} as SecureContent);

  const raiseError = useCallback((err: JWError) => {
    if (onError === undefined || typeof onError !== "function") {
      console.warn("JustWhere: onError function is not provided or not a function");
      return;
    }
    try {
      onError(err);
    } catch (e) {
      console.error("JustWhere: error in onError callback: ", e);
    }
  }, [onError]);

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

  const resetSecureContents = () => {
    setSecureContents({} as Record<SecureContentID, SecureContent>);
  };

  const resetSelectedSecureContent = () => {
    setSelectedSecureContent({} as SecureContent);
  };

  const resetSelectedContentTemplate = () => {
    setSelectedContentTemplate({} as SecureContentTemplate);
  };

  /* when the secure contents change, select a secure content from it
  if necessary or keep the existing selection if applicable */
  useEffect(() => {

    if (!secureContents || Object.keys(secureContents).length === 0) {
      resetSelectedSecureContent();
      return;
    }

    // if nothing is selected, then select the first secure content from the list
    if (!selectedSecureContent || !selectedSecureContent.ID || !selectedSecureContent.ID.trim().length) {
      setSelectedSecureContent(secureContents[Object.keys(secureContents)[0]]);
      return;
    }

    // a selection exists. if the selected secure content is not in the list, select the first secure content from the list
    if (
      !Object.entries(secureContents).find(([contentID, content]) => content.ID.toLowerCase() === selectedSecureContent.ID.toLowerCase() || content.Type.toLowerCase() === selectedSecureContent.Type.toLowerCase())
    ) {
      setSelectedSecureContent(secureContents[Object.keys(secureContents)[0]]);
      return;
    }

    // selected secure content is present in the list, so do nothing
    return;
  }, [secureContents]);

  /* when the selected content type changes, retrieve the matching shared contents */
  useEffect(() => {
    const indID = individualID?.trim();

    if (!indID || !indID.trim().length) {
      console.error("JustWhere: individual ID is required");
      resetSecureContents();
      return raiseError(new JWError("individual ID is required"));
    }

    if (!UUID_PATTERN.test(indID)) {
      console.error("JustWhere: individual ID is not a valid UUID:", indID);
      resetSecureContents();
      return raiseError(new JWError("individual ID is not a valid UUID"));
    }

    if (!selectedContentTemplate.Type || !selectedContentTemplate.Type.trim().length) {
      resetSecureContents();
      return;
    }

    const fn = async () => {

      let contentIDTokens: Record<SecureContentID, PrimaryToken> = {};

      // if the current template is for an address, then get all the addresses shared with the service provider
      if (selectedContentTemplate.Type.toUpperCase() === "ADDRESS") {
        try {
          const req: AllAddressSharesWithServiceProviderRequest = {
            hostPort: hostPort,
            authToken: authToken,
            serviceProviderID: serviceProviderID,
            individualID: indID,
          };
          const response = await GetAllAddressSharesWithServiceProvider(req);

          if (!response.shares || !response.shares.length) {
            console.debug(`JustWhere: individual has no address shares with service provider`);
            resetSecureContents();
            return;
          }

          // only keep addresses that are not shared with a beneficiary
          response.shares = response.shares.filter((share) => share.beneficiaryID === NULL_UUID);

          console.debug(`JustWhere: individual has shared ${response.shares.length} addresses with service provider`);

          contentIDTokens = response.shares.reduce((acc, share) => {
            acc[share.addressID!] = share.token!;
            return acc;
          }, {} as Record<SecureContentID, PrimaryToken>);
        } catch (e) {
          console.error("JustWhere: error fetching address shares:", e);
          resetSecureContents();
          return raiseError(e as JWError);
        }
      } else {
        try {
          const req: AllSecureContentSharesWithServiceProviderRequest = {
            hostPort: hostPort,
            authToken: authToken,
            serviceProviderID: serviceProviderID,
            individualID: indID,
          };
          const response = await GetAllSecureContentSharesWithServiceProvider(req);

          if (!response.shares || !response.shares.length) {
            console.debug(`JustWhere: individual has no secure content shares with service provider`);
            resetSecureContents();
            return;
          }

          // filter out any shares that have a beneficiary ID filled in
          response.shares = response.shares.filter((share) => share.beneficiaryID === NULL_UUID);

          console.debug(`JustWhere: individual has shared ${response.shares.length} secure content(s) with service provider`);

          contentIDTokens = response.shares.reduce((acc, share) => {
            acc[share.securedcontentID!] = share.token!;
            return acc;
          }, {} as Record<SecureContentID, PrimaryToken>);
        } catch (e) {
          console.error("JustWhere: error fetching secure content shares:", e);
          resetSecureContents();
          return raiseError(e as JWError);
        }
      }

      // load all the secure contents (either addresses or secure contents)
      const contentReqs = Object.entries(contentIDTokens).map(([contentID, primaryToken]) => {
        const contentIDLower = contentID.toLowerCase();
        const pkToken = primaryToken;
        const req: PrimaryTokenSecureContentRequest = {
          hostPort: hostPort,
          authToken: authToken,
          individualID: indID,
          contentID: contentIDLower,
          contentTemplates: [selectedContentTemplate],
          serviceProviderID: serviceProvider.ID,
          token: pkToken,
        };
        return GetSecureContentUsingPrimaryToken(req);
      });

      try {
        const contentResponses = await Promise.all(contentReqs);
        const contents = contentResponses
          .filter(response =>
            (response.content && response.content.Type) && (
              response.content.Type.toLowerCase() === selectedContentTemplate.Type.toLowerCase() ||
              response.content.ID.toLowerCase() === selectedContentTemplate.ID.toLowerCase())
          )
          .map((response) => {
            // if the content is an address, then mask the fields that are not relevant to the service provider
            if (response.content.Type.toUpperCase() === "ADDRESS") {
              response.content.Content = maskFields(response.content.Content as Address);
            }
            return response;
          })
          .reduce((acc, response) => {
            acc[response.content.ID] = response.content;
            return acc;
          }, {} as Record<SecureContentID, SecureContent>);
        setSecureContents(contents);
      } catch (e) {
        console.error("JustWhere: error fetching secure contents for selected template:", e);
        return raiseError(e as JWError);
      }
    }

    fn();
  }, [selectedContentTemplate]);

  /* when the content templates change, select a content type from it
  if necessary or keep the existing selection if applicable */
  useEffect(() => {
    if (contentTemplates === undefined || contentTemplates.length === 0) {
      resetSelectedContentTemplate();
      return;
    }

    // if nothing is selected, then select the first template from the list
    if (!selectedContentTemplate || !selectedContentTemplate.ID || !selectedContentTemplate.ID.trim().length) {
      setSelectedContentTemplate(contentTemplates[0]);
      return;
    }

    // a selection exists. if the selected content template is not in the list, select the first template from the list
    if (
      !contentTemplates.find(
        (t) => t.ID.toLowerCase() === selectedContentTemplate.ID.toLowerCase() || t.Type.toLowerCase() === selectedContentTemplate.Type.toLowerCase(),
      )
    ) {
      console.debug("JustWhere: selected content template is not present in the list of content templates. setting to first template");
      setSelectedContentTemplate(contentTemplates[0]);
      return;
    }

    // selected content template is present in the list, so do nothing
    return;
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
          {!IsEmptyUser(currentUser) ? (
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
          {Object.keys(secureContents).length > 0 ? (
            <>
              <Label htmlFor="mysecurecontents">Select {selectedContentTemplate.Label}</Label>
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
            </>
          ) : (
          <NothingShared/>
          )}
        </div>
      </div>

      {selectedSecureContent?.Type?.length > 0 ? (
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
        Object.keys(secureContents).length > 0 && <NothingShared />
      )}
    </div>
  );
};

export default JWContentFormServiceProviderEmployee;
