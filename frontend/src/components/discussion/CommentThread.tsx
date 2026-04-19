import type { MouseEvent } from "react";
import { ChevronDown, ChevronUp, Heart, MessageCircle } from "lucide-react";

import formatRelative from "../../utils/DateFormatting";
import type { CommentType } from "../../utils/Type";

interface CommentThreadProps {
  comments: CommentType[];
  currentUserId: string | null;
  replyingTo: string | null;
  replyText: string;
  expandedReplies: Set<string>;
  isSubmittingReply: boolean;
  onProfileClick: (event: MouseEvent<HTMLElement>, userId: string) => void;
  onToggleReply: (commentId: string) => void;
  onReplyTextChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (commentId: string) => void;
  onLikeComment: (commentId: string) => void;
  onLikeReply: (replyId: string, parentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  onReportComment: (commentId: string, label?: "comment" | "reply") => void;
}

const CommentThread = ({
  comments,
  currentUserId,
  replyingTo,
  replyText,
  expandedReplies,
  isSubmittingReply,
  onProfileClick,
  onToggleReply,
  onReplyTextChange,
  onCancelReply,
  onSubmitReply,
  onLikeComment,
  onLikeReply,
  onToggleReplies,
  onReportComment,
}: CommentThreadProps) => {
  return (
    <div className="flex flex-col gap-5">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="bg-card-black p-5 rounded-2xl shadow-md border border-[#2D333B]"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={(event) =>
                  onProfileClick(event, comment.user?.id || comment.userId)
                }
                className="font-bold text-white text-base hover:underline cursor-pointer"
              >
                @{comment.user?.username || "Unknown"}
              </button>
              <span className="text-gray-500 text-sm">
                · {formatRelative(comment.commentedAt)}
              </span>
            </div>
          </div>

          <p className="text-gray-200 mb-5 whitespace-pre-wrap text-[15px] leading-relaxed">
            {comment.text}
          </p>

          <div className="flex items-center gap-6 text-gray-400 border-t border-gray-700/50 pt-3">
            <button
              type="button"
              onClick={() => onLikeComment(comment.id)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${comment.isLiked ? "text-red-500" : "hover:text-red-500"}`}
            >
              <Heart
                size={18}
                className={`group-hover:fill-red-500/20 ${comment.isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="text-sm font-medium">{comment.likeAmount}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleReply(comment.id)}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">Reply</span>
            </button>

            {comment.userId !== currentUserId && (
              <button
                type="button"
                onClick={() => onReportComment(comment.id, "comment")}
                className="text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
              >
                Report
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-5 flex flex-col gap-3 ml-2 md:ml-4 border-l-2 border-spotify-green pl-4">
              <textarea
                className="w-full bg-[#2D333B] text-white p-3 rounded-xl border border-transparent focus:outline-none focus:ring-1 focus:ring-spotify-green text-sm resize-none"
                rows={2}
                placeholder={`Replying to @${comment.user?.username || "Unknown"}...`}
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancelReply}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={isSubmittingReply}
                  className="px-5 py-2 bg-spotify-green text-black text-sm font-bold rounded-full hover:bg-spotify-green/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReply ? "Posting..." : "Reply"}
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 pt-3 ml-2 md:ml-4 border-l-2 border-[#2D333B]">
              <button
                type="button"
                onClick={() => onToggleReplies(comment.id)}
                className="flex items-center gap-2 pl-4 text-spotify-green text-sm font-bold hover:underline cursor-pointer mb-3"
              >
                {expandedReplies.has(comment.id) ? (
                  <>
                    <ChevronUp size={16} /> Hide {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} /> View {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </>
                )}
              </button>

              {expandedReplies.has(comment.id) && (
                <div className="flex flex-col gap-4 mt-2 pl-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="pt-2 pb-1 border-b border-gray-700/30 last:border-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={(event) =>
                            onProfileClick(
                              event,
                              reply.user?.id || reply.userId,
                            )
                          }
                          className="font-bold text-[14px] text-white hover:underline cursor-pointer"
                        >
                          @{reply.user?.username || "Unknown"}
                        </button>
                        <span className="text-gray-500 text-xs">
                          · {formatRelative(reply.commentedAt)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[14px] mb-3 leading-relaxed whitespace-pre-wrap">
                        {reply.text}
                      </p>
                      <div className="flex items-center gap-6 text-gray-400">
                        <button
                          type="button"
                          onClick={() => onLikeReply(reply.id, comment.id)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${reply.isLiked ? "text-red-500" : "hover:text-red-500"}`}
                        >
                          <Heart
                            size={15}
                            className={`group-hover:fill-red-500/20 ${reply.isLiked ? "fill-red-500 text-red-500" : ""}`}
                          />
                          <span className="text-xs font-medium">
                            {reply.likeAmount}
                          </span>
                        </button>

                        {reply.userId !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => onReportComment(reply.id, "reply")}
                            className="text-xs font-medium text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
                          >
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentThread;
