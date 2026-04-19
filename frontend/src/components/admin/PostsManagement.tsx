import { Trash2 } from "lucide-react";
import type { AdminPost } from "./types";

interface PostsManagementProps {
  posts: AdminPost[];
  onDeletePost: (id: string) => void;
}

const PostsManagement = ({ posts, onDeletePost }: PostsManagementProps) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">No posts found.</div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-gray-700 p-3 sm:p-4 rounded-lg relative"
        >
          <button
            type="button"
            onClick={() => onDeletePost(post.id)}
            className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto bg-red-600 hover:bg-red-700 p-2 rounded text-white sm:self-center shrink-0"
          >
            <Trash2 size={16} />
          </button>
          <div className="pr-12 sm:pr-0">
            <h3 className="font-semibold text-sm sm:text-base">{post.title}</h3>
            <p className="text-sm text-gray-300 mt-1">{post.text}</p>
            <p className="text-xs text-gray-400 mt-2">
              By {post.user.username} •{" "}
              {new Date(post.postedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostsManagement;
