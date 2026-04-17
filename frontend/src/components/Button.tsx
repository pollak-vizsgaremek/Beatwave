import { type ButtonProps } from "../utils/Type";

const Button = ({ labelTitle, type, disabled, className, onClick }: ButtonProps) => {
  return (
    <button
      className={`px-12 py-4 bg-[#C5E1ED] rounded-3xl text-black font-medium border border-border transition-all duration-200
        ${disabled
          ? "opacity-40 cursor-not-allowed grayscale-30"
          : "cursor-pointer hover:bg-[#C5E1ED]/80 hover:outline-1 focus:outline-2"
        } ${className}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {labelTitle}
    </button>
  );
};

export default Button;
