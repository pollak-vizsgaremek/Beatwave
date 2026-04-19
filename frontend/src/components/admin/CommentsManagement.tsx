import { Trash2 } from "lucide-react";
import type { AdminComment } from "./types";

interface CommentsManagementProps {
  comments: AdminComment[];
  onDeleteComment: (id: string) => void;
}

const CommentsManagement = ({
  comments,
  onDeleteComment,
}: CommentsManagementProps) => {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">No comments found.</div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-gray-700 p-3 sm:p-4 rounded-lg relative"
        >
          <button
            type="button"
            onClick={() => onDeleteComment(comment.id)}
            className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto bg-red-600 hover:bg-red-700 p-2 rounded text-white sm:self-center shrink-0"
          >
            <Trash2 size={16} />
          </button>
          <div className="pr-12 sm:pr-0">
            <p className="text-sm text-gray-300">{comment.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              By {comment.user.username} on "{comment.post.title}" •{" "}
              {new Date(comment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentsManagement;
