import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import NotificationList from "../src/components/navigation/NotificationList";
import type { NotificationType } from "../src/utils/Type";

afterEach(() => {
  cleanup();
});

const makeNotification = (
  id: string,
  message: string,
  read: boolean,
  link: string | null = null,
): NotificationType => ({
  id,
  type: "test",
  message,
  link,
  read,
  createdAt: new Date(),
  userId: "user-1",
  triggeredById: null,
});

describe("NotificationList", () => {
  it("shows empty state without delete action", () => {
    render(
      <NotificationList
        notifications={[]}
        onSelectNotification={() => undefined}
        onDeleteRead={() => undefined}
      />,
    );

    expect(screen.getByText("No new notifications")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("shows delete button only when read notifications exist", () => {
    render(
      <NotificationList
        notifications={[makeNotification("1", "Unread notification", false)]}
        onSelectNotification={() => undefined}
        onDeleteRead={() => undefined}
      />,
    );

    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("supports selecting notification and deleting read notifications", () => {
    const onSelectNotification = vi.fn();
    const onDeleteRead = vi.fn();

    render(
      <NotificationList
        notifications={[
          makeNotification("1", "Unread notification", false, "/discussion"),
          makeNotification("2", "Read notification", true, "/profile"),
        ]}
        onSelectNotification={onSelectNotification}
        onDeleteRead={onDeleteRead}
      />,
    );

    fireEvent.click(screen.getByText("Read notification"));
    fireEvent.click(screen.getByRole("button", { name: "Delete Notif" }));

    expect(onSelectNotification).toHaveBeenCalledWith("/profile");
    expect(onDeleteRead).toHaveBeenCalledTimes(1);
  });
});
