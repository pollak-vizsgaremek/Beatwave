import { X } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  onEmailChange: (email: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ForgotPasswordModal = ({
  isOpen,
  email,
  isSubmitting,
  isSuccess,
  onEmailChange,
  onClose,
  onSubmit,
}: ForgotPasswordModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-card p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 cursor-pointer text-white transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={28} />
        </button>

        <h2 className="text-2xl font-semibold pr-8">Reset your password</h2>

        {isSuccess ? (
          <>
            <p className="mt-4 text-sm text-white/80">
              If an account exists for that email, we sent a password reset
              link. Check your inbox and spam folder.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/15"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-white/80">
              Enter the email address linked to your account.
            </p>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@example.com"
              className="mt-4 rounded-2xl border border-white/10 bg-input-bg px-4 py-3 text-black placeholder:text-black/50 outline-none transition-colors focus:border-spotify-green"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="mt-6 rounded-2xl bg-spotify-green px-5 py-3 font-semibold text-black transition-colors hover:bg-spotify-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
