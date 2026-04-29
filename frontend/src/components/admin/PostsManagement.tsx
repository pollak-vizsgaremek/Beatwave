import { ArrowUpRight, Trash2 } from "lucide-react";
import type { AdminPost } from "./types";

interface PostsManagementProps {
  posts: AdminPost[];
  onDeletePost: (id: string) => void;
  onVisitPost: (id: string) => void;
}

const PostsManagement = ({
  posts,
  onDeletePost,
  onVisitPost,
}: PostsManagementProps) => {
  if (posts.length === 0) {
    return <div className="text-center py-8 text-gray-300">No posts found.</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-gray-700 p-3 sm:p-4 rounded-lg flex items-start justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base">{post.title}</h3>
            <p className="text-sm text-gray-300 mt-1">{post.text}</p>
            <p className="text-xs text-gray-400 mt-2">
              By {post.user.username} • {new Date(post.postedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 self-start shrink-0">
            <button
              type="button"
              onClick={() => onVisitPost(post.id)}
              className="cursor-pointer inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-xs font-medium"
            >
              Visit <ArrowUpRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDeletePost(post.id)}
              className="cursor-pointer bg-red-600 hover:bg-red-700 p-2 rounded text-white"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsManagement;
