import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import AdminActionModal from "../components/admin/AdminActionModal";
import AdminActionFields from "../components/admin/AdminActionFields";
import AdminPagination from "../components/admin/AdminPagination";
import AdminPanelHeader from "../components/admin/AdminPanelHeader";
import AdminTabs from "../components/admin/AdminTabs";
import CommentsManagement from "../components/admin/CommentsManagement";
import LogsManagement from "../components/admin/LogsManagement";
import PostsManagement from "../components/admin/PostsManagement";
import ReportsManagement from "../components/admin/ReportsManagement";
import UsersManagement from "../components/admin/UsersManagement";
import {
  getActionModalContent,
  type PendingAdminAction,
} from "../components/admin/adminPanelActions";
import { AdminPanelSkeleton } from "../components/LoadingSkeletons";
import {
  VALID_ADMIN_TABS,
  type AdminComment,
  type AdminLog,
  type AdminPost,
  type AdminTabId,
  type AdminUser,
} from "../components/admin/types";
import ErrorToast from "../components/ErrorToast";
import { useSession } from "../context/SessionContext";
import api from "../utils/api";
import { useErrorToast } from "../utils/useErrorToast";

const ITEMS_PER_PAGE = 8;
const MAX_DELETE_REASON_LENGTH = 300;
const MAX_IP_BAN_REASON_LENGTH = 200;
const MAX_ANNOUNCEMENT_TITLE_LENGTH = 200;
const MAX_ANNOUNCEMENT_TEXT_LENGTH = 10000;
const MIN_ADMIN_SKELETON_MS = import.meta.env.DEV ? 1200 : 0;

const getInitialTab = (): AdminTabId => {
  const requestedTab = new URLSearchParams(window.location.search).get("tab");

  if (requestedTab && VALID_ADMIN_TABS.includes(requestedTab as AdminTabId)) {
    return requestedTab as AdminTabId;
  }

  return "users";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error && "response" in error) {
    return (error as any).response?.data?.error || fallback;
  }
  return fallback;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useSession();
  const [activeTab, setActiveTab] = useState<AdminTabId>(getInitialTab);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminLog[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingReportId, setProcessingReportId] = useState<string | null>(
    null,
  );
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [deleteReasonInput, setDeleteReasonInput] = useState("");
  const [timeoutMinutesInput, setTimeoutMinutesInput] = useState("60");
  const [timeoutReasonInput, setTimeoutReasonInput] = useState("");
  const [ipBanMinutesInput, setIpBanMinutesInput] = useState("");
  const [ipBanReasonInput, setIpBanReasonInput] = useState("");
  const [announcementTitleInput, setAnnouncementTitleInput] = useState("");
  const [announcementTextInput, setAnnouncementTextInput] = useState("");
  const [pageByTab, setPageByTab] = useState<Record<AdminTabId, number>>({
    users: 1,
    posts: 1,
    comments: 1,
    reports: 1,
    logs: 1,
  });

  const { error, showError } = useErrorToast();

  useEffect(() => {
    void checkAccess();
  }, []);

  useEffect(() => {
    if (hasModerationAccess) {
      void fetchData(activeTab);
    }
  }, [activeTab, hasModerationAccess]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    window.history.replaceState({}, "", `/admin?${params.toString()}`);
  }, [activeTab]);

  const checkAccess = async () => {
    setIsCheckingAccess(true);

    try {
      const res = await api.get("/user-profile?includeSpotify=false");
      setCurrentUserRole(res.data.role);
      setCurrentUserId(res.data.id);

      if (res.data.role === "ADMIN" || res.data.role === "MODERATOR") {
        setHasModerationAccess(true);
        return;
      }

      window.location.href = "/home";
    } catch {
      window.location.href = "/login";
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const fetchData = async (tab: AdminTabId = activeTab) => {
    const startedAt = performance.now();
    setLoading(true);

    try {
      switch (tab) {
        case "users": {
          const res = await api.get("/admin/users");
          setUsers(res.data);
          break;
        }
        case "posts": {
          const res = await api.get("/admin/posts");
          setPosts(res.data);
          break;
        }
        case "comments": {
          const res = await api.get("/admin/comments");
          setComments(res.data);
          break;
        }
        case "logs": {
          const res = await api.get("/admin/logs");
          setLogs(res.data);
          break;
        }
        case "reports": {
          const res = await api.get("/admin/reports");
          setReports(res.data);
          break;
        }
      }
    } catch (err) {
      if (typeof err === "object" && err && "response" in err) {
        const status = (err as any).response?.status;
        if (status === 403) {
          showError("Your session permissions changed. Please log in again.");
          setTimeout(() => {
            localStorage.removeItem("token");
            setCurrentUser(null);
            window.location.href = "/login";
          }, 400);
          return;
        }
      }
      showError("Failed to load admin data. Please try again.");
    } finally {
      const elapsed = performance.now() - startedAt;
      const remainingDelay = MIN_ADMIN_SKELETON_MS - elapsed;

      if (remainingDelay > 0) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, remainingDelay),
        );
      }

      setLoading(false);
    }
  };

  const closeActionModal = () => {
    setPendingAction(null);
    setDeleteReasonInput("");
    setTimeoutMinutesInput("60");
    setTimeoutReasonInput("");
    setIpBanMinutesInput("");
    setIpBanReasonInput("");
    setAnnouncementTitleInput("");
    setAnnouncementTextInput("");
  };

  const requestDeletePost = async (postId: string) => {
    setDeleteReasonInput("");
    setPendingAction({ type: "delete-post", postId });
  };

  const requestDeleteComment = async (commentId: string) => {
    setDeleteReasonInput("");
    setPendingAction({ type: "delete-comment", commentId });
  };

  const requestReportAction = async (
    reportId: string,
    action: "dismiss" | "block-user",
  ) => {
    const report = reports.find((entry) => entry.id === reportId);
    setPendingAction({
      type: "report-action",
      reportId,
      action,
      username: report?.user.username ?? "this user",
    });
  };

  const requestRoleChange = async (userId: string, nextRole: string) => {
    const target = users.find((user) => user.id === userId);
    if (!target) {
      return;
    }
    setPendingAction({
      type: "change-role",
      userId,
      username: target.username,
      currentRole: target.role,
      nextRole,
    });
  };

  const requestToggleBlock = async (userId: string, nextBlocked: boolean) => {
    const target = users.find((user) => user.id === userId);
    if (!target) {
      return;
    }
    setPendingAction({
      type: "toggle-block",
      userId,
      username: target.username,
      nextBlocked,
    });
  };

  const requestSetTimeout = async (user: AdminUser) => {
    setTimeoutMinutesInput("60");
    setTimeoutReasonInput(user.timeoutReason ?? "");
    setPendingAction({ type: "set-timeout", user });
  };

  const requestClearTimeout = async (user: AdminUser) => {
    setPendingAction({ type: "clear-timeout", user });
  };

  const requestSetIpBan = async (user: AdminUser) => {
    setIpBanMinutesInput("");
    setIpBanReasonInput(user.activeIpBanReason ?? "");
    setPendingAction({ type: "set-ip-ban", user });
  };

  const requestClearIpBan = async (user: AdminUser) => {
    setPendingAction({ type: "clear-ip-ban", user });
  };

  const requestDeleteUser = async (user: AdminUser) => {
    setPendingAction({ type: "delete-user", user });
  };

  const requestCreateAnnouncement = async () => {
    setAnnouncementTitleInput("");
    setAnnouncementTextInput("");
    setPendingAction({ type: "create-announcement" });
  };

  const visitPost = (postId: string) => {
    navigate(`/discussion/view/${postId}`);
  };

  const visitComment = (postId: string) => {
    navigate(`/discussion/view/${postId}`);
  };

  const timeoutInputInvalid = useMemo(() => {
    if (!pendingAction || pendingAction.type !== "set-timeout") {
      return false;
    }

    const minutes = Number(timeoutMinutesInput.trim());
    return (
      !Number.isInteger(minutes) || minutes <= 0 || !timeoutReasonInput.trim()
    );
  }, [pendingAction, timeoutMinutesInput, timeoutReasonInput]);

  const deleteReasonInvalid = useMemo(() => {
    if (
      !pendingAction ||
      (pendingAction.type !== "delete-post" &&
        pendingAction.type !== "delete-comment")
    ) {
      return false;
    }

    const reasonLength = deleteReasonInput.trim().length;
    return reasonLength === 0 || reasonLength > MAX_DELETE_REASON_LENGTH;
  }, [deleteReasonInput, pendingAction]);

  const ipBanInputInvalid = useMemo(() => {
    if (!pendingAction || pendingAction.type !== "set-ip-ban") {
      return false;
    }

    const trimmedReason = ipBanReasonInput.trim();
    if (!trimmedReason || trimmedReason.length > MAX_IP_BAN_REASON_LENGTH) {
      return true;
    }

    const trimmedMinutes = ipBanMinutesInput.trim();
    if (!trimmedMinutes) {
      return false;
    }

    const parsedMinutes = Number(trimmedMinutes);
    return !Number.isInteger(parsedMinutes) || parsedMinutes <= 0;
  }, [ipBanMinutesInput, ipBanReasonInput, pendingAction]);

  const announcementInputInvalid = useMemo(() => {
    if (!pendingAction || pendingAction.type !== "create-announcement") {
      return false;
    }

    const trimmedTitle = announcementTitleInput.trim();
    const trimmedText = announcementTextInput.trim();

    return (
      !trimmedTitle ||
      !trimmedText ||
      trimmedTitle.length > MAX_ANNOUNCEMENT_TITLE_LENGTH ||
      trimmedText.length > MAX_ANNOUNCEMENT_TEXT_LENGTH
    );
  }, [announcementTextInput, announcementTitleInput, pendingAction]);

  const paginateByTab = <T,>(items: T[], tab: AdminTabId) => {
    const page = pageByTab[tab] ?? 1;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const activeTabItemCount = useMemo(() => {
    switch (activeTab) {
      case "users":
        return users.length;
      case "posts":
        return posts.length;
      case "comments":
        return comments.length;
      case "reports":
        return reports.length;
      case "logs":
        return logs.length;
    }
  }, [
    activeTab,
    users.length,
    posts.length,
    comments.length,
    reports.length,
    logs.length,
  ]);

  const activePage = pageByTab[activeTab] ?? 1;
  const totalPages = Math.max(
    1,
    Math.ceil(activeTabItemCount / ITEMS_PER_PAGE),
  );
  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(activePage - 2, totalPages - 6));
    return Array.from({ length: 7 }, (_, index) => start + index);
  }, [activePage, totalPages]);

  useEffect(() => {
    if (activePage <= totalPages) {
      return;
    }

    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: totalPages,
    }));
  }, [activePage, activeTab, totalPages]);

  const setPageForActiveTab = (nextPage: number) => {
    setPageByTab((prev) => ({
      ...prev,
      [activeTab]: nextPage,
    }));
  };

  const executePendingAction = async () => {
    if (!pendingAction) {
      return;
    }

    setIsSubmittingAction(true);

    try {
      switch (pendingAction.type) {
        case "delete-post": {
          const trimmedReason = deleteReasonInput.trim();
          if (!trimmedReason) {
            showError("Delete reason is required.");
            return;
          }

          await api.delete(`/admin/posts/${pendingAction.postId}`, {
            data: { reason: trimmedReason },
          });
          setPosts((prev) =>
            prev.filter((post) => post.id !== pendingAction.postId),
          );
          break;
        }

        case "delete-comment": {
          const trimmedReason = deleteReasonInput.trim();
          if (!trimmedReason) {
            showError("Delete reason is required.");
            return;
          }

          await api.delete(`/admin/comments/${pendingAction.commentId}`, {
            data: { reason: trimmedReason },
          });
          setComments((prev) =>
            prev.filter((comment) => comment.id !== pendingAction.commentId),
          );
          break;
        }

        case "report-action": {
          setProcessingReportId(pendingAction.reportId);
          await api.patch(
            `/admin/reports/${pendingAction.reportId}/${pendingAction.action}`,
          );
          await fetchData("reports");
          setProcessingReportId(null);
          break;
        }

        case "change-role": {
          setProcessingUserId(pendingAction.userId);
          const res = await api.patch(
            `/admin/users/${pendingAction.userId}/role`,
            {
              role: pendingAction.nextRole,
            },
          );
          setUsers((prev) =>
            prev.map((user) =>
              user.id === pendingAction.userId
                ? { ...user, ...res.data.user }
                : user,
            ),
          );
          setProcessingUserId(null);
          break;
        }

        case "toggle-block": {
          setProcessingUserId(pendingAction.userId);
          const res = await api.patch(
            `/admin/users/${pendingAction.userId}/block`,
            {
              isBlocked: pendingAction.nextBlocked,
            },
          );
          setUsers((prev) =>
            prev.map((user) =>
              user.id === pendingAction.userId
                ? { ...user, ...res.data.user }
                : user,
            ),
          );
          setProcessingUserId(null);
          break;
        }

        case "set-timeout": {
          const durationMinutes = Number(timeoutMinutesInput.trim());
          if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
            showError("Please enter a valid timeout duration in minutes.");
            return;
          }
          if (!timeoutReasonInput.trim()) {
            showError("Timeout reason is required.");
            return;
          }

          setProcessingUserId(pendingAction.user.id);
          const res = await api.patch(
            `/admin/users/${pendingAction.user.id}/timeout`,
            {
              durationMinutes,
              reason: timeoutReasonInput.trim(),
            },
          );
          setUsers((prev) =>
            prev.map((entry) =>
              entry.id === pendingAction.user.id ? res.data.user : entry,
            ),
          );
          setProcessingUserId(null);
          break;
        }

        case "clear-timeout": {
          setProcessingUserId(pendingAction.user.id);
          const res = await api.delete(
            `/admin/users/${pendingAction.user.id}/timeout`,
          );
          setUsers((prev) =>
            prev.map((entry) =>
              entry.id === pendingAction.user.id ? res.data.user : entry,
            ),
          );
          setProcessingUserId(null);
          break;
        }

        case "set-ip-ban": {
          setProcessingUserId(pendingAction.user.id);
          const trimmedMinutes = ipBanMinutesInput.trim();
          if (!ipBanReasonInput.trim()) {
            showError("IP ban reason is required.");
            return;
          }

          await api.patch(`/admin/users/${pendingAction.user.id}/ip-ban`, {
            durationMinutes: trimmedMinutes ? Number(trimmedMinutes) : null,
            reason: ipBanReasonInput.trim(),
          });
          await fetchData("users");
          setProcessingUserId(null);
          break;
        }

        case "clear-ip-ban": {
          setProcessingUserId(pendingAction.user.id);
          await api.delete(`/admin/users/${pendingAction.user.id}/ip-ban`);
          await fetchData("users");
          setProcessingUserId(null);
          break;
        }

        case "delete-user": {
          setProcessingUserId(pendingAction.user.id);
          await api.delete(`/admin/users/${pendingAction.user.id}`);
          setUsers((prev) =>
            prev.filter((entry) => entry.id !== pendingAction.user.id),
          );
          setProcessingUserId(null);
          break;
        }

        case "create-announcement": {
          const res = await api.post("/admin/announcements", {
            title: announcementTitleInput.trim(),
            text: announcementTextInput.trim(),
          });
          setPosts((prev) => [res.data.post, ...prev]);
          break;
        }
      }

      closeActionModal();
    } catch (err) {
      if (pendingAction.type === "report-action") {
        setProcessingReportId(null);
      }
      if (
        pendingAction.type === "change-role" ||
        pendingAction.type === "toggle-block" ||
        pendingAction.type === "set-timeout" ||
        pendingAction.type === "clear-timeout" ||
        pendingAction.type === "set-ip-ban" ||
        pendingAction.type === "clear-ip-ban" ||
        pendingAction.type === "delete-user"
      ) {
        setProcessingUserId(null);
      }

      showError(getErrorMessage(err, "Failed to complete admin action."));

      if (
        pendingAction.type === "change-role" ||
        pendingAction.type === "toggle-block" ||
        pendingAction.type === "set-timeout" ||
        pendingAction.type === "clear-timeout" ||
        pendingAction.type === "set-ip-ban" ||
        pendingAction.type === "clear-ip-ban" ||
        pendingAction.type === "delete-user"
      ) {
        await fetchData("users");
      }
      if (pendingAction.type === "report-action") {
        await fetchData("reports");
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const actionModalContent = useMemo(
    () => getActionModalContent(pendingAction),
    [pendingAction],
  );

  const canManageUsers = currentUserRole === "ADMIN";

  const renderActiveTab = () => {
    switch (activeTab) {
      case "users":
        return (
          <UsersManagement
            users={paginateByTab(users, "users")}
            canManageUsers={canManageUsers}
            processingUserId={processingUserId}
            currentUserId={currentUserId}
            onRoleChange={requestRoleChange}
            onToggleBlock={requestToggleBlock}
            onSetTimeout={requestSetTimeout}
            onClearTimeout={requestClearTimeout}
            onSetIpBan={requestSetIpBan}
            onClearIpBan={requestClearIpBan}
            onDeleteUser={requestDeleteUser}
          />
        );
      case "posts":
        return (
          <PostsManagement
            posts={paginateByTab(posts, "posts")}
            onDeletePost={requestDeletePost}
            onVisitPost={visitPost}
          />
        );
      case "comments":
        return (
          <CommentsManagement
            comments={paginateByTab(comments, "comments")}
            onDeleteComment={requestDeleteComment}
            onVisitComment={visitComment}
          />
        );
      case "reports":
        return (
          <ReportsManagement
            reports={paginateByTab(reports, "reports")}
            processingReportId={processingReportId}
            onRequestReportAction={requestReportAction}
          />
        );
      case "logs":
        return <LogsManagement logs={paginateByTab(logs, "logs")} />;
      default:
        return null;
    }
  };

  if (isCheckingAccess || !hasModerationAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        {isCheckingAccess ? "Checking permissions..." : "Access denied"}
        <ErrorToast error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <AdminPanelHeader
          canManageUsers={canManageUsers}
          onCreateAnnouncement={() => {
            void requestCreateAnnouncement();
          }}
        />

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="bg-gray-800 rounded-lg p-2 sm:p-4">
          {loading ? <AdminPanelSkeleton /> : renderActiveTab()}
        </div>

        {!loading && activeTabItemCount > 0 && (
          <AdminPagination
            activePage={activePage}
            totalPages={totalPages}
            visiblePageNumbers={visiblePageNumbers}
            onPageChange={setPageForActiveTab}
          />
        )}
      </div>

      <AdminActionModal
        isOpen={!!pendingAction}
        title={actionModalContent.title}
        description={actionModalContent.description}
        confirmLabel={actionModalContent.confirmLabel}
        danger={actionModalContent.danger}
        isSubmitting={isSubmittingAction}
        confirmDisabled={
          timeoutInputInvalid ||
          deleteReasonInvalid ||
          ipBanInputInvalid ||
          announcementInputInvalid
        }
        onClose={closeActionModal}
        onConfirm={() => {
          void executePendingAction();
        }}
      >
        <AdminActionFields
          pendingAction={pendingAction}
          timeoutMinutesInput={timeoutMinutesInput}
          timeoutReasonInput={timeoutReasonInput}
          deleteReasonInput={deleteReasonInput}
          ipBanMinutesInput={ipBanMinutesInput}
          ipBanReasonInput={ipBanReasonInput}
          announcementTitleInput={announcementTitleInput}
          announcementTextInput={announcementTextInput}
          maxDeleteReasonLength={MAX_DELETE_REASON_LENGTH}
          maxIpBanReasonLength={MAX_IP_BAN_REASON_LENGTH}
          maxAnnouncementTitleLength={MAX_ANNOUNCEMENT_TITLE_LENGTH}
          maxAnnouncementTextLength={MAX_ANNOUNCEMENT_TEXT_LENGTH}
          onTimeoutMinutesInputChange={setTimeoutMinutesInput}
          onTimeoutReasonInputChange={setTimeoutReasonInput}
          onDeleteReasonInputChange={setDeleteReasonInput}
          onIpBanMinutesInputChange={setIpBanMinutesInput}
          onIpBanReasonInputChange={setIpBanReasonInput}
          onAnnouncementTitleInputChange={setAnnouncementTitleInput}
          onAnnouncementTextInputChange={setAnnouncementTextInput}
        />
      </AdminActionModal>

      <ErrorToast error={error} />
    </div>
  );
};

export default AdminPanel;
