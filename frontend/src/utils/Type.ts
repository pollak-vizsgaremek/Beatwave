import type { ReactNode } from "react";

interface InputProps {
  labelTitle?: string;
  inputType: string;
  inputName: string;
  inputPlaceHolder?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  forgotPwd?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ButtonProps {
  labelTitle: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export type { InputProps, ButtonProps };
