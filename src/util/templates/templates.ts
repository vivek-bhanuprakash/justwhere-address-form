import { SecureContentTemplate, SecureContentTemplateField, SecureContentType } from "../types/types";

const insurance_details_fields: SecureContentTemplateField[] = [
  { ID: "name", Label: "Name", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "policyno", Label: "Policy No.", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "effectivedate", Label: "Effective Date", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "expirydate", Label: "Expiry Date", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "amount", Label: "Amount", Type: "alphanumeric" } as SecureContentTemplateField,
];

const employee_records_fields: SecureContentTemplateField[] = [
  { ID: "name", Label: "Name", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "employeeId", Label: "Employee Id", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "hiredate", Label: "Hire Date", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "employeessn", Label: "SSN", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "birthdate", Label: "Date of Birth", Type: "alphanumeric" } as SecureContentTemplateField,
];

const notes_fields: SecureContentTemplateField[] = [
  { ID: "title", Label: "Title", Type: "alphanumeric" } as SecureContentTemplateField,
  { ID: "description", Label: "Description", Type: "textarea" } as SecureContentTemplateField,
];

export const DefaultTemplates = (): SecureContentTemplate[] => {
  return [
    { ID: "address", Name: "Address", Fields: [] } as SecureContentTemplate,
    { ID: "employee_records", Name: "Employee Record", Fields: employee_records_fields } as SecureContentTemplate,
    { ID: "insurance_details", Name: "Insurance Record", Fields: insurance_details_fields } as SecureContentTemplate,
    { ID: "notes", Name: "Notes", Fields: notes_fields } as SecureContentTemplate,
  ];
};

export const DefaultTemplatesByType = (): Record<SecureContentType, SecureContentTemplate> => {
  return {
    address: { ID: "address", Name: "Address", Fields: [] } as SecureContentTemplate,
    employee_records: { ID: "employee_records", Name: "Employee Record", Fields: employee_records_fields } as SecureContentTemplate,
    insurance_details: { ID: "insurance_details", Name: "Insurance Record", Fields: insurance_details_fields } as SecureContentTemplate,
    notes: { ID: "notes", Name: "Notes", Fields: notes_fields } as SecureContentTemplate,
  } as Record<SecureContentType, SecureContentTemplate>;
};
