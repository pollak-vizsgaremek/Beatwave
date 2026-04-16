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
  iconLeft,
  iconRight,
  value,
  checked,
  disabled,
  defaultChecked,
  onChange,
  onKeyDown,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const currentType =
    inputType === "password" ? (showPassword ? "text" : "password") : inputType;

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  if (inputType === "checkbox") {
    return (
      <div
        className={`flex items-center gap-3 mt-0 w-auto ${
          wrapperClassName || ""
        } ${disabled ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          name={inputName}
          id={inputName}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className={`w-5 h-5 accent-spotify-green bg-input-bg border-border rounded ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          } ${inputClassName || ""}`}
        />
        {labelTitle && (
          <label
            htmlFor={inputName}
            className={`text-white font-medium select-none ${
              disabled ? "cursor-not-allowed text-gray-400" : "cursor-pointer"
            } ${labelClassName || ""}`}
          >
            {labelTitle}
          </label>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col w-4/6 mt-6 ${wrapperClassName} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {labelTitle && (
        <label className={`text-2xl font-semibold pl-2 pb-2 ${labelClassName}`}>
          {labelTitle}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-border">
            {iconLeft}
          </div>
        )}
        <input
          type={currentType}
          name={inputName}
          placeholder={inputPlaceHolder}
          value={value}
          disabled={disabled}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className={`bg-input-bg hover:bg-input-hover placeholder:text-black/50 text-black p-2 rounded-3xl border border-border hover:outline-1 focus:outline-2 w-full ${
            iconLeft ? "pl-10" : "pl-3"
          } ${inputType === "password" ? "pr-10" : ""} ${
            disabled ? "cursor-not-allowed" : ""
          } ${inputClassName || ""}`}
        />
        {inputType === "password" && !disabled && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-border hover:text-black cursor-pointer z-10"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {iconRight && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-border hover:text-white cursor-pointer z-10">
            {iconRight}
          </div>
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
