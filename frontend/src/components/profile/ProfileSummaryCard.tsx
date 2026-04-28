import type { UserProfileData } from "./types";
import { motion, type Variants } from "framer-motion";

interface ProfileSummaryCardProps {
  user: UserProfileData | null;
}

const ProfileSummaryCard = ({ user }: ProfileSummaryCardProps) => {
  const avatarLabel = user?.username?.trim().slice(0, 2).toUpperCase() || "U";

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 } as const,
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="lg:w-1/3 p-2 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-white/10"
    >
      <motion.div
        variants={itemVariants}
        className="bg-accent mt-2 w-32 h-32 rounded-full flex justify-center items-center text-black font-semibold overflow-hidden text-3xl uppercase shadow-lg border-2 border-white/10"
      >
        {user?.activeProfileImage ? (
          <img
            src={user.activeProfileImage}
            alt={`${user.username} profile`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span>{avatarLabel}</span>
        )}
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="flex justify-center items-center mt-4 text-xl font-semibold text-white text-center"
      >
        {user?.username || "Felhasználó"}
      </motion.div>
      <motion.p
        variants={itemVariants}
        className="text-sm text-gray-400 mt-1 break-all text-center"
      >
        {user?.email}
      </motion.p>
      <motion.p
        variants={itemVariants}
        className="text-sm text-gray-300 mt-4 text-center whitespace-pre-wrap wrap-break-word leading-6 max-w-xs"
      >
        {user?.description?.trim()
          ? user.description
          : "No description yet. Add one in Settings so people can get to know you."}
      </motion.p>
    </motion.div>
  );
};

export default ProfileSummaryCard;
