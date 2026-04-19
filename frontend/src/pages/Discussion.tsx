import { Link, useNavigate } from "react-router";
import {
  EllipsisVertical,
  Heart,
  MessageCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "../components/Button";
import ErrorToast from "../components/ErrorToast";
import { getNormalizedHashtags, normalizeHashtagInput } from "../utils/hashtags";
import { useErrorToast } from "../utils/useErrorToast";
import api from "../utils/api";
import formatRelative from "../utils/DateFormatting";
import { getLikedPosts, getStoredUser, saveLikedPosts } from "../utils/auth";
import type { DiscussionType } from "../utils/Type";

const MAX_REPORT_REASON_LENGTH = 1000;

const Discussion = () => {
  // Fixed typo: was `lodingPosts` (missing 'a')
  const [postsData, setPostsData] = useState<DiscussionType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [likingPostIds, setLikingPostIds] = useState<Set<string>>(new Set());
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
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
  const [discussionSearchQuery, setDiscussionSearchQuery] = useState("");
  const [isDiscussionFilterOpen, setIsDiscussionFilterOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedAuthorId, setSelectedAuthorId] = useState("all");
  const [selectedSort, setSelectedSort] = useState<
    "newest" | "oldest" | "mostLiked"
  >("newest");
  const [discussionHashtagFilter, setDiscussionHashtagFilter] = useState("");
  const [onlyMyPosts, setOnlyMyPosts] = useState(false);
  const [onlyLikedPosts, setOnlyLikedPosts] = useState(false);
  const postMenuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const currentUserId = getStoredUser()?.id ?? null;
  const { error, showError } = useErrorToast();

  const topicOptions = useMemo(() => {
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

  const authorOptions = useMemo(() => {
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

  const resetDiscussionFilters = () => {
    setDiscussionSearchQuery("");
    setSelectedTopic("all");
    setSelectedAuthorId("all");
    setSelectedSort("newest");
    setDiscussionHashtagFilter("");
    setOnlyMyPosts(false);
    setOnlyLikedPosts(false);
  };

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
    const fetchAllPosts = async () => {
      try {
        const response = await api.get("/posts");
        const likedPosts = getLikedPosts();

        setPostsData(
          response.data.map((post: DiscussionType) => ({
            ...post,
            isLiked: likedPosts.has(post.id),
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
    fetchAllPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    event: React.MouseEvent<HTMLButtonElement>,
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

      const storedLikes = getLikedPosts();

      if (response.data.isLiked) storedLikes.add(postId);
      else storedLikes.delete(postId);

      saveLikedPosts(storedLikes);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({
      ...prev,
      [name]: name === "hashtags" ? normalizeHashtagInput(value) : value,
    }));
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

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

  return (
    <div className="flex flex-col items-center w-full mt-2 mb-10">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mt-10 text-center">
          Welcome to discussion
        </h1>
        <p className="text-lg mt-2 text-center">
          This is where we talk about music, life, and everything in between
        </p>
      </div>

      <div>
        <Link to="/discussion/create">
          <Button
            labelTitle="Create a post"
            className="outline-1 outline-black hover:outline-gray-500 mt-8!"
          />
        </Link>
      </div>

      <div className="w-full px-4 md:px-10 xl:px-20">
        <h1 className="mt-4 text-4xl font-semibold text-left w-full max-w-[1400px] mx-auto">
          Posts
        </h1>

        <div className="w-full max-w-[1400px] mx-auto mt-4">
          <div className="rounded-2xl border border-white/10 bg-card-black p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search in discussions..."
                  value={discussionSearchQuery}
                  onChange={(event) => setDiscussionSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-card px-10 py-2 text-white outline-none transition-colors focus:border-spotify-green"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscussionFilterOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 cursor-pointer"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
                <button
                  type="button"
                  onClick={resetDiscussionFilters}
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {isDiscussionFilterOpen && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                  Topic
                  <select
                    value={selectedTopic}
                    onChange={(event) => setSelectedTopic(event.target.value)}
                    className="rounded-lg border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
                  >
                    <option value="all">All topics</option>
                    {topicOptions.map((topic) => (
                      <option key={topic.value} value={topic.value}>
                        {topic.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-gray-300">
                  Author
                  <select
                    value={selectedAuthorId}
                    onChange={(event) => setSelectedAuthorId(event.target.value)}
                    className="rounded-lg border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
                  >
                    <option value="all">All authors</option>
                    {authorOptions.map((author) => (
                      <option key={author.value} value={author.value}>
                        {author.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-gray-300">
                  Sort
                  <select
                    value={selectedSort}
                    onChange={(event) =>
                      setSelectedSort(
                        event.target.value as "newest" | "oldest" | "mostLiked",
                      )
                    }
                    className="rounded-lg border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="mostLiked">Most liked</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-gray-300">
                  Hashtags
                  <input
                    type="text"
                    value={discussionHashtagFilter}
                    onChange={(event) =>
                      setDiscussionHashtagFilter(
                        normalizeHashtagInput(event.target.value),
                      )
                    }
                    placeholder="#music #rock"
                    className="rounded-lg border border-white/10 bg-card px-3 py-2 text-white outline-none focus:border-spotify-green"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={onlyMyPosts}
                    onChange={(event) => setOnlyMyPosts(event.target.checked)}
                    className="h-4 w-4 accent-spotify-green"
                  />
                  Only my posts
                </label>

                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={onlyLikedPosts}
                    onChange={(event) => setOnlyLikedPosts(event.target.checked)}
                    className="h-4 w-4 accent-spotify-green"
                  />
                  Only liked posts
                </label>
              </div>
            )}

            <p className="mt-3 text-sm text-gray-400">
              Showing {filteredPosts.length} of {postsData.length} posts
            </p>
          </div>
        </div>

        <div className="grid flex-row items-center justify-center w-full max-w-[1400px] mx-auto gap-4 mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loadingPosts ? (
            <p>Loading posts...</p>
          ) : postsData.length === 0 ? (
            <p>No posts yet.</p>
          ) : filteredPosts.length === 0 ? (
            <p>No posts match the current search and filters.</p>
          ) : (
            filteredPosts.map((post) => (
              // Fixed: key is now on the <Link> wrapper, not the inner <div>
              <Link
                key={post.id}
                className="z-10"
                to={`/discussion/view/${post.id}`}
              >
                <div
                  key={post.id}
                  className="flex flex-col relative bg-gray-500/60 w-full min-h-[220px] sm:min-h-[260px] p-2 sm:p-4 mt-2 rounded-lg outline-1 outline-black"
                >
                  <div className="flex flex-row self-start items-start sm:items-center relative top-1 w-full gap-2">
                    <div className="min-w-0 flex flex-wrap items-center">
                      <button
                        type="button"
                        onClick={(event) => handleProfileClick(event, post.user.id)}
                        className="font-bold text-xl max-w-[100px] sm:max-w-[150px] truncate cursor-pointer hover:underline text-left"
                      >
                        {post.user.username}
                      </button>
                      <p className="mx-2 font-bold text-lg hidden sm:block">
                        {" "}
                        —{" "}
                      </p>
                      <p className="text-lg font-extralight max-w-[80px] sm:max-w-[120px] truncate">
                        {post.title}
                      </p>
                      <p className="mx-2 font-bold text-lg hidden sm:block">
                        {" "}
                        -{" "}
                      </p>
                      <p className="text-lg font-extralight italic max-w-[80px] sm:max-w-[120px] truncate">
                        {post.topic}
                      </p>
                    </div>

                    <div
                      ref={openPostMenuId === post.id ? postMenuRef : null}
                      className="ml-auto flex items-start gap-1"
                    >
                      <p className="text-sm text-gray-400 ml-auto mt-1 sm:mt-0 whitespace-nowrap">
                        {formatRelative(post.postedAt)}
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpenPostMenuId((prev) =>
                              prev === post.id ? null : post.id,
                            );
                          }}
                          className="rounded-full p-1 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
                          aria-label="Open post actions"
                        >
                          <EllipsisVertical size={18} />
                        </button>

                        {openPostMenuId === post.id && (
                          <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-card shadow-lg z-20 overflow-hidden">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setOpenPostMenuId(null);
                                navigate(`/discussion/view/${post.id}`);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                            >
                              View post
                            </button>

                            {post.userId === currentUserId ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    openPostEditModal(post);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer"
                                >
                                  Edit post
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void handleDeletePost(post.id);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 cursor-pointer"
                                >
                                  Delete post
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openReportModal(post.id);
                                }}
                                disabled={reportingPostIds.has(post.id)}
                                className="w-full text-left px-4 py-2 text-sm text-yellow-300 hover:bg-white/10 cursor-pointer disabled:opacity-50"
                              >
                                {reportingPostIds.has(post.id)
                                  ? "Reporting..."
                                  : "Report post"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-2 sm:px-4 mt-2 sm:mt-3">
                    <p className="line-clamp-5">{post.text}</p>
                  </div>

                  <div className="mt-2 sm:mt-3">
                    <p>{post.hashtags}</p>
                    <p className="text-sm text-gray-400 mt-1"></p>
                  </div>

                  <div className="mt-2 sm:mt-3 flex flex-row gap-4 justify-end absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
                    <button
                      type="button"
                      onClick={(event) => handleLikePost(event, post.id)}
                      disabled={likingPostIds.has(post.id)}
                      className={`flex items-center cursor-pointer transition-colors ${post.isLiked ? "text-red-500" : "hover:text-red-500"}`}
                    >
                      <Heart
                        className={`mr-2 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`}
                      />
                      {post.likeAmount}
                    </button>
                    <p className="flex items-center hover:text-blue-500 cursor-pointer">
                      <MessageCircle className="mr-2 z-99" />
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
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
                  disabled={
                    !reportTargetPostId ||
                    reportingPostIds.has(reportTargetPostId)
                  }
                  className="px-5 py-2 bg-yellow-400 text-black text-sm font-bold rounded-full hover:bg-yellow-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {reportTargetPostId &&
                  reportingPostIds.has(reportTargetPostId)
                    ? "Submitting..."
                    : "Submit report"}
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

export default Discussion;
