import {
  FileText,
  MessageSquare,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface AdminPost {
  id: string;
  title: string;
  text: string;
  postedAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface AdminComment {
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

export interface AdminLog {
  id: string;
  action: string;
  status: string;
  details: string;
  createdAt: string;
  moderator: {
    username: string;
  };
  user: {
    id: string;
    username: string;
    isBlocked?: boolean;
  };
}

export const VALID_ADMIN_TABS = ["users", "posts", "comments", "logs"] as const;

export type AdminTabId = (typeof VALID_ADMIN_TABS)[number];

export interface AdminTab {
  id: AdminTabId;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_TABS: AdminTab[] = [
  { id: "users", label: "Users", icon: Users },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "logs", label: "Reports", icon: Shield },
];

export const getStatusClasses = (status: string) => {
  switch (status) {
    case "REPORTED":
      return "bg-amber-600 text-white";
    case "DISMISSED":
      return "bg-slate-600 text-white";
    case "BLOCKED":
      return "bg-red-700 text-white";
    case "DELETED":
      return "bg-rose-700 text-white";
    default:
      return "bg-blue-600 text-white";
  }
};
