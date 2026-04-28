import type { MouseEvent, RefObject } from "react";
import { EllipsisVertical, Heart, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import formatRelative from "../../utils/DateFormatting";
import type { DiscussionType } from "../../utils/Type";

interface DiscussionPostCardProps {
  post: DiscussionType;
  currentUserId: string | null;
  showAllText: boolean;
  isPostMenuOpen: boolean;
  isDeletingPost: boolean;
  isLikingPost: boolean;
  isReportingContent: boolean;
  postMenuRef: RefObject<HTMLDivElement | null>;
  onProfileClick: (event: MouseEvent<HTMLElement>, userId: string) => void;
  onToggleMenu: () => void;
  onToggleText: () => void;
  onLike: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
}

const DiscussionPostCard = ({
  post,
  currentUserId,
  showAllText,
  isPostMenuOpen,
  isDeletingPost,
  isLikingPost,
  isReportingContent,
  postMenuRef,
  onProfileClick,
  onToggleMenu,
  onToggleText,
  onLike,
  onEdit,
  onDelete,
  onReport,
}: DiscussionPostCardProps) => {
  const isOwner = post.userId === currentUserId;
  const isAnnouncement = post.topic.trim().toLowerCase() === "announcement";

  return (
    <div
      className={`rounded-3xl p-6 md:p-8 shadow-xl mt-6 ${
        isAnnouncement
          ? "border border-amber-300/30 bg-[linear-gradient(145deg,rgba(245,158,11,0.18),rgba(15,23,42,0.96),rgba(14,116,144,0.25))]"
          : "bg-card-black"
      }`}
    >
      <div
        className={`flex flex-col md:flex-row md:items-start md:justify-between mb-4 pb-4 ${
          isAnnouncement
            ? "border-b border-amber-200/15"
            : "border-b border-gray-700"
        }`}
      >
        <div className="flex flex-col gap-2">
          {isAnnouncement && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
              <Megaphone size={14} />
              Public announcement
            </div>
          )}
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <button
            type="button"
            onClick={(event) => onProfileClick(event, post.user.id)}
            className={`font-medium hover:underline cursor-pointer text-left ${
              isAnnouncement ? "text-amber-100" : "text-spotify-green"
            }`}
          >
            by @{post.user.username}
          </button>
        </div>

        <div
          ref={postMenuRef}
          className="mt-3 md:mt-0 flex items-start gap-2 self-start md:self-auto"
        >
          <p className="text-gray-400 text-sm pt-2 md:pt-0 whitespace-nowrap">
            {formatRelative(post.postedAt)}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={onToggleMenu}
              className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Open post actions"
            >
              <EllipsisVertical size={20} />
            </button>

            <AnimatePresence>
              {isPostMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-card shadow-lg z-20 overflow-hidden origin-top-right"
                >
                  {isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={onEdit}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                      >
                        Edit post
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={isDeletingPost}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                      >
                        {isDeletingPost ? "Deleting..." : "Delete post"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onReport}
                      disabled={isReportingContent}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-300 hover:bg-white/10 cursor-pointer disabled:opacity-50"
                    >
                      {isReportingContent ? "Reporting..." : "Report post"}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            isAnnouncement
              ? "bg-amber-100/10 text-amber-50 border border-amber-100/15"
              : "bg-[#2D333B] text-gray-300"
          }`}
        >
          {post.topic}
        </span>
      </div>

      <div
        className={`flex flex-col ${isAnnouncement ? "text-slate-100" : "text-gray-200"}`}
      >
        <p
          className={`pt-2 text-lg leading-relaxed whitespace-pre-wrap ${showAllText ? "" : "line-clamp-4"}`}
        >
          {post.text}
        </p>

        {post.text.length > 200 && (
          <button
            type="button"
            onClick={onToggleText}
            className={`mt-3 font-medium hover:underline self-start cursor-pointer ${
              isAnnouncement ? "text-amber-100" : "text-spotify-green"
            }`}
          >
            {showAllText ? "Show less" : "Show more"}
          </button>
        )}

        <p
          className={`pt-6 font-medium tracking-wide ${isAnnouncement ? "text-slate-300/75" : "text-gray-400"}`}
        >
          {post.hashtags}
        </p>

        <div
          className={`mt-6 flex items-center justify-end pt-4 ${
            isAnnouncement
              ? "border-t border-amber-200/12"
              : "border-t border-gray-700/50"
          }`}
        >
          <button
            type="button"
            onClick={onLike}
            disabled={isLikingPost}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${post.isLiked ? "text-red-500" : "hover:text-red-500"}`}
          >
            <Heart
              size={18}
              className={post.isLiked ? "fill-red-500 text-red-500" : ""}
            />
            <span className="text-sm font-medium">{post.likeAmount}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPostCard;
