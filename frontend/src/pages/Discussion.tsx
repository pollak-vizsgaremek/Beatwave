import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router";

import ErrorToast from "../components/ErrorToast";
import DiscussionAnnouncementsSection from "../components/discussion/DiscussionAnnouncementsSection";
import DiscussionHero from "../components/discussion/DiscussionHero";
import {
  EditPostModal,
  ReportModal,
} from "../components/discussion/DiscussionModals";
import DiscussionPostsGrid from "../components/discussion/DiscussionPostsGrid";
import DiscussionPostsToolbar from "../components/discussion/DiscussionPostsToolbar";
import {
  type DiscussionFilterOption,
  useDiscussionToolbar,
} from "../context/DiscussionToolbarContext.tsx";
import { useSession } from "../context/SessionContext";
import api from "../utils/api";
import {
  getNormalizedHashtags,
  normalizeHashtagInput,
} from "../utils/hashtags";
import type { DiscussionType } from "../utils/Type";
import { useErrorToast } from "../utils/useErrorToast";

const MAX_REPORT_REASON_LENGTH = 1000;
const POSTS_PER_PAGE = 12;

interface PostFormState {
  title: string;
  topic: string;
  hashtags: string;
  text: string;
}

const Discussion = () => {
  const { currentUser } = useSession();
  const { setTopicOptions, setAuthorOptions } = useDiscussionToolbar();
  const [searchParams] = useSearchParams();
  const [postsData, setPostsData] = useState<DiscussionType[]>([]);
  const [announcementsData, setAnnouncementsData] = useState<DiscussionType[]>(
    [],
  );
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<PostFormState>({
    title: "",
    topic: "",
    hashtags: "",
    text: "",
  });
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingPostIds, setReportingPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [reportTargetPostId, setReportTargetPostId] = useState<string | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");
  const [toastVariant, setToastVariant] = useState<"error" | "success">(
    "error",
  );
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const currentUserId = currentUser?.id ?? null;
  const { error, showError } = useErrorToast();

  const discussionSearchQuery = searchParams.get("q") || "";
  const selectedTopic = searchParams.get("topic") || "all";
  const selectedAuthorId = searchParams.get("author") || "all";
  const selectedSort =
    (searchParams.get("sort") as "newest" | "oldest" | "mostLiked" | null) ||
    "newest";
  const discussionHashtagFilter = searchParams.get("hashtags") || "";
  const onlyMyPosts = searchParams.get("mine") === "true";
  const onlyLikedPosts = searchParams.get("liked") === "true";
  const currentPage = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const topicOptions = useMemo<DiscussionFilterOption[]>(() => {
    const topicMap = new Map<string, string>();

    postsData.forEach((post) => {
      const topic = post.topic?.trim();
      if (!topic) return;
      const key = topic.toLowerCase();
      if (!topicMap.has(key)) {
        topicMap.set(key, topic);
      }
    });

    return Array.from(topicMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [postsData]);

  const authorOptions = useMemo<DiscussionFilterOption[]>(() => {
    const authorMap = new Map<string, string>();

    postsData.forEach((post) => {
      if (!authorMap.has(post.user.id)) {
        authorMap.set(post.user.id, post.user.username);
      }
    });

    return Array.from(authorMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [postsData]);

  useEffect(() => {
    setTopicOptions(topicOptions);
    setAuthorOptions(authorOptions);

    return () => {
      setTopicOptions([]);
      setAuthorOptions([]);
    };
  }, [authorOptions, setAuthorOptions, setTopicOptions, topicOptions]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = discussionSearchQuery.trim().toLowerCase();
    const requiredHashtags = getNormalizedHashtags(discussionHashtagFilter);

    const base = postsData.filter((post) => {
      if (onlyMyPosts && post.userId !== currentUserId) {
        return false;
      }

      if (onlyLikedPosts && !post.isLiked) {
        return false;
      }

      if (selectedTopic !== "all") {
        const postTopic = post.topic?.trim().toLowerCase() || "";
        if (postTopic !== selectedTopic) {
          return false;
        }
      }

      if (selectedAuthorId !== "all" && post.user.id !== selectedAuthorId) {
        return false;
      }

      if (normalizedQuery) {
        const searchable = (post.title || "").toLowerCase();

        if (!searchable.includes(normalizedQuery)) {
          return false;
        }
      }

      if (requiredHashtags.length > 0) {
        const postHashtags = getNormalizedHashtags(post.hashtags || "");
        const hasAllRequiredHashtags = requiredHashtags.every((hashtag) =>
          postHashtags.includes(hashtag),
        );

        if (!hasAllRequiredHashtags) {
          return false;
        }
      }

      return true;
    });

    return [...base].sort((a, b) => {
      if (selectedSort === "mostLiked") {
        return (b.likeAmount || 0) - (a.likeAmount || 0);
      }

      const first = new Date(a.postedAt).getTime();
      const second = new Date(b.postedAt).getTime();

      if (selectedSort === "oldest") {
        return first - second;
      }

      return second - first;
    });
  }, [
    currentUserId,
    discussionSearchQuery,
    onlyLikedPosts,
    onlyMyPosts,
    postsData,
    discussionHashtagFilter,
    selectedAuthorId,
    selectedSort,
    selectedTopic,
  ]);

  const totalPostPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / POSTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPostPages);
  const paginatedPosts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredPosts, safeCurrentPage]);

  const showToastError = (message: string) => {
    setToastVariant("error");
    showError(message);
  };

  const showToastSuccess = (message: string) => {
    setToastVariant("success");
    showError(message);
  };

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "1") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    navigate(
      {
        pathname: "/discussion",
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: true },
    );
  };

  const handlePageChange = (nextPage: number) => {
    updateSearchParams({ page: nextPage <= 1 ? null : String(nextPage) });
  };

  const handleProfileClick = (
    event: ReactMouseEvent<HTMLElement>,
    userId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(userId === currentUserId ? "/profile" : `/profile/${userId}`);
  };

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const [postsResponse, announcementsResponse] = await Promise.all([
          api.get("/posts"),
          api.get("/announcements"),
        ]);

        setPostsData(
          postsResponse.data.map((post: DiscussionType) => ({
            ...post,
            isLiked: post.isLiked,
          })),
        );
        setAnnouncementsData(
          announcementsResponse.data.map((post: DiscussionType) => ({
            ...post,
            isLiked: post.isLiked,
          })),
        );
      } catch (err: any) {
        console.error("Error fetching Posts:", err);
        showToastError(
          err.response?.data?.error ||
            "Failed to load posts. Please try again.",
        );
      } finally {
        setLoadingPosts(false);
      }
    };

    void fetchAllPosts();
  }, []);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      updateSearchParams({
        page: safeCurrentPage <= 1 ? null : String(safeCurrentPage),
      });
    }
  }, [currentPage, safeCurrentPage]);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        postMenuRef.current &&
        !postMenuRef.current.contains(event.target as Node)
      ) {
        setOpenPostMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLikePost = async (
    event: ReactMouseEvent<HTMLButtonElement>,
    postId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (likingPostIds.has(postId)) return;

    const currentPost = postsData.find((post) => post.id === postId);
    if (!currentPost) return;

    setLikingPostIds((prev) => new Set(prev).add(postId));

    try {
      const response = await api.post(`/post/${postId}/like`, {
        isLiked: currentPost.isLiked,
      });

      setPostsData((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likeAmount: response.data.likeAmount,
                isLiked: response.data.isLiked,
              }
            : post,
        ),
      );
    } catch (err: any) {
      console.error("Error liking post:", err);
      showToastError(err.response?.data?.error || "Failed to like post.");
    } finally {
      setLikingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleTogglePostMenu = (postId: string) => {
    setOpenPostMenuId((prev) => (prev === postId ? null : postId));
  };

  const handleViewPost = (postId: string) => {
    setOpenPostMenuId(null);
    navigate(`/discussion/view/${postId}`);
  };

  const openPostEditModal = (post: DiscussionType) => {
    setEditingPostId(post.id);
    setPostForm({
      title: post.title || "",
      topic: post.topic || "",
      hashtags: post.hashtags || "",
      text: post.text || "",
    });
    setOpenPostMenuId(null);
    setIsPostModalOpen(true);
  };

  const resetPostModal = () => {
    setEditingPostId(null);
    setPostForm({ title: "", topic: "", hashtags: "", text: "" });
    setIsPostModalOpen(false);
  };

  const handlePostFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setPostForm((prev) => ({
      ...prev,
      [name]: name === "hashtags" ? normalizeHashtagInput(value) : value,
    }));
  };

  const handleSavePost = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingPostId) {
      return;
    }

    setIsSavingPost(true);
    try {
      const response = await api.put(`/post/${editingPostId}`, postForm);
      setPostsData((prevPosts) =>
        prevPosts.map((post) =>
          post.id === editingPostId ? { ...post, ...response.data } : post,
        ),
      );
      resetPostModal();
    } catch (err: any) {
      console.error("Error updating post:", err);
      showToastError(err.response?.data?.error || "Failed to update post.");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setOpenPostMenuId(null);

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/post/${postId}`);
      setPostsData((prevPosts) =>
        prevPosts.filter((post) => post.id !== postId),
      );
    } catch (err: any) {
      console.error("Error deleting post:", err);
      showToastError(err.response?.data?.error || "Failed to delete post.");
    }
  };

  const openReportModal = (postId: string) => {
    setOpenPostMenuId(null);
    setReportTargetPostId(postId);
    setReportReason("");
    setIsReportModalOpen(true);
  };

  const resetReportModal = () => {
    setIsReportModalOpen(false);
    setReportTargetPostId(null);
    setReportReason("");
  };

  const handleReportPost = async () => {
    const trimmedReason = reportReason.trim();

    if (!reportTargetPostId) return;

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

    if (reportingPostIds.has(reportTargetPostId)) return;

    setReportingPostIds((prev) => new Set(prev).add(reportTargetPostId));

    try {
      await api.post(`/post/${reportTargetPostId}/report`, {
        reason: trimmedReason,
      });
      resetReportModal();
      showToastSuccess("Post reported. Our moderators will review it.");
    } catch (err: any) {
      console.error("Error reporting post:", err);
      showToastError(err.response?.data?.error || "Failed to report post.");
    } finally {
      setReportingPostIds((prev) => {
        const next = new Set(prev);
        next.delete(reportTargetPostId);
        return next;
      });
    }
  };

  const isSubmittingReport = reportTargetPostId
    ? reportingPostIds.has(reportTargetPostId)
    : false;

  return (
    <div className="flex flex-col items-center w-full mt-2 mb-10">
      <DiscussionHero />

      <div className="w-full px-4 md:px-10 xl:px-20">
        <DiscussionAnnouncementsSection
          loadingPosts={loadingPosts}
          announcementsData={announcementsData}
          onProfileClick={handleProfileClick}
        />

        <h1 className="mt-10 text-4xl font-semibold text-left w-full max-w-[1400px] mx-auto">
          Posts
        </h1>

        <DiscussionPostsToolbar
          visiblePosts={paginatedPosts.length}
          totalPosts={filteredPosts.length}
          safeCurrentPage={safeCurrentPage}
          totalPostPages={totalPostPages}
          onPageChange={handlePageChange}
        />

        <DiscussionPostsGrid
          loadingPosts={loadingPosts}
          postsData={postsData}
          filteredPosts={filteredPosts}
          paginatedPosts={paginatedPosts}
          currentUserId={currentUserId}
          openPostMenuId={openPostMenuId}
          postMenuRef={postMenuRef}
          likingPostIds={likingPostIds}
          reportingPostIds={reportingPostIds}
          onProfileClick={handleProfileClick}
          onToggleMenu={handleTogglePostMenu}
          onViewPost={handleViewPost}
          onEditPost={openPostEditModal}
          onDeletePost={(postId) => {
            void handleDeletePost(postId);
          }}
          onReportPost={openReportModal}
          onLikePost={handleLikePost}
        />
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
        targetLabel="post"
        reason={reportReason}
        maxLength={MAX_REPORT_REASON_LENGTH}
        isSubmitting={isSubmittingReport}
        onClose={resetReportModal}
        onChange={setReportReason}
        onSubmit={() => {
          void handleReportPost();
        }}
      />

      <ErrorToast error={error} variant={toastVariant} />
    </div>
  );
};

export default Discussion;
