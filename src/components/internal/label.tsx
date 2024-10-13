type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;
const Label: React.FC<LabelProps> = (props: LabelProps) => {
  return (
    <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-900" {...props}>
      {props.children}
    </label>
  );
};

export default Label;
