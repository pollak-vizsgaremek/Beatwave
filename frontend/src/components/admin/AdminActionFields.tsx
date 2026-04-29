import type { ChangeEvent } from "react";
import type { PendingAdminAction } from "./adminPanelActions";

interface AdminActionFieldsProps {
  pendingAction: PendingAdminAction;
  timeoutMinutesInput: string;
  timeoutReasonInput: string;
  deleteReasonInput: string;
  announcementTitleInput: string;
  announcementTextInput: string;
  maxDeleteReasonLength: number;
  maxAnnouncementTitleLength: number;
  maxAnnouncementTextLength: number;
  onTimeoutMinutesInputChange: (value: string) => void;
  onTimeoutReasonInputChange: (value: string) => void;
  onDeleteReasonInputChange: (value: string) => void;
  onAnnouncementTitleInputChange: (value: string) => void;
  onAnnouncementTextInputChange: (value: string) => void;
}

const readInputValue = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => event.target.value;

const AdminActionFields = ({
  pendingAction,
  timeoutMinutesInput,
  timeoutReasonInput,
  deleteReasonInput,
  announcementTitleInput,
  announcementTextInput,
  maxDeleteReasonLength,
  maxAnnouncementTitleLength,
  maxAnnouncementTextLength,
  onTimeoutMinutesInputChange,
  onTimeoutReasonInputChange,
  onDeleteReasonInputChange,
  onAnnouncementTitleInputChange,
  onAnnouncementTextInputChange,
}: AdminActionFieldsProps) => {
  if (pendingAction?.type === "set-timeout") {
    return (
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
            onChange={(event) =>
              onTimeoutMinutesInputChange(readInputValue(event))
            }
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
            onChange={(event) =>
              onTimeoutReasonInputChange(readInputValue(event))
            }
            maxLength={110}
            rows={3}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {timeoutReasonInput.length}/110
          </p>
        </div>
      </div>
    );
  }

  if (
    pendingAction?.type === "delete-post" ||
    pendingAction?.type === "delete-comment"
  ) {
    return (
      <div>
        <label
          htmlFor="delete-reason"
          className="block text-sm text-gray-300 mb-1"
        >
          Reason for deletion
        </label>
        <textarea
          id="delete-reason"
          value={deleteReasonInput}
          onChange={(event) => onDeleteReasonInputChange(readInputValue(event))}
          maxLength={maxDeleteReasonLength}
          rows={4}
          className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white resize-none"
          placeholder="Explain why this content is being removed."
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {deleteReasonInput.length}/{maxDeleteReasonLength}
        </p>
      </div>
    );
  }

  if (pendingAction?.type === "create-announcement") {
    return (
      <div className="space-y-3">
        <div>
          <label
            htmlFor="announcement-title"
            className="block text-sm text-gray-300 mb-1"
          >
            Title
          </label>
          <input
            id="announcement-title"
            type="text"
            value={announcementTitleInput}
            onChange={(event) =>
              onAnnouncementTitleInputChange(readInputValue(event))
            }
            maxLength={maxAnnouncementTitleLength}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white"
            placeholder="Platform update, maintenance window, community rule change..."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {announcementTitleInput.length}/{maxAnnouncementTitleLength}
          </p>
        </div>
        <div>
          <label
            htmlFor="announcement-text"
            className="block text-sm text-gray-300 mb-1"
          >
            Message
          </label>
          <textarea
            id="announcement-text"
            value={announcementTextInput}
            onChange={(event) =>
              onAnnouncementTextInputChange(readInputValue(event))
            }
            maxLength={maxAnnouncementTextLength}
            rows={6}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-white resize-none"
            placeholder="Write the announcement body that will also appear as a discussion post."
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {announcementTextInput.length}/{maxAnnouncementTextLength}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default AdminActionFields;
