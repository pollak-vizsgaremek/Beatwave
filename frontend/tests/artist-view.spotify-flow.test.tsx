import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

const pickerState = vi.hoisted(() => ({
  lastProps: null as null | Record<string, unknown>,
}));

vi.mock("../src/utils/api", () => ({
  default: apiMock,
}));

vi.mock("../src/components/TrackPlaylistPicker", () => ({
  default: (props: Record<string, unknown>) => {
    pickerState.lastProps = props;
    return <div data-testid="artist-track-playlist-picker">Track picker</div>;
  },
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

import ArtistView from "../src/pages/ArtistView";

const renderArtistView = (initialEntry = "/artist/artist-1") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ArtistView />} path="/artist/:id" />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe("ArtistView Spotify flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickerState.lastProps = null;

    apiMock.get.mockImplementation((url: string) => {
      if (url === "/auth/spotify/artist/artist-1") {
        return Promise.resolve({
          data: {
            connected: true,
            artist: {
              id: "artist-1",
              name: "Primary Artist",
              images: [],
              external_urls: { spotify: "https://open.spotify.com/artist/artist-1" },
            },
            topTracks: [
              {
                id: "track-1",
                uri: "spotify:track:track-1",
                name: "Top Track",
                duration_ms: 61000,
                album: { name: "Album One", images: [] },
                artists: [{ name: "Primary Artist" }],
              },
            ],
            relatedArtists: [
              { id: "artist-2", name: "Second Artist", images: [] },
            ],
            albums: [],
          },
        });
      }

      if (url === "/auth/spotify/artist/artist-2") {
        return Promise.resolve({
          data: {
            connected: true,
            artist: {
              id: "artist-2",
              name: "Second Artist",
              images: [],
              external_urls: { spotify: "https://open.spotify.com/artist/artist-2" },
            },
            topTracks: [],
            relatedArtists: [],
            albums: [],
          },
        });
      }

      return Promise.resolve({ data: { connected: true, artist: null } });
    });
  });

  it("passes trackId to TrackPlaylistPicker when expanding a top track", async () => {
    renderArtistView();

    await screen.findByText("Primary Artist");
    const trackButton = screen.getByText("Top Track").closest("button");
    expect(trackButton).toBeTruthy();
    fireEvent.click(trackButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("artist-track-playlist-picker")).toBeTruthy();
    });

    expect(pickerState.lastProps).toEqual(
      expect.objectContaining({
        trackId: "track-1",
        trackUri: "spotify:track:track-1",
      }),
    );
  });

  it("navigates related artists without provider query params", async () => {
    renderArtistView();

    await screen.findByText("Primary Artist");
    fireEvent.click(screen.getByRole("button", { name: /Second Artist/i }));

    await screen.findAllByText("Second Artist");
    expect(apiMock.get).toHaveBeenCalledWith("/auth/spotify/artist/artist-2");
    expect(apiMock.get).not.toHaveBeenCalledWith(
      expect.stringContaining("?provider="),
    );
  });
});
