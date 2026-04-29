import type { AdminUser } from "./types";

export type PendingAdminAction =
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
  | {
      type: "toggle-block";
      userId: string;
      username: string;
      nextBlocked: boolean;
    }
  | { type: "set-timeout"; user: AdminUser }
  | { type: "clear-timeout"; user: AdminUser }
  | { type: "set-ip-ban"; user: AdminUser }
  | { type: "clear-ip-ban"; user: AdminUser }
  | { type: "delete-user"; user: AdminUser }
  | { type: "create-announcement" }
  | null;

export interface ActionModalContent {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
}

export const getActionModalContent = (
  pendingAction: PendingAdminAction,
): ActionModalContent => {
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
        description:
          "This post will be permanently removed. A reason is required and the user will be notified.",
        confirmLabel: "Delete post",
        danger: true,
      };
    case "delete-comment":
      return {
        title: "Delete Comment",
        description:
          "This comment will be permanently removed. A reason is required and the user will be notified.",
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
    case "set-ip-ban":
      return {
        title: "Set IP Ban",
        description: pendingAction.user.lastKnownIp
          ? `Ban the last known IP for @${pendingAction.user.username} (${pendingAction.user.lastKnownIp}). Leave duration blank for a permanent ban.`
          : `No known IP address is available for @${pendingAction.user.username}.`,
        confirmLabel: "Set IP ban",
        danger: true,
      };
    case "clear-ip-ban":
      return {
        title: "Clear IP Ban",
        description: `Remove the active IP ban for @${pendingAction.user.username}?`,
        confirmLabel: "Clear IP ban",
        danger: false,
      };
    case "delete-user":
      return {
        title: "Delete User",
        description: `Permanently delete @${pendingAction.user.username} and all related data? This cannot be undone.`,
        confirmLabel: "Delete user",
        danger: true,
      };
    case "create-announcement":
      return {
        title: "Create Announcement",
        description:
          "Publish an announcement post and send a notification to every user.",
        confirmLabel: "Publish announcement",
        danger: false,
      };
  }
};
