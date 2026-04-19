import { X } from "lucide-react";
import type { FormEvent } from "react";
import Button from "../Button";
import Input from "../Input";

interface EditProfileModalProps {
  isOpen: boolean;
  newUsername: string;
  newEmail: string;
  confirmUsername: string;
  description: string;
  password: string;
  isUpdating: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onConfirmUsernameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

const EditProfileModal = ({
  isOpen,
  newUsername,
  newEmail,
  confirmUsername,
  description,
  password,
  isUpdating,
  onClose,
  onSubmit,
  onUsernameChange,
  onEmailChange,
  onConfirmUsernameChange,
  onDescriptionChange,
  onPasswordChange,
}: EditProfileModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card w-full max-w-[600px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
        >
          <X size={40} />
        </button>

        <h2 className="text-3xl font-semibold text-white mb-6 mt-8">
          Edit profile
        </h2>

        <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
          <Input
            labelTitle="New username"
            inputName="newUsername"
            inputType="text"
            inputPlaceHolder="Your username"
            value={newUsername}
            onChange={(e) => onUsernameChange(e.target.value)}
            wrapperClassName="!mt-2"
            labelClassName="!font-normal !text-base"
          />

          <Input
            labelTitle="Email address"
            inputName="newEmail"
            inputType="email"
            inputPlaceHolder="Your email"
            value={newEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            wrapperClassName="!mt-5"
            labelClassName="!font-normal !text-base"
          />

          <Input
            labelTitle="Confirm username"
            inputName="confirmUsername"
            inputType="text"
            inputPlaceHolder="Confirm your username"
            value={confirmUsername}
            onChange={(e) => onConfirmUsernameChange(e.target.value)}
            wrapperClassName="!mt-5"
            labelClassName="!font-normal !text-base"
          />

          <div className="flex flex-col w-4/6 mt-5">
            <label className="text-base font-normal pl-2 pb-2 text-white">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Tell people a bit about yourself"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              maxLength={300}
              rows={5}
              className="bg-input-bg hover:bg-input-hover placeholder:text-black/50 text-black p-3 rounded-3xl border border-border hover:outline-1 focus:outline-2 w-full resize-none"
            />
            <p className="text-right text-sm text-gray-400 mt-2">
              {description.length}/300
            </p>
          </div>

          <Input
            labelTitle="Current password"
            inputName="password"
            inputType="password"
            inputPlaceHolder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            wrapperClassName="!mt-2"
            labelClassName="!font-normal !text-base"
          />

          <Button
            labelTitle={isUpdating ? "Saving..." : "Save changes"}
            type="submit"
            disabled={isUpdating}
            className="mt-6 mb-4"
          />
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
