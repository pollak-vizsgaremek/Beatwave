import { getStatusClasses, type AdminLog } from "./types";

interface LogsManagementProps {
  logs: AdminLog[];
}

const formatLogDetails = (log: AdminLog) => {
  if (log.action === "TIMEOUT_USER") {
    const prefix = "TIMEOUT_META_V2|";
    if (log.details.startsWith(prefix)) {
      const payload = log.details.slice(prefix.length);
      const separatorIndex = payload.indexOf("|");
      if (separatorIndex !== -1) {
        const untilRaw = payload.slice(0, separatorIndex);
        const reason = payload.slice(separatorIndex + 1).trim();
        const until = new Date(untilRaw);
        const untilText = Number.isNaN(until.getTime())
          ? untilRaw
          : until.toLocaleString();
        return `Timed out until ${untilText}. Reason: ${reason}`;
      }
    }
  }

  if (log.action === "CLEAR_USER_TIMEOUT" && log.details.startsWith("TIMEOUT_CLEARED|")) {
    const untilRaw = log.details.slice("TIMEOUT_CLEARED|".length);
    const until = new Date(untilRaw);
    const untilText = Number.isNaN(until.getTime())
      ? untilRaw
      : until.toLocaleString();
    return `Cleared active timeout (was ending at ${untilText}).`;
  }

  if (log.action === "TIMEOUT_USER" && log.details.includes("\n")) {
    return log.details
      .split("\n")
      .filter((line) => !line.startsWith("TIMEOUT_META="))
      .join(" ");
  }

  return log.details;
};

const getStatusTag = (log: AdminLog) => {
  if (log.action === "UPDATE_USER_ROLE") {
    return "ROLE_CHANGED";
  }
  return log.status;
};

const LogsManagement = ({ logs }: LogsManagementProps) => {
  if (logs.length === 0) {
    return <div className="text-center py-8 text-gray-300">No logs found.</div>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-gray-700 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm sm:text-base">{log.action}</p>
            {(() => {
              const statusTag = getStatusTag(log);
              return (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(statusTag)}`}
                >
                  {statusTag}
                </span>
              );
            })()}
          </div>

          <p className="text-sm text-gray-300 mt-2">{formatLogDetails(log)}</p>
          <p className="text-xs text-gray-400 mt-2">
            By {log.moderator.username} on {log.user.username} •{" "}
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default LogsManagement;
