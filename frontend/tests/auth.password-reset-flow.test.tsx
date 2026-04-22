import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import React from "react";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("../src/utils/api", () => ({
  default: apiMock,
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tagName: string) => {
        const MotionComponent = ({ children, ...props }: any) => {
          const passthroughProps = { ...props };
          delete passthroughProps.initial;
          delete passthroughProps.animate;
          delete passthroughProps.exit;
          delete passthroughProps.transition;
          delete passthroughProps.whileHover;
          delete passthroughProps.whileTap;
          delete passthroughProps.variants;
          delete passthroughProps.custom;

          return React.createElement(tagName, passthroughProps, children);
        };

        return MotionComponent;
      },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import Login from "../src/pages/Login";
import ResetPassword from "../src/pages/ResetPassword";
import { SessionProvider } from "../src/context/SessionContext";

const renderLoginPage = (initialEntry = "/login") =>
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Login />} path="/login" />
          <Route element={<div>Home Page</div>} path="/home" />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );

const renderResetPage = (initialEntry = "/reset-password") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ResetPassword />} path="/reset-password" />
        <Route element={<div>Login Page</div>} path="/login" />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe("password reset frontend flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/auth/session") {
        return Promise.resolve({ data: { authenticated: false } });
      }

      if (url === "/auth/password-reset/validate") {
        return Promise.resolve({ data: { valid: false } });
      }

      return Promise.resolve({ data: {} });
    });
    apiMock.post.mockResolvedValue({ data: {} });
  });

  it("opens forgot-password modal and submits reset email request", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "alice@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        "/auth/password-reset/request",
        { email: "alice@example.com" },
        {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        },
      );
    });

    expect(
      screen.getByText(/If an account exists for that email/i),
    ).toBeTruthy();
  });

  it("shows invalid state when reset token is missing", async () => {
    renderResetPage("/reset-password");

    expect(
      await screen.findByText("This reset link is invalid or expired."),
    ).toBeTruthy();
  });

  it("validates token and redirects to login after successful reset", async () => {
    apiMock.get.mockImplementation((url: string) => {
      if (url === "/auth/password-reset/validate") {
        return Promise.resolve({ data: { valid: true } });
      }

      if (url === "/auth/session") {
        return Promise.resolve({ data: { authenticated: false } });
      }

      return Promise.resolve({ data: {} });
    });
    apiMock.post.mockResolvedValueOnce({
      data: { message: "Password reset successful" },
    });

    const { container } = renderResetPage("/reset-password?token=valid-token");

    await waitFor(() => {
      expect(screen.getByText("Reset Password")).toBeTruthy();
    });

    const initialPasswordInput = container.querySelector(
      'input[name="password"]',
    ) as HTMLInputElement;
    expect(initialPasswordInput).toBeTruthy();
    fireEvent.change(initialPasswordInput, { target: { value: "Password1!" } });

    const confirmPasswordInput = container.querySelector(
      'input[name="confirmPassword"]',
    ) as HTMLInputElement;
    expect(confirmPasswordInput).toBeTruthy();
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Password1!" },
    });

    await waitFor(() => {
      expect(
        (
          container.querySelector('input[name="password"]') as HTMLInputElement
        ).value,
      ).toBe("Password1!");
      expect(
        (
          container.querySelector(
            'input[name="confirmPassword"]',
          ) as HTMLInputElement
        ).value,
      ).toBe("Password1!");
    });

    const form = container.querySelector("form") as HTMLFormElement;
    expect(form).toBeTruthy();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith(
        "/auth/password-reset/confirm",
        {
          token: "valid-token",
          password: "Password1!",
        },
        {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        },
      );
    });

    expect(await screen.findByText("Login Page")).toBeTruthy();
  });
});
