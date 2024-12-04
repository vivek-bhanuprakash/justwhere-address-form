import { GenericSecureContent, SecureContentTemplateField } from "../../util";
import Input from "./input";
import Label from "./label";
import TextArea from "./textarea";

interface SecureContentFormProps {
  contentTemplateFields: SecureContentTemplateField[];
  contentData: GenericSecureContent;
}

const SecureContentForm: React.FC<SecureContentFormProps> = ({ contentTemplateFields, contentData }) => {
  return (
    <div className="grid gap-3">
      {contentTemplateFields.map((templateField) => {
        const dataField = contentData.Content[templateField.ID];
        if (dataField !== undefined) {
          return (
            <div key={templateField.ID}>
              <Label htmlFor={templateField.ID}>{templateField.Label}</Label>
              {templateField.Type === "alphanumeric" ? (
                <Input type="text" id={templateField.ID} name={templateField.ID} placeholder={templateField.ID} value={dataField || ""} />
              ) : templateField.Type === "textarea" ? (
                <TextArea id={templateField.ID} name={templateField.ID} placeholder={templateField.ID} value={dataField || ""} rows={6} />
              ) : (
                <></>
              )}
            </div>
          );
        } else if (templateField.Required !== undefined && templateField.Required) {
          return (
            <div key={templateField.ID}>
              <Label htmlFor={templateField.ID}>{templateField.Label}</Label>
              <Input type="text" id={templateField.ID} name={templateField.ID} placeholder={templateField.Label} value={"<missing>"} readOnly={true} />
            </div>
          );
        } else {
          return <></>;
        }
      })}
    </div>
  );
};

export default SecureContentForm;
