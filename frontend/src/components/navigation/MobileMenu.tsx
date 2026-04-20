import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";

import Button from "../Button";
import NotificationList from "./NotificationList";
import type { MobileMenuProps } from "./types";

const MobileMenu = ({
  menuRef,
  isOpen,
  notifications,
  canAccessAdminPanel,
  onClose,
  onNavigate,
  onLogout,
  onDeleteRead,
}: MobileMenuProps) => {
  const hasReadNotifications = notifications.some(
    (notification) => notification.read,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-full sm:w-80 bg-accent shadow-lg z-50 flex flex-col justify-between p-6"
        >
          <div className="relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute -top-2 -right-2 text-white hover:opacity-80 bg-accent-dark/50 rounded-full p-2"
            >
              <X size={32} />
            </button>

            <Link
              to="/discussion"
              onClick={onClose}
              className="text-white text-xl mb-6 hover:opacity-80 block font-medium"
            >
              Discussion
            </Link>

            <div className="mb-6">
              <h3 className="text-white font-bold text-lg mb-4">
                Notifications
              </h3>
              <Button
                labelTitle="Delete Read Notifications"
                onClick={onDeleteRead}
                disabled={!hasReadNotifications}
                className="mt-0! mb-3! w-full! py-3! text-sm!"
              />
              <div className="max-h-48 overflow-y-auto no-scrollbar">
                <NotificationList
                  notifications={notifications}
                  compact
                  showDeleteReadAction={false}
                  onSelectNotification={(onSelectNotification) => {
                    if (onSelectNotification) {
                      onNavigate(onSelectNotification);
                    }
                  }}
                  onDeleteRead={onDeleteRead}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("/profile")}
              className="text-white text-xl mb-3 text-left hover:opacity-80 w-full py-3 px-4 rounded-lg hover:bg-accent-dark/30 transition-colors font-medium"
            >
              Profile
            </button>

            {canAccessAdminPanel && (
              <button
                type="button"
                onClick={() => onNavigate("/admin")}
                className="text-white text-xl mb-6 text-left hover:opacity-80 w-full py-3 px-4 rounded-lg hover:bg-accent-dark/30 transition-colors font-medium"
              >
                Admin panel
              </button>
            )}
          </div>

          <div className="border-t border-accent-dark/50 pt-6">
            <button
              type="button"
              onClick={onLogout}
              className="text-red-400 text-xl text-left hover:text-red-300 w-full py-4 px-4 rounded-lg hover:bg-red-600/30 transition-colors font-medium"
            >
              Log Out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
