import { useState, useEffect } from "react";
import { Users, FileText, MessageSquare, Shield, Trash2 } from "lucide-react";
import api from "../utils/api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  postedAt: string;
  user: {
    id: string;
    username: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
  post: {
    id: string;
    title: string;
  };
}

interface Log {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  moderator: {
    username: string;
  };
  user: {
    username: string;
  };
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [activeTab, isAdmin]);

  const checkAdmin = async () => {
    try {
      const res = await api.get("/user-profile");
      if (res.data.role === "ADMIN") {
        setIsAdmin(true);
      } else {
        window.location.href = "/home";
      }
    } catch (error) {
      window.location.href = "/login";
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const res = await api.get("/admin/users");
        setUsers(res.data);
      } else if (activeTab === "posts") {
        const res = await api.get("/admin/posts");
        setPosts(res.data);
      } else if (activeTab === "comments") {
        const res = await api.get("/admin/comments");
        setComments(res.data);
      } else if (activeTab === "logs") {
        const res = await api.get("/admin/logs");
        setLogs(res.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await api.delete(`/admin/posts/${id}`);
        setPosts(posts.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await api.delete(`/admin/comments/${id}`);
        setComments(comments.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Checking permissions...
      </div>
    );
  }

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "comments", label: "Comments", icon: MessageSquare },
    { id: "logs", label: "Logs", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
          Admin Panel
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-2 sm:p-4">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {activeTab === "users" && (
                <>
                  {/* Mobile card view */}
                  <div className="block sm:hidden space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white">
                            {user.username}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              user.role === "ADMIN"
                                ? "bg-red-600"
                                : user.role === "MODERATOR"
                                  ? "bg-yellow-600"
                                  : "bg-blue-600"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-1">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table view */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left p-2">Username</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b border-gray-700"
                          >
                            <td className="p-2">{user.username}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">{user.role}</td>
                            <td className="p-2">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === "posts" && (
                <div className="space-y-3 sm:space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-gray-700 p-3 sm:p-4 rounded-lg relative"
                    >
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto bg-red-600 hover:bg-red-700 p-2 rounded text-white sm:self-center flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="pr-12 sm:pr-0">
                        <h3 className="font-semibold text-sm sm:text-base">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                          {post.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          By {post.user.username} •{" "}
                          {new Date(post.postedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "comments" && (
                <div className="space-y-3 sm:space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-700 p-3 sm:p-4 rounded-lg relative"
                    >
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="absolute top-3 right-3 sm:relative sm:top-auto sm:right-auto bg-red-600 hover:bg-red-700 p-2 rounded text-white sm:self-center flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="pr-12 sm:pr-0">
                        <p className="text-sm text-gray-300">
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          By {comment.user.username} on "{comment.post.title}" •{" "}
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-3 sm:space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-gray-700 p-3 sm:p-4 rounded-lg"
                    >
                      <p className="font-semibold text-sm sm:text-base">
                        {log.action}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        {log.details}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        By {log.moderator.username} on {log.user.username} •{" "}
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
