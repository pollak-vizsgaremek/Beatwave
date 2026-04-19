import Button from "../Button";
import type { NotificationListProps } from "./types";

const NotificationList = ({
  notifications,
  compact = false,
  onSelectNotification,
  onDeleteRead,
}: NotificationListProps) => {
  if (notifications.length === 0) {
    return (
      <div
        className={`text-center text-gray-400 ${compact ? "p-3 text-base" : "p-4 text-sm"}`}
      >
        No new notifications
      </div>
    );
  }

  return (
    <>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onSelectNotification(notification.link)}
          className={`border-b border-accent-dark/50 last:border-0 hover:bg-accent-dark/30 transition-colors cursor-pointer ${
            compact ? "p-3 rounded-lg mb-2" : "p-3"
          } ${!notification.read ? "bg-accent-dark/60" : "opacity-60"}`}
        >
          <p
            className={`${compact ? "text-sm leading-relaxed" : "text-[13px] leading-snug"} ${
              !notification.read ? "text-white" : "text-gray-400"
            }`}
          >
            {notification.message}
          </p>
        </div>
      ))}
      <div className={compact ? "p-3" : "flex justify-center"}>
        <Button
          labelTitle={compact ? "Delete Read" : "Delete Notif"}
          onClick={onDeleteRead}
          className={
            compact
              ? "w-full! text-base! py-3!"
              : "mt-0! p-4! w-full rounded-lg!"
          }
        />
      </div>
    </>
  );
};

export default NotificationList;
