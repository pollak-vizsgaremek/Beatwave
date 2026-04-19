import { LogOut, Settings, UserRound } from "lucide-react";
import { motion } from "framer-motion";

import type { UserMenuProps } from "./types";

const UserMenu = ({
  profileRef,
  isOpen,
  canAccessAdminPanel,
  onToggle,
  onNavigate,
  onLogout,
}: UserMenuProps) => {
  return (
    <div className="relative" ref={profileRef}>
      <button
        type="button"
        onClick={onToggle}
        className="text-white hover:opacity-80 transition-opacity cursor-pointer"
      >
        <motion.div whileTap={{ scale: 0.8 }}>
          <UserRound strokeWidth={3} size={35} />
        </motion.div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark">
          <button
            type="button"
            onClick={() => onNavigate("/profile")}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors first:rounded-t-lg border-b border-accent-dark cursor-pointer"
          >
            <Settings size={18} />
            <span>Profile</span>
          </button>
          {canAccessAdminPanel && (
            <button
              type="button"
              onClick={() => onNavigate("/admin")}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors border-b border-accent-dark cursor-pointer"
            >
              <Settings size={18} />
              <span>Admin panel</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors last:rounded-b-lg cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
