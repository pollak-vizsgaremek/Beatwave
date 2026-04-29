import type { MouseEvent } from "react";

import AnnouncementSpotlightCard from "./AnnouncementSpotlightCard";
import type { DiscussionType } from "../../utils/Type";

interface DiscussionAnnouncementsSectionProps {
  loadingPosts: boolean;
  announcementsData: DiscussionType[];
  onProfileClick: (event: MouseEvent<HTMLElement>, userId: string) => void;
}

const DiscussionAnnouncementsSection = ({
  loadingPosts,
  announcementsData,
  onProfileClick,
}: DiscussionAnnouncementsSectionProps) => {
  const featuredAnnouncement = announcementsData[0] ?? null;
  const secondaryAnnouncements = announcementsData.slice(1);

  return (
    <>
      <h1 className="mt-4 text-4xl font-semibold text-left w-full max-w-[1400px] mx-auto">
        Announcements
      </h1>

      {loadingPosts ? null : announcementsData.length === 0 ? (
        <div className="w-full max-w-[1500px] mx-auto mt-4 rounded-3xl border border-dashed border-white/10 bg-card-black/70 p-6 text-sm text-gray-400">
          No active announcements right now.
        </div>
      ) : (
        <div className="w-full max-w-[1500px] mx-auto mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          {featuredAnnouncement ? (
            <AnnouncementSpotlightCard
              announcement={featuredAnnouncement}
              featured
              onProfileClick={onProfileClick}
            />
          ) : null}

          <div className="space-y-4">
            {secondaryAnnouncements.length === 0 && featuredAnnouncement ? (
              <div className="rounded-3xl border border-white/10 bg-card-black/70 p-5 text-sm text-gray-300">
                This is the latest public announcement. New ones will stack here
                separately from the discussion feed.
              </div>
            ) : (
              secondaryAnnouncements.map((announcement) => (
                <AnnouncementSpotlightCard
                  key={announcement.id}
                  announcement={announcement}
                  onProfileClick={onProfileClick}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DiscussionAnnouncementsSection;
