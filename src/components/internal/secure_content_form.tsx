import { SecureContent, SecureContentTemplateField } from "../../util";
import Input from "./input";
import Label from "./label";

interface SecureContentFormProps {
  contentTemplate: SecureContentTemplateField[];
  contentData: SecureContent;
}

const SecureContentForm: React.FC<SecureContentFormProps> = ({ contentTemplate, contentData }) => {
  return (
    <div className="grid gap-3">
      {contentTemplate.map((templateField) => {
        const dataField = contentData.Content[templateField.ID];
        if (dataField !== undefined) {
          return (
            <div key={templateField.ID}>
              <Label htmlFor={templateField.ID}>{templateField.Label}</Label>
              {templateField.Type === "alphanumeric" ? (
                <Input type="text" id={templateField.ID} name={templateField.ID} placeholder={templateField.ID} value={dataField || ""} />
              ) : templateField.Type === "textarea" ? (
                <Input type="textarea" id={templateField.ID} name={templateField.ID} placeholder={templateField.ID} value={dataField || ""} />
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
