import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, MessageCircle } from "lucide-react";

import CommentComposer from "../components/discussion/CommentComposer";
import CommentThread from "../components/discussion/CommentThread";
import DiscussionPostCard from "../components/discussion/DiscussionPostCard";
import {
  EditPostModal,
  ReportModal,
} from "../components/discussion/DiscussionModals";
import ErrorToast from "../components/ErrorToast";
import api from "../utils/api";
import { getLikedPosts, getStoredUser, saveLikedPosts } from "../utils/auth";
import { normalizeHashtagInput } from "../utils/hashtags";
import { useErrorToast } from "../utils/useErrorToast";
import type { CommentType, DiscussionType } from "../utils/Type";

const MAX_COMMENT_LENGTH = 2000;
const MAX_REPORT_REASON_LENGTH = 1000;
const EMPTY_POST_FORM = {
  title: "",
  topic: "",
  hashtags: "",
  text: "",
};

const ViewDiscussion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [postData, setPostData] = useState<DiscussionType | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [isLikingPost, setIsLikingPost] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
  const [reportReason, setReportReason] = useState("");
  const [reportTarget, setReportTarget] = useState<{
    type: "post" | "comment";
    id: string;
    label: "post" | "comment" | "reply";
  } | null>(null);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isReportingContent, setIsReportingContent] = useState(false);
  const [toastVariant, setToastVariant] = useState<"error" | "success">(
    "error",
  );
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showAllText, setShowAllText] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = getStoredUser()?.id ?? null;
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
        console.error("Error fetching post:", err);
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

      if (response.data.isLiked) {
        storedLikes.add(postData.id);
      } else {
        storedLikes.delete(postData.id);
      }

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
      setComments((prev) => [...prev, response.data]);
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
          if (comment.id !== parentId) {
            return comment;
          }

          return {
            ...comment,
            replies: [...(comment.replies || []), response.data],
          };
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

  const handleCommentLike = async (
    commentId: string,
    isReply: boolean = false,
    parentId?: string,
  ) => {
    try {
      const response = await api.post(`/comment/${commentId}/like`);

      if (!isReply) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likeAmount: response.data.likeAmount,
                  isLiked: response.data.isLiked,
                }
              : comment,
          ),
        );
        return;
      }

      if (parentId) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id !== parentId) {
              return comment;
            }

            return {
              ...comment,
              replies: comment.replies?.map((reply) =>
                reply.id === commentId
                  ? {
                      ...reply,
                      likeAmount: response.data.likeAmount,
                      isLiked: response.data.isLiked,
                    }
                  : reply,
              ),
            };
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
    setPostForm(EMPTY_POST_FORM);
    setIsPostModalOpen(false);
  };

  const openReportModal = (
    type: "post" | "comment",
    targetId: string,
    label: "post" | "comment" | "reply",
  ) => {
    setIsPostMenuOpen(false);
    setReportReason("");
    setReportTarget({ type, id: targetId, label });
    setIsReportModalOpen(true);
  };

  const resetReportModal = () => {
    setReportReason("");
    setReportTarget(null);
    setIsReportModalOpen(false);
  };

  const handlePostFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({
      ...prev,
      [name]: name === "hashtags" ? normalizeHashtagInput(value) : value,
    }));
  };

  const handleSavePost = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!postData) return;

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

    if (!confirmed) return;

    try {
      await api.delete(`/post/${postData.id}`);
      navigate("/discussion");
    } catch (err: any) {
      console.error("Error deleting post:", err);
      showToastError(err.response?.data?.error || "Failed to delete post.");
    }
  };

  const handleSubmitReport = async () => {
    const trimmedReason = reportReason.trim();

    if (!reportTarget || isReportingContent) return;

    if (!trimmedReason) {
      showToastError(
        `Please write a reason for reporting this ${reportTarget.label}.`,
      );
      return;
    }

    if (trimmedReason.length > MAX_REPORT_REASON_LENGTH) {
      showToastError(
        `Report reason must be at most ${MAX_REPORT_REASON_LENGTH} characters.`,
      );
      return;
    }

    const endpoint =
      reportTarget.type === "post"
        ? `/post/${reportTarget.id}/report`
        : `/comment/${reportTarget.id}/report`;

    setIsReportingContent(true);
    setIsPostMenuOpen(false);
    try {
      await api.post(endpoint, { reason: trimmedReason });
      const successLabel =
        reportTarget.label.charAt(0).toUpperCase() +
        reportTarget.label.slice(1);

      resetReportModal();
      showToastSuccess(
        `${successLabel} reported. Our moderators will review it.`,
      );
    } catch (err: any) {
      console.error("Error reporting content:", err);
      showToastError(
        err.response?.data?.error || `Failed to report ${reportTarget.label}.`,
      );
    } finally {
      setIsReportingContent(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);

      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }

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
            <DiscussionPostCard
              post={postData}
              currentUserId={currentUserId}
              showAllText={showAllText}
              isPostMenuOpen={isPostMenuOpen}
              isLikingPost={isLikingPost}
              isReportingContent={isReportingContent}
              postMenuRef={postMenuRef}
              onProfileClick={handleProfileClick}
              onToggleMenu={() => setIsPostMenuOpen((prev) => !prev)}
              onToggleText={() => setShowAllText((prev) => !prev)}
              onLike={() => void handlePostLike()}
              onEdit={openPostEditModal}
              onDelete={() => void handleDeletePost()}
              onReport={() => openReportModal("post", postData.id, "post")}
            />

            <div className="mt-10 border-t border-gray-700 pt-8 mb-20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle />
                Comments
              </h2>

              <CommentComposer
                value={commentText}
                maxLength={MAX_COMMENT_LENGTH}
                isSubmitting={isSubmittingComment}
                onChange={setCommentText}
                onSubmit={() => void handleCommentSubmit()}
              />

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
                <CommentThread
                  comments={comments}
                  currentUserId={currentUserId}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  expandedReplies={expandedReplies}
                  isSubmittingReply={isSubmittingReply}
                  onProfileClick={handleProfileClick}
                  onToggleReply={(commentId) =>
                    setReplyingTo((prev) =>
                      prev === commentId ? null : commentId,
                    )
                  }
                  onReplyTextChange={setReplyText}
                  onCancelReply={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  onSubmitReply={(commentId) =>
                    void handleReplySubmit(commentId)
                  }
                  onLikeComment={(commentId) =>
                    void handleCommentLike(commentId)
                  }
                  onLikeReply={(replyId, parentId) =>
                    void handleCommentLike(replyId, true, parentId)
                  }
                  onToggleReplies={toggleReplies}
                  onReportComment={(commentId, label = "comment") =>
                    openReportModal("comment", commentId, label)
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>

      <EditPostModal
        isOpen={isPostModalOpen}
        form={postForm}
        isSaving={isSavingPost}
        onClose={resetPostModal}
        onChange={handlePostFieldChange}
        onSubmit={handleSavePost}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        targetLabel={reportTarget?.label}
        reason={reportReason}
        maxLength={MAX_REPORT_REASON_LENGTH}
        isSubmitting={isReportingContent}
        onClose={resetReportModal}
        onChange={setReportReason}
        onSubmit={() => void handleSubmitReport()}
      />

      <ErrorToast error={error} variant={toastVariant} />
    </div>
  );
};

export default ViewDiscussion;
