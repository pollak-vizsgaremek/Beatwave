import { Bell } from "lucide-react";
import { motion } from "framer-motion";

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

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark max-h-96 overflow-y-auto no-scrollbar z-50">
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
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
