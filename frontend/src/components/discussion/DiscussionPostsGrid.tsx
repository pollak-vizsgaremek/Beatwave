import { Link } from "react-router";
import type { MouseEvent, RefObject } from "react";

import { DiscussionPostsSkeleton } from "../LoadingSkeletons";
import DiscussionFeedPostCard from "./DiscussionFeedPostCard";
import type { DiscussionType } from "../../utils/Type";

interface DiscussionPostsGridProps {
  loadingPosts: boolean;
  postsData: DiscussionType[];
  filteredPosts: DiscussionType[];
  paginatedPosts: DiscussionType[];
  currentUserId: string | null;
  openPostMenuId: string | null;
  postMenuRef: RefObject<HTMLDivElement | null>;
  likingPostIds: Set<string>;
  reportingPostIds: Set<string>;
  onProfileClick: (event: MouseEvent<HTMLElement>, userId: string) => void;
  onToggleMenu: (postId: string) => void;
  onViewPost: (postId: string) => void;
  onEditPost: (post: DiscussionType) => void;
  onDeletePost: (postId: string) => void;
  onReportPost: (postId: string) => void;
  onLikePost: (event: MouseEvent<HTMLButtonElement>, postId: string) => void;
}

const DiscussionPostsGrid = ({
  loadingPosts,
  postsData,
  filteredPosts,
  paginatedPosts,
  currentUserId,
  openPostMenuId,
  postMenuRef,
  likingPostIds,
  reportingPostIds,
  onProfileClick,
  onToggleMenu,
  onViewPost,
  onEditPost,
  onDeletePost,
  onReportPost,
  onLikePost,
}: DiscussionPostsGridProps) => {
  return (
    <div className="grid flex-row items-center justify-center w-full max-w-[1600px] mx-auto gap-4 mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {loadingPosts ? (
        <DiscussionPostsSkeleton />
      ) : postsData.length === 0 ? (
        <p>No posts yet.</p>
      ) : filteredPosts.length === 0 ? (
        <p>No posts match the current search and filters.</p>
      ) : (
        paginatedPosts.map((post) => (
          <Link key={post.id} className="z-10" to={`/discussion/view/${post.id}`}>
            <DiscussionFeedPostCard
              post={post}
              currentUserId={currentUserId}
              isMenuOpen={openPostMenuId === post.id}
              isLiking={likingPostIds.has(post.id)}
              isReporting={reportingPostIds.has(post.id)}
              postMenuRef={postMenuRef}
              onProfileClick={onProfileClick}
              onToggleMenu={() => onToggleMenu(post.id)}
              onViewPost={() => onViewPost(post.id)}
              onEditPost={() => onEditPost(post)}
              onDeletePost={() => onDeletePost(post.id)}
              onReportPost={() => onReportPost(post.id)}
              onLikePost={onLikePost}
            />
          </Link>
        ))
      )}
    </div>
  );
};

export default DiscussionPostsGrid;
