import { type ButtonProps } from "../utils/Type";

const Button = ({ labelTitle, type, disabled, className }: ButtonProps) => {
  return (
    <button
      className={`mt-16 px-12 py-4 bg-[#C5E1ED] rounded-3xl text-black font-medium hover:bg-[#C5E1ED]/80 hover:outline-1 focus:outline-2 border border-border cursor-pointer ${className}`}
      type={type}
      disabled={disabled}
    >
      {labelTitle}
    </button>
  );
};

export default Button;
