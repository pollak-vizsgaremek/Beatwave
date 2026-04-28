import type { MouseEvent, RefObject } from "react";
import { EllipsisVertical, Heart, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import formatRelative from "../../utils/DateFormatting";
import type { DiscussionType } from "../../utils/Type";

interface DiscussionFeedPostCardProps {
  post: DiscussionType;
  currentUserId: string | null;
  isMenuOpen: boolean;
  isLiking: boolean;
  isReporting: boolean;
  postMenuRef: RefObject<HTMLDivElement | null>;
  onProfileClick: (event: MouseEvent<HTMLElement>, userId: string) => void;
  onToggleMenu: () => void;
  onViewPost: () => void;
  onEditPost: () => void;
  onDeletePost: () => void;
  onReportPost: () => void;
  onLikePost: (event: MouseEvent<HTMLButtonElement>, postId: string) => void;
}

const DiscussionFeedPostCard = ({
  post,
  currentUserId,
  isMenuOpen,
  isLiking,
  isReporting,
  postMenuRef,
  onProfileClick,
  onToggleMenu,
  onViewPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onLikePost,
}: DiscussionFeedPostCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col relative bg-gray-500/60 w-full min-h-[220px] sm:min-h-[260px] p-2 sm:p-4 mt-2 rounded-lg outline-1 outline-black shadow-md hover:shadow-xl"
    >
      <div className="flex flex-row self-start items-start sm:items-center relative top-1 w-full gap-2">
        <div className="min-w-0 flex flex-wrap items-center">
          <button
            type="button"
            onClick={(event) => onProfileClick(event, post.user.id)}
            className="font-bold text-xl max-w-[100px] sm:max-w-[150px] truncate cursor-pointer hover:underline text-left"
          >
            {post.user.username}
          </button>
          <p className="mx-2 font-bold text-lg hidden sm:block"> - </p>
          <p className="text-lg font-extralight max-w-20 sm:max-w-[100px] truncate">
            {post.title}
          </p>
          <p className="mx-2 font-bold text-lg hidden sm:block"> - </p>
          <p className="text-lg font-extralight italic max-w-20 sm:max-w-[100px] truncate">
            {post.topic}
          </p>
        </div>

        <div
          ref={isMenuOpen ? postMenuRef : null}
          className="ml-auto flex items-start gap-1"
        >
          <p className="text-sm text-gray-400 ml-auto mt-1 sm:mt-0 whitespace-nowrap">
            {formatRelative(post.postedAt)}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleMenu();
              }}
              className="rounded-full p-1 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Open post actions"
            >
              <EllipsisVertical size={18} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-card shadow-lg z-20 overflow-hidden origin-top-right"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onViewPost();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                  >
                    View post
                  </button>

                  {post.userId === currentUserId ? (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onEditPost();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                      >
                        Edit post
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onDeletePost();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                      >
                        Delete post
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onReportPost();
                      }}
                      disabled={isReporting}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-300 hover:bg-white/10 cursor-pointer disabled:opacity-50"
                    >
                      {isReporting ? "Reporting..." : "Report post"}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-4 mt-2 sm:mt-3">
        <p className="line-clamp-5">{post.text}</p>
      </div>

      <div className="mt-2 sm:mt-3">
        <p>{post.hashtags}</p>
        <p className="text-sm text-gray-400 mt-1"></p>
      </div>

      <div className="mt-2 sm:mt-3 flex flex-row gap-4 justify-end absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
        <button
          type="button"
          onClick={(event) => onLikePost(event, post.id)}
          disabled={isLiking}
          className={`flex items-center cursor-pointer transition-colors ${post.isLiked ? "text-red-500" : "hover:text-red-500"}`}
        >
          <Heart
            className={`mr-2 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`}
          />
          {post.likeAmount}
        </button>
        <p className="flex items-center hover:text-blue-500 cursor-pointer">
          <MessageCircle className="mr-2 z-99" />
        </p>
      </div>
    </motion.div>
  );
};

export default DiscussionFeedPostCard;
