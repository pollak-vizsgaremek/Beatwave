import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorToastProps {
  error: string | null;
}

/**
 * Shared animated bottom toast for errors.
 * Slides up from the bottom when `error` is a non-null string,
 * and animates out when it becomes null.
 *
 * Usage:
 *   const { error, showError } = useErrorToast();
 *   ...
 *   <ErrorToast error={error} />
 */
const ErrorToast = ({ error }: ErrorToastProps) => {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorToast;
