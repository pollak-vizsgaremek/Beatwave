interface DiscussionPostsToolbarProps {
  visiblePosts: number;
  totalPosts: number;
  safeCurrentPage: number;
  totalPostPages: number;
  onPageChange: (nextPage: number) => void;
}

const DiscussionPostsToolbar = ({
  visiblePosts,
  totalPosts,
  safeCurrentPage,
  totalPostPages,
  onPageChange,
}: DiscussionPostsToolbarProps) => {
  return (
    <div className="w-full max-w-[1500px] mx-auto mt-4 rounded-2xl border border-white/10 bg-card-black px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-400">
          Showing {visiblePosts} of {totalPosts} posts
        </p>

        {totalPosts > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onPageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {safeCurrentPage} of {totalPostPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPostPages}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionPostsToolbar;
