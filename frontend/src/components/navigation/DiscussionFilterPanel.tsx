import { AnimatePresence, motion } from "framer-motion";

import Input from "../Input";
import type { DiscussionFilterOption } from "../../context/DiscussionToolbarContext.tsx";

interface DiscussionFilterPanelProps {
  isOpen: boolean;
  selectedTopic: string;
  selectedAuthorId: string;
  selectedSort: "newest" | "oldest" | "mostLiked";
  discussionHashtagFilter: string;
  onlyMyPosts: boolean;
  onlyLikedPosts: boolean;
  topicOptions: DiscussionFilterOption[];
  authorOptions: DiscussionFilterOption[];
  onTopicChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onSortChange: (value: "newest" | "oldest" | "mostLiked") => void;
  onHashtagChange: (value: string) => void;
  onOnlyMyPostsChange: (checked: boolean) => void;
  onOnlyLikedPostsChange: (checked: boolean) => void;
}

const DiscussionFilterPanel = ({
  isOpen,
  selectedTopic,
  selectedAuthorId,
  selectedSort,
  discussionHashtagFilter,
  onlyMyPosts,
  onlyLikedPosts,
  topicOptions,
  authorOptions,
  onTopicChange,
  onAuthorChange,
  onSortChange,
  onHashtagChange,
  onOnlyMyPostsChange,
  onOnlyLikedPostsChange,
}: DiscussionFilterPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-12 right-0 z-50 flex w-[320px] max-w-[92vw] origin-top-right flex-col gap-4 rounded-3xl border border-accent-dark bg-accent p-5 shadow-2xl"
        >
          <label className="flex flex-col gap-1 text-sm text-white">
            Topic
            <select
              value={selectedTopic}
              onChange={(event) => onTopicChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
            >
              <option value="all">All topics</option>
              {topicOptions.map((topic) => (
                <option key={topic.value} value={topic.value}>
                  {topic.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-white">
            Author
            <select
              value={selectedAuthorId}
              onChange={(event) => onAuthorChange(event.target.value)}
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
            >
              <option value="all">All authors</option>
              {authorOptions.map((author) => (
                <option key={author.value} value={author.value}>
                  {author.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-white">
            Sort
            <select
              value={selectedSort}
              onChange={(event) =>
                onSortChange(
                  event.target.value as "newest" | "oldest" | "mostLiked",
                )
              }
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="mostLiked">Most liked</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-white">
            Hashtags
            <input
              type="text"
              value={discussionHashtagFilter}
              onChange={(event) => onHashtagChange(event.target.value)}
              placeholder="#music #rock"
              className="rounded-xl border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
            />
          </label>

          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card px-3 py-3">
            <Input
              inputName="discussion_only_my_posts"
              inputType="checkbox"
              labelTitle="Only my posts"
              checked={onlyMyPosts}
              onChange={(event) => onOnlyMyPostsChange(event.target.checked)}
              wrapperClassName="w-full"
            />
            <Input
              inputName="discussion_only_liked_posts"
              inputType="checkbox"
              labelTitle="Only liked posts"
              checked={onlyLikedPosts}
              onChange={(event) => onOnlyLikedPostsChange(event.target.checked)}
              wrapperClassName="w-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiscussionFilterPanel;
