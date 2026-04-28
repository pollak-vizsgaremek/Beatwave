import { Megaphone, Pin } from "lucide-react";
import { Link } from "react-router";

import formatRelative from "../../utils/DateFormatting";
import type { DiscussionType } from "../../utils/Type";

interface AnnouncementSpotlightCardProps {
  announcement: DiscussionType;
  featured?: boolean;
  onProfileClick: (
    event: React.MouseEvent<HTMLElement>,
    userId: string,
  ) => void;
}

const AnnouncementSpotlightCard = ({
  announcement,
  featured = false,
  onProfileClick,
}: AnnouncementSpotlightCardProps) => {
  return (
    <Link
      to={`/discussion/view/${announcement.id}`}
      className={`group block overflow-hidden rounded-3xl border transition-all ${
        featured
          ? "border-amber-300/40 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(15,23,42,0.92),rgba(14,116,144,0.28))] p-6 shadow-[0_18px_60px_rgba(245,158,11,0.15)]"
          : "border-sky-200/15 bg-[linear-gradient(145deg,rgba(14,116,144,0.18),rgba(15,23,42,0.95))] p-5 shadow-[0_12px_40px_rgba(8,145,178,0.1)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/90">
          {featured ? <Megaphone size={16} /> : <Pin size={16} />}
          Public announcement
        </div>
        <p className="whitespace-nowrap text-xs text-slate-300/80">
          {formatRelative(announcement.postedAt)}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <h2
          className={`font-semibold text-white transition-colors group-hover:text-amber-100 ${
            featured ? "text-3xl" : "text-xl"
          }`}
        >
          {announcement.title}
        </h2>
        <p
          className={`whitespace-pre-wrap text-slate-100/85 ${
            featured
              ? "line-clamp-4 text-base leading-7"
              : "line-clamp-3 text-sm leading-6"
          }`}
        >
          {announcement.text}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={(event) => onProfileClick(event, announcement.user.id)}
          className="text-left text-sm font-medium text-amber-100 transition-colors hover:text-white hover:underline"
        >
          By @{announcement.user.username}
        </button>
        <span className="text-xs text-slate-300/70">
          Opens full announcement
        </span>
      </div>
    </Link>
  );
};

export default AnnouncementSpotlightCard;
