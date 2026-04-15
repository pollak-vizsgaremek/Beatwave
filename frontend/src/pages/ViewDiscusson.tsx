import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import type { DiscussionType, CommentType } from "../utils/Type";
import api from "../utils/api";
import formatRelative from "../utils/DateFormatting";
import Button from "../components/Button";

const ViewDiscussion = () => {
  const { id } = useParams();

  const [postData, setPostData] = useState<DiscussionType | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [showAllText, setShowAllText] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);
        setPostData(response.data);
      } catch (error) {
        console.error("Error fetching Post:", error);
      } finally {
        setLoadingPost(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await api.get(`/post/${id}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoadingComments(false);
      }
    };

    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      const response = await api.post(`/post/${id}/comments`, {
        text: commentText,
      });
      setComments([...comments, response.data]);
      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      const response = await api.post(`/post/${id}/comments`, {
        text: replyText,
        previousCommentId: parentId,
      });

      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data],
            };
          }
          return comment;
        }),
      );

      setReplyText("");
      setReplyingTo(null);
      setExpandedReplies((prev) => new Set(prev).add(parentId));
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  const handleLike = async (
    commentId: string,
    isReply: boolean = false,
    parentId?: string,
  ) => {
    try {
      const response = await api.post(`/comment/${commentId}/like`);

      if (!isReply) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likeAmount: response.data.likeAmount,
                  isLiked: response.data.isLiked,
                }
              : c,
          ),
        );
      } else if (parentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: c.replies?.map((r) =>
                  r.id === commentId
                    ? {
                        ...r,
                        likeAmount: response.data.likeAmount,
                        isLiked: response.data.isLiked,
                      }
                    : r,
                ),
              };
            }
            return c;
          }),
        );
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div className="pb-20">
      <div className="px-5 md:px-35 pt-10 md:pt-20 w-min">
        <Link
          to="/discussion"
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={50} />
        </Link>
      </div>
      <div>
        {loadingPost ? (
          <p className="text-center mt-10 text-xl font-semibold">
            Loading post...
          </p>
        ) : !postData ? (
          <p className="text-center mt-10 text-xl font-semibold">
            No post found
          </p>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-4 md:px-10">
            <div className="bg-card-black rounded-3xl p-6 md:p-8 shadow-xl mt-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-4 border-b border-gray-700 pb-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold">{postData.title}</h1>
                  <p className="text-spotify-green font-medium">
                    by @{postData.user.username}
                  </p>
                </div>
                <p className="text-gray-400 text-sm mt-3 md:mt-0">
                  {formatRelative(postData.postedAt)}
                </p>
              </div>

              <div className="mb-6">
                <span className="bg-[#2D333B] text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  {postData.topic}
                </span>
              </div>

              <div className="flex flex-col text-gray-200">
                {showAllText ? (
                  <p className="pt-2 text-lg leading-relaxed whitespace-pre-wrap">
                    {postData.text}
                  </p>
                ) : (
                  <p className="pt-2 text-lg leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {postData.text}
                  </p>
                )}

                {postData.text.length > 200 && (
                  <button
                    onClick={() => setShowAllText(!showAllText)}
                    className="mt-3 text-spotify-green font-medium hover:underline self-start cursor-pointer"
                  >
                    {showAllText ? "Show less" : "Show more"}
                  </button>
                )}
                <p className="text-gray-400 pt-6 font-medium tracking-wide">
                  {postData.hashtags}
                </p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-10 border-t border-gray-700 pt-8 mb-20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle />
                Comments
              </h2>

              <div className="flex flex-col gap-4 mb-10 bg-card-black p-5 rounded-2xl">
                <textarea
                  className="w-full bg-[#2D333B] text-white p-4 rounded-xl border border-transparent focus:outline-none focus:border-spotify-green resize-none text-base"
                  rows={3}
                  placeholder="What are your thoughts?"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button
                  labelTitle="Post Comment"
                  onClick={handleCommentSubmit}
                  className="mt-0! px-6 py-2.5 self-end! text-sm font-bold bg-spotify-green hover:bg-spotify-green/80 border-none"
                />
              </div>

              {loadingComments ? (
                <p className="text-center text-gray-400 py-10">
                  Loading comments...
                </p>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 bg-card-black rounded-2xl">
                  <p className="text-gray-400">
                    No comments yet. Be the first to start the discussion!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-card-black p-5 rounded-2xl shadow-md border border-[#2D333B]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-white text-base">
                            @{comment.user?.username || "Unknown"}
                          </span>
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
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${comment.isLiked ? "text-red-500" : "hover:text-red-500"}`}
                        >
                          <Heart
                            size={18}
                            className={`group-hover:fill-red-500/20 ${comment.isLiked ? "fill-red-500 text-red-500" : ""}`}
                          />
                          <span className="text-sm font-medium">
                            {comment.likeAmount}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.id ? null : comment.id,
                            )
                          }
                          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm font-medium">Reply</span>
                        </button>
                      </div>

                      {/* Reply Input Box */}
                      {replyingTo === comment.id && (
                        <div className="mt-5 flex flex-col gap-3 ml-2 md:ml-4 border-l-2 border-spotify-green pl-4">
                          <textarea
                            className="w-full bg-[#2D333B] text-white p-3 rounded-xl border border-transparent focus:outline-none focus:ring-1 focus:ring-spotify-green text-sm resize-none"
                            rows={2}
                            placeholder={`Replying to @${comment.user?.username || "Unknown"}...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              className="px-5 py-2 bg-spotify-green text-black text-sm font-bold rounded-full hover:bg-spotify-green/80 transition-colors cursor-pointer"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Replies Section */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 pt-3 ml-2 md:ml-4 border-l-2 border-[#2D333B]">
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center gap-2 pl-4 text-spotify-green text-sm font-bold hover:underline cursor-pointer mb-3"
                          >
                            {expandedReplies.has(comment.id) ? (
                              <>
                                <ChevronUp size={16} /> Hide{" "}
                                {comment.replies.length}{" "}
                                {comment.replies.length === 1
                                  ? "reply"
                                  : "replies"}
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} /> View{" "}
                                {comment.replies.length}{" "}
                                {comment.replies.length === 1
                                  ? "reply"
                                  : "replies"}
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
                                    <span className="font-bold text-[14px] text-white">
                                      @{reply.user?.username || "Unknown"}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      · {formatRelative(reply.commentedAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-[14px] mb-3 leading-relaxed">
                                    {reply.text}
                                  </p>
                                  <div className="flex items-center gap-6 text-gray-400">
                                    <button
                                      onClick={() =>
                                        handleLike(reply.id, true, comment.id)
                                      }
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewDiscussion;
