import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorToast from "../components/ErrorToast";
import EditPostModal from "../components/profile/EditPostModal";
import EditProfileModal from "../components/profile/EditProfileModal";
import ProfileContent from "../components/profile/ProfileContent";
import ProfileSummaryCard from "../components/profile/ProfileSummaryCard";
import SettingsContent from "../components/profile/SettingsContent";
import { useSession } from "../context/SessionContext";
import type {
  PostFormData,
  SpotifyTimeRange,
  UserProfileData,
} from "../components/profile/types";
import api from "../utils/api";
import { normalizeHashtagInput } from "../utils/hashtags";
import type { DiscussionType } from "../utils/Type";
import { useErrorToast } from "../utils/useErrorToast";
import { discussionController } from "../controllers/discussionController";

const normalizeSpotifyTimeRange = (value: unknown): SpotifyTimeRange => {
  if (value === "SHORT" || value === "MEDIUM" || value === "LONG") {
    return value;
  }

  if (value === "4week") {
    return "SHORT";
  }

  if (value === "6month") {
    return "MEDIUM";
  }

  if (value === "alltime") {
    return "LONG";
  }

  return "MEDIUM";
};

const UserProfile = () => {
  const { setCurrentUser } = useSession();
  const [isOnProfile, setIsOnProfile] = useState(true);
  const [spotiHover, setSpotiHover] = useState(false);
  const [soundHover, setSoundHover] = useState(false);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<SpotifyTimeRange>("MEDIUM");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const [userPosts, setUserPosts] = useState<DiscussionType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<PostFormData>({
    title: "",
    topic: "",
    hashtags: "",
    text: "",
  });
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const postMenuRef = useRef<HTMLDivElement | null>(null);

  const { error, showError } = useErrorToast();

  const resetModal = () => {
    setNewUsername("");
    setNewEmail("");
    setConfirmUsername("");
    setDescription("");
    setPassword("");
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const openEditModal = () => {
    setNewUsername(user?.username || "");
    setNewEmail(user?.email || "");
    setConfirmUsername(user?.username || "");
    setDescription(user?.description || "");
    setPassword("");
    setIsModalOpen(true);
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

  const handleTogglePostMenu = (postId: string) => {
    setOpenPostMenuId((prev) => (prev === postId ? null : postId));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newUsername !== confirmUsername) {
      showError("A két felhasználónév nem egyezik!");
      return;
    }

    if (!password) {
      showError("Kérlek add meg a jelszavad!");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put("/user-profile", {
        username: newUsername,
        email: newEmail,
        description,
        password,
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              username: response.data.username,
              email: response.data.email,
              description: response.data.description ?? null,
            }
          : null,
      );
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              username: response.data.username,
              email: response.data.email,
            }
          : prev,
      );

      closeEditModal();
    } catch (err: any) {
      showError(err.response?.data?.error || "Hiba történt a frissítés során");
    } finally {
      setIsUpdating(false);
    }
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

  const handlePrivacyToggle = async () => {
    if (!user || isUpdatingPrivacy) {
      return;
    }

    setIsUpdatingPrivacy(true);
    try {
      const response = await api.patch("/user-profile/privacy", {
        isPrivate: !user.isPrivate,
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              isPrivate: response.data.isPrivate,
            }
          : prev,
      );
    } catch (err: any) {
      showError(err.response?.data?.error || "Failed to update privacy.");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleConnectSpotify = async () => {
    try {
      const response = await api.get("/auth/spotify/url");
      window.location.href = response.data.url;
    } catch (err: any) {
      showError(
        err.response?.data?.error || "Failed to connect Spotify. Try again.",
      );
    }
  };

  const handleDisconnectSpotify = async () => {
    try {
      await api.delete("/auth/spotify");
      setUser((prev) => (prev ? { ...prev, spotifyConnected: false } : null));
      setSpotiHover(false);
    } catch (err: any) {
      showError(
        err.response?.data?.error || "Failed to disconnect Spotify. Try again.",
      );
    }
  };

  const connectedToSpotify = user?.spotifyConnected ?? false;
  const connectedToSoundCloud = user?.soundCloudConnected ?? false;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const [profileResult, postsResult] = await Promise.allSettled([
        api.get("/user-profile?includeSpotify=true"),
        discussionController.getMyPosts(),
      ]);

      if (profileResult.status === "fulfilled") {
        const userData = profileResult.value.data;
        setUser(userData);
        const selectedTimeRange = userData.spotifyTimeRange;
        const normalizedTimeRange = normalizeSpotifyTimeRange(selectedTimeRange);
        setTimeRange(normalizedTimeRange);
      } else {
        const profileError = profileResult.reason as any;
        showError(
          profileError?.response?.data?.error || "Failed to load profile.",
        );
      }
      setLoading(false);

      if (postsResult.status === "fulfilled") {
        setUserPosts(postsResult.value.data);
      } else {
        const postsError = postsResult.reason as any;
        showError(
          postsError?.response?.data?.error || "Failed to load your posts.",
        );
      }
      setLoadingPosts(false);
    };

    void fetchUserProfile();
  }, []);

  const handleTimeRangeChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const previousValue = timeRange;
    const newValue = normalizeSpotifyTimeRange(event.target.value);
    setTimeRange(newValue);
    setUser((prev) => (prev ? { ...prev, spotifyTimeRange: newValue } : prev));

    try {
      await api.patch("/user-profile/spotify-time-range", {
        timeRange: newValue,
      });
    } catch (err: any) {
      setTimeRange(previousValue);
      setUser((prev) =>
        prev ? { ...prev, spotifyTimeRange: previousValue } : prev,
      );
      showError(err.response?.data?.error || "Failed to update time range.");
    }
  };

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

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPostId) {
      return;
    }

    setIsSavingPost(true);
    try {
      const response = await discussionController.updatePost(
        editingPostId,
        postForm,
      );
      setUserPosts((prev) =>
        prev.map((post) =>
          post.id === editingPostId ? { ...post, ...response.data } : post,
        ),
      );
      resetPostModal();
    } catch (err: any) {
      showError(err.response?.data?.error || "Failed to update post.");
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
      await discussionController.deletePost(postId);
      setUserPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err: any) {
      showError(err.response?.data?.error || "Failed to delete post.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <p className="text-white">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4">
      <div className="flex flex-col items-center justify-center mt-12 w-full max-w-5xl">
        <div className="flex gap-4 self-start mb-3 text-xl sm:text-2xl">
          <button
            className={`pointer hover:font-medium hover:underline underline-offset-2 ${
              isOnProfile ? "font-medium underline" : ""
            }`}
            onClick={() => setIsOnProfile(true)}
          >
            Profile
          </button>
          <button
            className={`pointer hover:font-medium hover:underline underline-offset-2 ${
              isOnProfile ? "" : "font-medium underline"
            }`}
            onClick={() => setIsOnProfile(false)}
          >
            Settings
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-card-black w-full min-h-[460px] p-4 sm:p-6 flex flex-col lg:flex-row gap-6 rounded-3xl shadow-lg border border-white/5"
        >
          <ProfileSummaryCard user={user} />

          <div className="flex-1 p-2 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {isOnProfile ? (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProfileContent
                    loadingPosts={loadingPosts}
                    userPosts={userPosts}
                    openPostMenuId={openPostMenuId}
                    postMenuRef={postMenuRef}
                    onTogglePostMenu={handleTogglePostMenu}
                    onOpenPostEdit={openPostEditModal}
                    onDeletePost={handleDeletePost}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <SettingsContent
                    connectedToSpotify={connectedToSpotify}
                    connectedToSoundCloud={connectedToSoundCloud}
                    spotiHover={spotiHover}
                    soundHover={soundHover}
                    timeRange={timeRange}
                    isPrivate={user?.isPrivate ?? false}
                    isUpdatingPrivacy={isUpdatingPrivacy}
                    onOpenEditModal={openEditModal}
                    onTogglePrivacy={handlePrivacyToggle}
                    onConnectSpotify={handleConnectSpotify}
                    onDisconnectSpotify={handleDisconnectSpotify}
                    onSpotifyHoverChange={setSpotiHover}
                    onSoundHoverChange={setSoundHover}
                    onTimeRangeChange={handleTimeRangeChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <EditProfileModal
          isOpen={isModalOpen}
          newUsername={newUsername}
          newEmail={newEmail}
          confirmUsername={confirmUsername}
          description={description}
          password={password}
          isUpdating={isUpdating}
          onClose={closeEditModal}
          onSubmit={handleUpdateProfile}
          onUsernameChange={setNewUsername}
          onEmailChange={setNewEmail}
          onConfirmUsernameChange={setConfirmUsername}
          onDescriptionChange={setDescription}
          onPasswordChange={setPassword}
        />

        <EditPostModal
          isOpen={isPostModalOpen}
          postForm={postForm}
          isSavingPost={isSavingPost}
          onClose={resetPostModal}
          onSubmit={handleSavePost}
          onFieldChange={handlePostFieldChange}
        />
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default UserProfile;
