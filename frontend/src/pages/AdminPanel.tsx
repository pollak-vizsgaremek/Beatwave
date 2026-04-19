import { useEffect, useMemo, useState } from "react";
import AdminActionModal from "../components/admin/AdminActionModal";
import AdminTabs from "../components/admin/AdminTabs";
import CommentsManagement from "../components/admin/CommentsManagement";
import LogsManagement from "../components/admin/LogsManagement";
import PostsManagement from "../components/admin/PostsManagement";
import ReportsManagement from "../components/admin/ReportsManagement";
import UsersManagement from "../components/admin/UsersManagement";
import {
  VALID_ADMIN_TABS,
  type AdminComment,
  type AdminLog,
  type AdminPost,
  type AdminTabId,
  type AdminUser,
} from "../components/admin/types";
import ErrorToast from "../components/ErrorToast";
import api from "../utils/api";
import { useErrorToast } from "../utils/useErrorToast";

const ITEMS_PER_PAGE = 8;

type PendingAdminAction =
  | { type: "delete-post"; postId: string }
  | { type: "delete-comment"; commentId: string }
  | {
      type: "report-action";
      reportId: string;
      action: "dismiss" | "block-user";
      username: string;
    }
  | {
      type: "change-role";
      userId: string;
      username: string;
      currentRole: string;
      nextRole: string;
    }
  | { type: "toggle-block"; userId: string; username: string; nextBlocked: boolean }
  | { type: "set-timeout"; user: AdminUser }
  | { type: "clear-timeout"; user: AdminUser }
  | null;

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
  const [timeoutMinutesInput, setTimeoutMinutesInput] = useState("60");
  const [timeoutReasonInput, setTimeoutReasonInput] = useState("");
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
            localStorage.removeItem("user");
            window.location.href = "/login";
          }, 400);
          return;
        }
      }
      showError("Failed to load admin data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeActionModal = () => {
    setPendingAction(null);
    setTimeoutMinutesInput("60");
    setTimeoutReasonInput("");
  };

  const requestDeletePost = async (postId: string) => {
    setPendingAction({ type: "delete-post", postId });
  };

  const requestDeleteComment = async (commentId: string) => {
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

  const timeoutInputInvalid = useMemo(() => {
    if (!pendingAction || pendingAction.type !== "set-timeout") {
      return false;
    }

    const minutes = Number(timeoutMinutesInput.trim());
    return !Number.isInteger(minutes) || minutes <= 0 || !timeoutReasonInput.trim();
  }, [pendingAction, timeoutMinutesInput, timeoutReasonInput]);

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
  }, [activeTab, users.length, posts.length, comments.length, reports.length, logs.length]);

  const activePage = pageByTab[activeTab] ?? 1;
  const totalPages = Math.max(1, Math.ceil(activeTabItemCount / ITEMS_PER_PAGE));
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
          await api.delete(`/admin/posts/${pendingAction.postId}`);
          setPosts((prev) =>
            prev.filter((post) => post.id !== pendingAction.postId),
          );
          break;
        }

        case "delete-comment": {
          await api.delete(`/admin/comments/${pendingAction.commentId}`);
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
          const res = await api.patch(`/admin/users/${pendingAction.userId}/role`, {
            role: pendingAction.nextRole,
          });
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
          const res = await api.patch(`/admin/users/${pendingAction.userId}/block`, {
            isBlocked: pendingAction.nextBlocked,
          });
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
        pendingAction.type === "clear-timeout"
      ) {
        setProcessingUserId(null);
      }

      showError(getErrorMessage(err, "Failed to complete admin action."));

      if (
        pendingAction.type === "change-role" ||
        pendingAction.type === "toggle-block" ||
        pendingAction.type === "set-timeout" ||
        pendingAction.type === "clear-timeout"
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

  const actionModalContent = useMemo(() => {
    if (!pendingAction) {
      return {
        title: "",
        description: "",
        confirmLabel: "Confirm",
        danger: false,
      };
    }

    switch (pendingAction.type) {
      case "delete-post":
        return {
          title: "Delete Post",
          description: "This post will be permanently removed.",
          confirmLabel: "Delete post",
          danger: true,
        };
      case "delete-comment":
        return {
          title: "Delete Comment",
          description: "This comment will be permanently removed.",
          confirmLabel: "Delete comment",
          danger: true,
        };
      case "report-action":
        if (pendingAction.action === "dismiss") {
          return {
            title: "Dismiss Report",
            description: "This report will be marked as handled and dismissed.",
            confirmLabel: "Dismiss report",
            danger: false,
          };
        }
        return {
          title: "Block Reported User",
          description: `Block @${pendingAction.username} from posting and commenting?`,
          confirmLabel: "Block user",
          danger: true,
        };
      case "change-role":
        return {
          title: "Change User Role",
          description: `Change @${pendingAction.username} from ${pendingAction.currentRole} to ${pendingAction.nextRole}?`,
          confirmLabel: "Change role",
          danger: false,
        };
      case "toggle-block":
        return {
          title: pendingAction.nextBlocked ? "Block User" : "Unblock User",
          description: pendingAction.nextBlocked
            ? `Block @${pendingAction.username} from posting and commenting?`
            : `Restore posting and commenting access for @${pendingAction.username}?`,
          confirmLabel: pendingAction.nextBlocked ? "Block user" : "Unblock user",
          danger: pendingAction.nextBlocked,
        };
      case "set-timeout":
        return {
          title: "Set Timeout",
          description: `Set a temporary posting/commenting timeout for @${pendingAction.user.username}.`,
          confirmLabel: "Set timeout",
          danger: true,
        };
      case "clear-timeout":
        return {
          title: "Clear Timeout",
          description: `Remove the active timeout for @${pendingAction.user.username}?`,
          confirmLabel: "Clear timeout",
          danger: false,
        };
    }
  }, [pendingAction]);

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
          />
        );
      case "posts":
        return (
          <PostsManagement
            posts={paginateByTab(posts, "posts")}
            onDeletePost={requestDeletePost}
          />
        );
      case "comments":
        return (
          <CommentsManagement
            comments={paginateByTab(comments, "comments")}
            onDeleteComment={requestDeleteComment}
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
          Moderation Panel
        </h1>

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="bg-gray-800 rounded-lg p-2 sm:p-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            renderActiveTab()
          )}
        </div>

        {!loading && activeTabItemCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPageForActiveTab(Math.max(1, activePage - 1))}
              disabled={activePage === 1}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Prev
            </button>

            {visiblePageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setPageForActiveTab(page)}
                className={`px-3 py-1 rounded ${
                  page === activePage
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setPageForActiveTab(Math.min(totalPages, activePage + 1))
              }
              disabled={activePage === totalPages}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <AdminActionModal
        isOpen={!!pendingAction}
        title={actionModalContent.title}
        description={actionModalContent.description}
        confirmLabel={actionModalContent.confirmLabel}
        danger={actionModalContent.danger}
        isSubmitting={isSubmittingAction}
        confirmDisabled={timeoutInputInvalid}
        onClose={closeActionModal}
        onConfirm={() => {
          void executePendingAction();
        }}
      >
        {pendingAction?.type === "set-timeout" ? (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="timeout-minutes"
                className="block text-sm text-gray-300 mb-1"
              >
                Duration (minutes)
              </label>
              <input
                id="timeout-minutes"
                type="number"
                min={1}
                value={timeoutMinutesInput}
                onChange={(event) => setTimeoutMinutesInput(event.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="timeout-reason"
                className="block text-sm text-gray-300 mb-1"
              >
                Reason
              </label>
              <textarea
                id="timeout-reason"
                value={timeoutReasonInput}
                onChange={(event) => setTimeoutReasonInput(event.target.value)}
                maxLength={110}
                rows={3}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {timeoutReasonInput.length}/110
              </p>
            </div>
          </div>
        ) : null}
      </AdminActionModal>

      <ErrorToast error={error} />
    </div>
  );
};

export default AdminPanel;
