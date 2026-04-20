import { EllipsisVertical } from "lucide-react";
import type { RefObject } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import formatRelative from "../../utils/DateFormatting";
import type { DiscussionType } from "../../utils/Type";

interface ProfileContentProps {
  loadingPosts: boolean;
  userPosts: DiscussionType[];
  openPostMenuId: string | null;
  postMenuRef: RefObject<HTMLDivElement | null>;
  onTogglePostMenu: (postId: string) => void;
  onOpenPostEdit: (post: DiscussionType) => void;
  onDeletePost: (postId: string) => void;
}

const ProfileContent = ({
  loadingPosts,
  userPosts,
  openPostMenuId,
  postMenuRef,
  onTogglePostMenu,
  onOpenPostEdit,
  onDeletePost,
}: ProfileContentProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-white">Your posts</h3>
          <Link
            to="/discussion/create"
            className="text-sm text-spotify-green hover:underline"
          >
            Create new post
          </Link>
        </div>

        {loadingPosts ? (
          <p className="text-gray-400">Loading your posts...</p>
        ) : userPosts.length === 0 ? (
          <p className="text-gray-400">You have not created any posts yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {userPosts.map((post, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -3, scale: 1.01 }}
                key={post.id}
                className="rounded-2xl border border-white/10 bg-card-black p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h4 className="text-white text-lg font-semibold">
                      {post.title}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {post.topic} • {formatRelative(post.postedAt)}
                    </p>
                  </div>
                  <div
                    ref={openPostMenuId === post.id ? postMenuRef : null}
                    className="relative self-start sm:self-auto"
                  >
                    <button
                      type="button"
                      onClick={() => onTogglePostMenu(post.id)}
                      className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
                      aria-label="Open post actions"
                    >
                      <EllipsisVertical size={20} />
                    </button>

                    <AnimatePresence>
                      {openPostMenuId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-36 rounded-xl border border-white/10 bg-card shadow-lg z-10 overflow-hidden origin-top-right"
                        >
                          <Link
                            to={`/discussion/view/${post.id}`}
                            onClick={() => onTogglePostMenu(post.id)}
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => onOpenPostEdit(post)}
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePost(post.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                          >
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-gray-300 mt-3 whitespace-pre-wrap wrap-break-word">
                  {post.text}
                </p>

                {post.hashtags && (
                  <p className="text-sm text-spotify-green mt-3">
                    {post.hashtags}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileContent;
