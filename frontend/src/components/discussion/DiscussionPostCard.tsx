import type { MouseEvent, RefObject } from "react";
import { EllipsisVertical, Heart } from "lucide-react";

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

  return (
    <div className="bg-card-black rounded-3xl p-6 md:p-8 shadow-xl mt-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 border-b border-gray-700 pb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <button
            type="button"
            onClick={(event) => onProfileClick(event, post.user.id)}
            className="text-spotify-green font-medium hover:underline cursor-pointer text-left"
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

            {isPostMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-card shadow-lg z-20 overflow-hidden">
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <span className="bg-[#2D333B] text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
          {post.topic}
        </span>
      </div>

      <div className="flex flex-col text-gray-200">
        <p
          className={`pt-2 text-lg leading-relaxed whitespace-pre-wrap ${showAllText ? "" : "line-clamp-4"}`}
        >
          {post.text}
        </p>

        {post.text.length > 200 && (
          <button
            type="button"
            onClick={onToggleText}
            className="mt-3 text-spotify-green font-medium hover:underline self-start cursor-pointer"
          >
            {showAllText ? "Show less" : "Show more"}
          </button>
        )}

        <p className="text-gray-400 pt-6 font-medium tracking-wide">
          {post.hashtags}
        </p>

        <div className="mt-6 flex items-center justify-end border-t border-gray-700/50 pt-4">
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
