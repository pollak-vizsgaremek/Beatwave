import { useEffect, useState } from "react";
import AdminTabs from "../components/admin/AdminTabs";
import CommentsManagement from "../components/admin/CommentsManagement";
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
import api from "../utils/api";

const getInitialTab = (): AdminTabId => {
  const requestedTab = new URLSearchParams(window.location.search).get("tab");

  if (requestedTab && VALID_ADMIN_TABS.includes(requestedTab as AdminTabId)) {
    return requestedTab as AdminTabId;
  }

  return "users";
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTabId>(getInitialTab);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingReportId, setProcessingReportId] = useState<string | null>(
    null,
  );
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

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
    try {
      const res = await api.get("/user-profile");
      setCurrentUserRole(res.data.role);
      setCurrentUserId(res.data.id);

      if (res.data.role === "ADMIN" || res.data.role === "MODERATOR") {
        setHasModerationAccess(true);
        return;
      }

      window.location.href = "/home";
    } catch {
      window.location.href = "/login";
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await api.delete(`/admin/comments/${id}`);
      setComments((prev) => prev.filter((comment) => comment.id !== id));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleReportAction = async (
    reportId: string,
    action: "dismiss" | "block-user",
  ) => {
    setProcessingReportId(reportId);

    try {
      await api.patch(`/admin/reports/${reportId}/${action}`);
      await fetchData("logs");
    } catch (error) {
      console.error("Error handling report:", error);
      window.alert("Failed to handle the report. Please try again.");
    } finally {
      setProcessingReportId(null);
    }
  };

  const handleUserRoleChange = async (userId: string, role: string) => {
    setProcessingUserId(userId);

    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? res.data.user : user)),
      );
    } catch (error) {
      console.error("Error updating user role:", error);
      window.alert("Failed to update the user role. Please try again.");
      await fetchData("users");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleUserBlockToggle = async (userId: string, isBlocked: boolean) => {
    setProcessingUserId(userId);

    try {
      const res = await api.patch(`/admin/users/${userId}/block`, {
        isBlocked,
      });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? res.data.user : user)),
      );
    } catch (error) {
      console.error("Error updating user block status:", error);
      window.alert("Failed to update the user status. Please try again.");
      await fetchData("users");
    } finally {
      setProcessingUserId(null);
    }
  };

  const canManageUsers = currentUserRole === "ADMIN";

  const renderActiveTab = () => {
    switch (activeTab) {
      case "users":
        return (
          <UsersManagement
            users={users}
            canManageUsers={canManageUsers}
            processingUserId={processingUserId}
            currentUserId={currentUserId}
            onRoleChange={handleUserRoleChange}
            onToggleBlock={handleUserBlockToggle}
          />
        );
      case "posts":
        return (
          <PostsManagement posts={posts} onDeletePost={handleDeletePost} />
        );
      case "comments":
        return (
          <CommentsManagement
            comments={comments}
            onDeleteComment={handleDeleteComment}
          />
        );
      case "logs":
        return (
          <ReportsManagement
            logs={logs}
            processingReportId={processingReportId}
            onReportAction={handleReportAction}
          />
        );
      default:
        return null;
    }
  };

  if (!hasModerationAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking permissions...
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
      </div>
    </div>
  );
};

export default AdminPanel;
