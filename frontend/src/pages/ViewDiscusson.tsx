import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  X,
} from "lucide-react";

import type { DiscussionType, CommentType } from "../utils/Type";
import api from "../utils/api";
import formatRelative from "../utils/DateFormatting";
import { getLikedPosts, getStoredUser, saveLikedPosts } from "../utils/auth";
import Button from "../components/Button";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";

const MAX_COMMENT_LENGTH = 2000;
const MAX_REPORT_REASON_LENGTH = 1000;

const ViewDiscussion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [postData, setPostData] = useState<DiscussionType | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [isLikingPost, setIsLikingPost] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: "",
    topic: "",
    hashtags: "",
    text: "",
  });
  const [reportReason, setReportReason] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [toastVariant, setToastVariant] = useState<"error" | "success">(
    "error",
  );
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = getStoredUser()?.id ?? null;

  const [comments, setComments] = useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const [showAllText, setShowAllText] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  // Submission loading states to prevent double-clicks
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const { error, showError } = useErrorToast();

  const showToastError = (message: string) => {
    setToastVariant("error");
    showError(message);
  };

  const showToastSuccess = (message: string) => {
    setToastVariant("success");
    showError(message);
  };

  const handleProfileClick = (
    event: React.MouseEvent<HTMLElement>,
    userId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(userId === currentUserId ? "/profile" : `/profile/${userId}`);
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);
        const likedPosts = getLikedPosts();

        setPostData({
          ...response.data,
          isLiked: likedPosts.has(response.data.id),
        });
      } catch (err: any) {
        console.error("Error fetching Post:", err);
        showToastError(err.response?.data?.error || "Failed to load post.");
      } finally {
        setLoadingPost(false);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await api.get(`/post/${id}/comments`);
        setComments(response.data);
      } catch (err: any) {
        console.error("Error fetching comments:", err);
        showToastError(err.response?.data?.error || "Failed to load comments.");
      } finally {
        setLoadingComments(false);
      }
    };

    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        postMenuRef.current &&
        !postMenuRef.current.contains(event.target as Node)
      ) {
        setIsPostMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePostLike = async () => {
    if (!postData || isLikingPost) return;

    setIsLikingPost(true);
    try {
      const response = await api.post(`/post/${postData.id}/like`, {
        isLiked: postData.isLiked,
      });

      const storedLikes = getLikedPosts();

      if (response.data.isLiked) storedLikes.add(postData.id);
      else storedLikes.delete(postData.id);

      saveLikedPosts(storedLikes);

      setPostData((prev) =>
        prev
          ? {
              ...prev,
              likeAmount: response.data.likeAmount,
              isLiked: response.data.isLiked,
            }
          : prev,
      );
    } catch (err: any) {
      console.error("Error liking post:", err);
      showToastError(err.response?.data?.error || "Failed to like post.");
    } finally {
      setIsLikingPost(false);
    }
  };

  const handleCommentSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      showToastError(
        `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`,
      );
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await api.post(`/post/${id}/comments`, {
        text: trimmed,
      });
      setComments([...comments, response.data]);
      setCommentText("");
    } catch (err: any) {
      console.error("Error posting comment:", err);
      showToastError(err.response?.data?.error || "Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      showToastError(`Reply must be at most ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await api.post(`/post/${id}/comments`, {
        text: trimmed,
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
    } catch (err: any) {
      console.error("Error posting reply:", err);
      showToastError(err.response?.data?.error || "Failed to post reply.");
    } finally {
      setIsSubmittingReply(false);
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
    } catch (err: any) {
      console.error("Error liking comment:", err);
      showToastError(err.response?.data?.error || "Failed to like comment.");
    }
  };

  const openPostEditModal = () => {
    if (!postData) return;

    setPostForm({
      title: postData.title || "",
      topic: postData.topic || "",
      hashtags: postData.hashtags || "",
      text: postData.text || "",
    });
    setIsPostMenuOpen(false);
    setIsPostModalOpen(true);
  };

  const resetPostModal = () => {
    setPostForm({ title: "", topic: "", hashtags: "", text: "" });
    setIsPostModalOpen(false);
  };

  const openReportModal = () => {
    setIsPostMenuOpen(false);
    setReportReason("");
    setIsReportModalOpen(true);
  };

  const resetReportModal = () => {
    setReportReason("");
    setIsReportModalOpen(false);
  };

  const handlePostFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postData) {
      return;
    }

    setIsSavingPost(true);
    try {
      const response = await api.put(`/post/${postData.id}`, postForm);
      const likedPosts = getLikedPosts();

      setPostData({
        ...response.data,
        isLiked: likedPosts.has(response.data.id),
      });
      resetPostModal();
    } catch (err: any) {
      console.error("Error updating post:", err);
      showToastError(err.response?.data?.error || "Failed to update post.");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postData) return;

    setIsPostMenuOpen(false);

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/post/${postData.id}`);
      navigate("/discussion");
    } catch (err: any) {
      console.error("Error deleting post:", err);
      showToastError(err.response?.data?.error || "Failed to delete post.");
    }
  };

  const handleReportPost = async () => {
    const trimmedReason = reportReason.trim();

    if (!postData || isReportingPost) return;

    if (!trimmedReason) {
      showToastError("Please write a reason for reporting this post.");
      return;
    }

    if (trimmedReason.length > MAX_REPORT_REASON_LENGTH) {
      showToastError(
        `Report reason must be at most ${MAX_REPORT_REASON_LENGTH} characters.`,
      );
      return;
    }

    setIsReportingPost(true);
    setIsPostMenuOpen(false);
    try {
      await api.post(`/post/${postData.id}/report`, {
        reason: trimmedReason,
      });
      resetReportModal();
      showToastSuccess("Post reported. Our moderators will review it.");
    } catch (err: any) {
      console.error("Error reporting post:", err);
      showToastError(err.response?.data?.error || "Failed to report post.");
    } finally {
      setIsReportingPost(false);
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
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 border-b border-gray-700 pb-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold">{postData.title}</h1>
                  <button
                    type="button"
                    onClick={(event) => handleProfileClick(event, postData.user.id)}
                    className="text-spotify-green font-medium hover:underline cursor-pointer text-left"
                  >
                    by @{postData.user.username}
                  </button>
                </div>

                <div
                  ref={postMenuRef}
                  className="mt-3 md:mt-0 flex items-start gap-2 self-start md:self-auto"
                >
                  <p className="text-gray-400 text-sm pt-2 md:pt-0 whitespace-nowrap">
                    {formatRelative(postData.postedAt)}
                  </p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPostMenuOpen((prev) => !prev)}
                      className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
                      aria-label="Open post actions"
                    >
                      <EllipsisVertical size={20} />
                    </button>

                    {isPostMenuOpen && (
                      <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-card shadow-lg z-20 overflow-hidden">
                        {postData.userId === currentUserId ? (
                          <>
                            <button
                              type="button"
                              onClick={openPostEditModal}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                            >
                              Edit post
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeletePost()}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                            >
                              Delete post
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={openReportModal}
                            disabled={isReportingPost}
                            className="w-full text-left px-4 py-2 text-sm text-yellow-300 hover:bg-white/10 cursor-pointer disabled:opacity-50"
                          >
                            {isReportingPost ? "Reporting..." : "Report post"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

                <div className="mt-6 flex items-center justify-end border-t border-gray-700/50 pt-4">
                  <button
                    type="button"
                    onClick={handlePostLike}
                    disabled={isLikingPost}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${postData.isLiked ? "text-red-500" : "hover:text-red-500"}`}
                  >
                    <Heart
                      size={18}
                      className={
                        postData.isLiked ? "fill-red-500 text-red-500" : ""
                      }
                    />
                    <span className="text-sm font-medium">
                      {postData.likeAmount}
                    </span>
                  </button>
                </div>
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
                  labelTitle={
                    isSubmittingComment ? "Posting..." : "Post Comment"
                  }
                  onClick={handleCommentSubmit}
                  disabled={isSubmittingComment}
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
                          <button
                            type="button"
                            onClick={(event) =>
                              handleProfileClick(
                                event,
                                comment.user?.id || comment.userId,
                              )
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
                              disabled={isSubmittingReply}
                              className="px-5 py-2 bg-spotify-green text-black text-sm font-bold rounded-full hover:bg-spotify-green/80 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingReply ? "Posting..." : "Reply"}
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
                                    <button
                                      type="button"
                                      onClick={(event) =>
                                        handleProfileClick(
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

      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-[700px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
            <button
              onClick={resetPostModal}
              className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
            >
              <X size={40} />
            </button>

            <h2 className="text-3xl font-semibold text-white mb-6 mt-8">
              Edit post
            </h2>

            <form
              onSubmit={handleSavePost}
              className="w-full flex flex-col items-center gap-4"
            >
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={postForm.title}
                onChange={handlePostFieldChange}
                className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                name="topic"
                placeholder="Topic"
                value={postForm.topic}
                onChange={handlePostFieldChange}
                className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                name="text"
                placeholder="Post text"
                value={postForm.text}
                onChange={handlePostFieldChange}
                rows={6}
                className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <input
                type="text"
                name="hashtags"
                placeholder="Hashtags"
                value={postForm.hashtags}
                onChange={handlePostFieldChange}
                className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <Button
                labelTitle={isSavingPost ? "Saving..." : "Save post"}
                type="submit"
                disabled={isSavingPost}
                className="mt-2 mb-4"
              />
            </form>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card w-full max-w-[650px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
            <button
              onClick={resetReportModal}
              className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
            >
              <X size={40} />
            </button>

            <h2 className="text-3xl font-semibold text-white mb-4 mt-8">
              Report post
            </h2>
            <p className="text-gray-400 text-center mb-4 px-4">
              Please tell us why you want to report this post.
            </p>

            <div className="w-full flex flex-col items-center gap-4">
              <textarea
                name="reportReason"
                placeholder="Write the reason for your report"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={6}
                maxLength={MAX_REPORT_REASON_LENGTH}
                className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
              <p className="w-4/5 text-right text-sm text-gray-400">
                {reportReason.length}/{MAX_REPORT_REASON_LENGTH}
              </p>

              <div className="w-4/5 flex justify-end gap-3 mb-4">
                <button
                  type="button"
                  onClick={resetReportModal}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleReportPost()}
                  disabled={isReportingPost}
                  className="px-5 py-2 bg-yellow-400 text-black text-sm font-bold rounded-full hover:bg-yellow-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isReportingPost ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorToast error={error} variant={toastVariant} />
    </div>
  );
};

export default ViewDiscussion;
