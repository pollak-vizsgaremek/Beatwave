import type { AdminUser } from "./types";

interface UsersManagementProps {
  users: AdminUser[];
  canManageUsers: boolean;
  processingUserId: string | null;
  currentUserId: string | null;
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onToggleBlock: (userId: string, isBlocked: boolean) => Promise<void>;
  onSetTimeout: (user: AdminUser) => Promise<void>;
  onClearTimeout: (user: AdminUser) => Promise<void>;
  onSetIpBan: (user: AdminUser) => Promise<void>;
  onClearIpBan: (user: AdminUser) => Promise<void>;
  onDeleteUser: (user: AdminUser) => Promise<void>;
}

const getRoleBadgeClasses = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-600";
    case "MODERATOR":
      return "bg-yellow-600";
    default:
      return "bg-blue-600";
  }
};

const UsersManagement = ({
  users,
  canManageUsers,
  processingUserId,
  currentUserId,
  onRoleChange,
  onToggleBlock,
  onSetTimeout,
  onClearTimeout,
  onSetIpBan,
  onClearIpBan,
  onDeleteUser,
}: UsersManagementProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">No users found.</div>
    );
  }

  return (
    <>
      <div className="block sm:hidden space-y-3">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const isProcessing = processingUserId === user.id;
          const hasTimeout =
            !!user.timeoutUntil &&
            new Date(user.timeoutUntil).getTime() > Date.now();
          const hasActiveIpBan = !!user.activeIpBanId;

          return (
            <div key={user.id} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold text-white">{user.username}</h3>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getRoleBadgeClasses(user.role)}`}
                  >
                    {user.role}
                  </span>
                  {user.isBlocked && (
                    <span className="text-xs px-2 py-1 rounded bg-rose-700 text-white">
                      BLOCKED
                    </span>
                  )}
                  {hasTimeout && (
                    <span className="text-xs px-2 py-1 rounded bg-amber-700 text-white">
                      TIMEOUT
                    </span>
                  )}
                  {hasActiveIpBan && (
                    <span className="text-xs px-2 py-1 rounded bg-fuchsia-700 text-white">
                      IP BANNED
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-1">{user.email}</p>
              <p className="text-xs text-gray-400">
                Created {new Date(user.createdAt).toLocaleDateString()}
              </p>
              {canManageUsers && user.lastKnownIp && (
                <p className="text-xs text-gray-400 mt-1">
                  Last known IP: {user.lastKnownIp}
                </p>
              )}
              {hasTimeout && (
                <p className="text-xs text-amber-200 mt-1">
                  Until {new Date(user.timeoutUntil as string).toLocaleString()}
                  {user.timeoutReason ? ` • ${user.timeoutReason}` : ""}
                </p>
              )}
              {canManageUsers && hasActiveIpBan && (
                <p className="text-xs text-fuchsia-200 mt-1">
                  {user.activeIpBanUntil
                    ? `IP banned until ${new Date(user.activeIpBanUntil).toLocaleString()}`
                    : "IP permanently banned"}
                  {user.activeIpBanReason ? ` • ${user.activeIpBanReason}` : ""}
                </p>
              )}

              {canManageUsers && (
                <div className="mt-3 space-y-2">
                  <select
                    value={user.role}
                    disabled={isProcessing || isCurrentUser}
                    onChange={(event) =>
                      void onRoleChange(user.id, event.target.value)
                    }
                    className="w-full rounded bg-gray-800 border border-gray-600 px-2 py-2 text-sm"
                  >
                    <option value="USER">User</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void onToggleBlock(user.id, !user.isBlocked)}
                    disabled={isProcessing || isCurrentUser}
                    className={`w-full rounded px-3 py-2 text-sm font-medium ${
                      user.isBlocked
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-red-700 hover:bg-red-600"
                    } disabled:opacity-50`}
                  >
                    {isCurrentUser
                      ? "Current account"
                      : user.isBlocked
                        ? "Unblock user"
                        : "Block user"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSetTimeout(user)}
                    disabled={isProcessing || isCurrentUser}
                    className="w-full rounded px-3 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                  >
                    {isCurrentUser ? "Current account" : "Set timeout"}
                  </button>
                  {hasTimeout && (
                    <button
                      type="button"
                      onClick={() => void onClearTimeout(user)}
                      disabled={isProcessing || isCurrentUser}
                      className="w-full rounded px-3 py-2 text-sm font-medium bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Clear timeout
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void onSetIpBan(user)}
                    disabled={
                      isProcessing || isCurrentUser || !user.lastKnownIp
                    }
                    className="w-full rounded px-3 py-2 text-sm font-medium bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-50"
                  >
                    {!user.lastKnownIp
                      ? "No known IP"
                      : isCurrentUser
                        ? "Current account"
                        : "Set IP ban"}
                  </button>
                  {hasActiveIpBan && (
                    <button
                      type="button"
                      onClick={() => void onClearIpBan(user)}
                      disabled={isProcessing || isCurrentUser}
                      className="w-full rounded px-3 py-2 text-sm font-medium bg-sky-700 hover:bg-sky-600 disabled:opacity-50"
                    >
                      Clear IP ban
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void onDeleteUser(user)}
                    disabled={isProcessing || isCurrentUser}
                    className="w-full rounded px-3 py-2 text-sm font-medium bg-rose-800 hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isCurrentUser ? "Current account" : "Delete user"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2">Username</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Created</th>
              {canManageUsers && <th className="text-left p-2">Manage</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isProcessing = processingUserId === user.id;
              const hasTimeout =
                !!user.timeoutUntil &&
                new Date(user.timeoutUntil).getTime() > Date.now();
              const hasActiveIpBan = !!user.activeIpBanId;

              return (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="p-2">{user.username}</td>
                  <td className="p-2">
                    <div>{user.email}</div>
                    {canManageUsers && user.lastKnownIp && (
                      <div className="text-xs text-gray-400 mt-1">
                        IP: {user.lastKnownIp}
                      </div>
                    )}
                  </td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">
                    {user.isBlocked
                      ? "Blocked"
                      : hasActiveIpBan
                        ? "IP banned"
                        : hasTimeout
                          ? "Timed out"
                          : "Active"}
                    {hasTimeout && (
                      <p className="text-xs text-amber-200 mt-1">
                        Until{" "}
                        {new Date(user.timeoutUntil as string).toLocaleString()}
                      </p>
                    )}
                    {hasActiveIpBan && (
                      <p className="text-xs text-fuchsia-200 mt-1">
                        {user.activeIpBanUntil
                          ? `Until ${new Date(user.activeIpBanUntil).toLocaleString()}`
                          : "Permanent"}
                      </p>
                    )}
                  </td>
                  <td className="p-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  {canManageUsers && (
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={user.role}
                          disabled={isProcessing || isCurrentUser}
                          onChange={(event) =>
                            void onRoleChange(user.id, event.target.value)
                          }
                          className="rounded bg-gray-800 border border-gray-600 px-2 py-1"
                        >
                          <option value="USER">User</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            void onToggleBlock(user.id, !user.isBlocked)
                          }
                          disabled={isProcessing || isCurrentUser}
                          className={`rounded px-3 py-1 text-white ${
                            user.isBlocked
                              ? "bg-emerald-600 hover:bg-emerald-500"
                              : "bg-red-700 hover:bg-red-600"
                          } disabled:opacity-50`}
                        >
                          {isCurrentUser
                            ? "Current account"
                            : user.isBlocked
                              ? "Unblock"
                              : "Block"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onSetTimeout(user)}
                          disabled={isProcessing || isCurrentUser}
                          className="rounded px-3 py-1 text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
                        >
                          Timeout
                        </button>
                        {hasTimeout && (
                          <button
                            type="button"
                            onClick={() => void onClearTimeout(user)}
                            disabled={isProcessing || isCurrentUser}
                            className="rounded px-3 py-1 text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50"
                          >
                            Clear timeout
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void onSetIpBan(user)}
                          disabled={
                            isProcessing || isCurrentUser || !user.lastKnownIp
                          }
                          className="rounded px-3 py-1 text-white bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-50"
                        >
                          {!user.lastKnownIp ? "No IP" : "IP ban"}
                        </button>
                        {hasActiveIpBan && (
                          <button
                            type="button"
                            onClick={() => void onClearIpBan(user)}
                            disabled={isProcessing || isCurrentUser}
                            className="rounded px-3 py-1 text-white bg-sky-700 hover:bg-sky-600 disabled:opacity-50"
                          >
                            Clear IP ban
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void onDeleteUser(user)}
                          disabled={isProcessing || isCurrentUser}
                          className="rounded px-3 py-1 text-white bg-rose-800 hover:bg-rose-700 disabled:opacity-50"
                        >
                          Delete user
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UsersManagement;
