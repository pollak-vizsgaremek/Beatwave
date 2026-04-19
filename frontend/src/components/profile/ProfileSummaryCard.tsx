import type { UserProfileData } from "./types";

interface ProfileSummaryCardProps {
  user: UserProfileData | null;
}

const ProfileSummaryCard = ({ user }: ProfileSummaryCardProps) => {
  return (
    <div className="lg:w-1/3 p-2 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-white/10">
      <div className="bg-accent mt-2 p-2 w-32 h-32 rounded-full flex justify-center items-center text-black font-semibold">
        pfp-pic
      </div>
      <div className="flex justify-center items-center mt-4 text-xl font-semibold text-white text-center">
        {user?.username || "Felhasználó"}
      </div>
      <p className="text-sm text-gray-400 mt-1 break-all text-center">
        {user?.email}
      </p>
      <p className="text-sm text-gray-300 mt-4 text-center whitespace-pre-wrap wrap-break-word leading-6 max-w-xs">
        {user?.description?.trim()
          ? user.description
          : "No description yet. Add one in Settings so people can get to know you."}
      </p>
    </div>
  );
};

export default ProfileSummaryCard;
