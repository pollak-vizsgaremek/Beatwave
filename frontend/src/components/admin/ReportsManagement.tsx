import { Ban, CheckCircle2 } from "lucide-react";
import { getStatusClasses, type AdminLog } from "./types";

interface ReportsManagementProps {
  reports: AdminLog[];
  processingReportId: string | null;
  onRequestReportAction: (
    reportId: string,
    action: "dismiss" | "block-user",
  ) => Promise<void>;
}

const ReportsManagement = ({
  reports,
  processingReportId,
  onRequestReportAction,
}: ReportsManagementProps) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300">No reports found.</div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {reports.map((log) => (
        <div key={log.id} className="bg-gray-700 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm sm:text-base">{log.action}</p>
            <span
              className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(log.status)}`}
            >
              {log.status}
            </span>
          </div>

          <p className="text-sm text-gray-300 mt-2">{log.details}</p>
          <p className="text-xs text-gray-400 mt-2">
            By {log.moderator.username} on {log.user.username} •{" "}
            {new Date(log.createdAt).toLocaleDateString()}
          </p>

          {log.status === "REPORTED" && log.action.startsWith("REPORT_") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onRequestReportAction(log.id, "dismiss")}
                disabled={processingReportId === log.id}
                className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 px-3 py-2 rounded text-sm"
              >
                <CheckCircle2 size={14} />
                Dismiss report
              </button>
              <button
                type="button"
                onClick={() => void onRequestReportAction(log.id, "block-user")}
                disabled={processingReportId === log.id}
                className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 px-3 py-2 rounded text-sm"
              >
                <Ban size={14} />
                Block user
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReportsManagement;
