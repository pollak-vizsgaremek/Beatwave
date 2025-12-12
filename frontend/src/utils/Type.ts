import type { ReactNode } from "react";

interface InputProps {
  labelTitle: string;
  inputType: string;
  inputName: string;
  inputPlaceHolder: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  forgotPwd?: boolean;
  icon?: ReactNode;
}

interface ButtonProps {
  labelTitle: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export type { InputProps, ButtonProps };
