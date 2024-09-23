import { Address } from "../../util";
import Input from "./input";
import Label from "./label";

export interface AddressFormProps {
  address: Address;
}

const AddressForm: React.FC<AddressFormProps> = ({ address }: AddressFormProps) => {
  return (
    <>
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
    </>
  );
};
export default AddressForm;
