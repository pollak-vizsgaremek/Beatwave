import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import NotificationList from "./NotificationList";
import type { NotificationsMenuProps } from "./types";

const NotificationsMenu = ({
  notificationsRef,
  isOpen,
  unreadCount,
  notifications,
  onToggle,
  onSelectNotification,
  onDeleteRead,
}: NotificationsMenuProps) => {
  return (
    <div className="relative" ref={notificationsRef}>
      <button
        type="button"
        onClick={onToggle}
        className="text-white hover:opacity-80 transition-opacity cursor-pointer relative mt-1 mr-2"
      >
        <motion.div whileTap={{ scale: 0.8 }}>
          <Bell strokeWidth={2.5} size={28} />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#1A1E23]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-72 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark max-h-96 overflow-y-auto no-scrollbar z-50 origin-top-right"
          >
            <div className="p-3 border-b border-accent-dark sticky top-0 bg-accent z-10 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm">Notifications</h3>
            </div>
            <div className="flex flex-col">
              <NotificationList
                notifications={notifications}
                onSelectNotification={onSelectNotification}
                onDeleteRead={onDeleteRead}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsMenu;
