type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = (props: InputProps) => {
  return (
    <input
      type="text"
      className="w-full rounded-sm border border-gray-300 bg-gray-50 p-1.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      {...props}
    />
  );
};
export default Input;
