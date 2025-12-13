import { type InputProps } from "../utils/Type";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({
  wrapperClassName,
  labelClassName,
  labelTitle,
  inputType,
  inputName,
  inputPlaceHolder,
  inputClassName,
  forgotPwd,
  icon,
  value,
  onChange,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const currentType =
    inputType === "password" ? (showPassword ? "text" : "password") : inputType;

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={`flex flex-col w-4/6 mt-6 ${wrapperClassName}`}>
      {labelTitle && (
        <label className={`text-2xl font-semibold pl-2 pb-2 ${labelClassName}`}>
          {labelTitle}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#13313D]">
            {icon}
          </div>
        )}
        <input
          type={currentType}
          name={inputName}
          placeholder={inputPlaceHolder}
          value={value}
          onChange={onChange}
          className={`bg-input-bg hover:bg-input-hover placeholder:text-white/70 text-black p-2 rounded-3xl border border-border hover:outline-2 focus:outline-2 w-full ${
            icon ? "pl-10" : "pl-3"
          } ${inputType === "password" ? "pr-10" : ""} ${inputClassName}`}
        />
        {inputType === "password" && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#13313D] hover:text-black cursor-pointer z-10"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {forgotPwd && (
        <p className="text-sm hover:underline self-end mt-2 mr-2 hover:cursor-pointer">
          Elfelejtetted a Jelszavad?
        </p>
      )}
    </div>
  );
};

export default Input;
