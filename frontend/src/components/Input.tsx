import { type InputProps } from "../utils/Type";

const Input = ({
  wrapperClassName,
  labelClassName,
  labelTile,
  inputType,
  inputName,
  inputPlaceHolder,
  inputClassName,
  forgotPwd,
}: InputProps) => {
  forgotPwd = forgotPwd ?? false;

  return (
    <div className={`flex flex-col w-4/6 + ${wrapperClassName}`}>
      <label className={`text-2xl font-semibold pl-2 pb-2 + ${labelClassName}`}>
        {labelTile}
      </label>
      <input
        type={inputType}
        name={inputName}
        placeholder={inputPlaceHolder}
        className={`bg-[#4B9FBE] placeholder:text-white text-black p-2 pl-3 rounded-3xl border border-[#13313D] hover:outline-2 focus:outline-2 + ${inputClassName}`}
      />
        {forgotPwd && (
            <p className="text-sm hover:underline self-end mt-2 mr-2 hover:cursor-pointer">
            Elfelejtetted a Jelszavad?
            </p>
        )}
    </div>
  );
};

export default Input;
