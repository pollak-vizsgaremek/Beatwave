import { X } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeletingAccount: boolean;
  secondsUntilUnlock: number;
  onClose: () => void;
  onDeleteAccount: () => void;
}

const DeleteAccountModal = ({
  isOpen,
  isDeletingAccount,
  secondsUntilUnlock,
  onClose,
  onDeleteAccount,
}: DeleteAccountModalProps) => {
  if (!isOpen) {
    return null;
  }

  const isLocked = secondsUntilUnlock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col rounded-3xl border border-red-500/20 bg-card p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeletingAccount}
          className="absolute right-4 top-4 cursor-pointer text-white transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={34} />
        </button>

        <div className="pr-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">
            Danger zone
          </p>
          <h2 className="mt-3 text-3xl font-semibold">Delete account</h2>
          <p className="mt-3 text-sm leading-6 text-red-100/80">
            This permanently removes your Beatwave account, profile, posts,
            comments, likes, notifications, and connected app data. This action
            cannot be undone.
          </p>
          <p className="mt-4 text-sm font-medium text-red-200/80">
            {isLocked
              ? `Delete unlocks in ${secondsUntilUnlock} second${secondsUntilUnlock === 1 ? "" : "s"}.`
              : "Delete is unlocked."}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeletingAccount}
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDeleteAccount}
            disabled={isLocked || isDeletingAccount}
            className="rounded-2xl bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeletingAccount
              ? "Deleting account..."
              : isLocked
                ? `Delete account (${secondsUntilUnlock})`
                : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
