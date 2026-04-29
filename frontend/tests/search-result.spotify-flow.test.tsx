import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
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
    return <div data-testid="track-playlist-picker">Track picker</div>;
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

import SearchResult from "../src/pages/SearchResult";

const ArtistRouteSpy = () => {
  const location = useLocation();
  return (
    <div data-testid="artist-location">
      {location.pathname}
      {location.search}
    </div>
  );
};

const renderSearchResult = (initialEntry = "/search?q=beat&type=track,artist") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<SearchResult />} path="/search" />
        <Route element={<ArtistRouteSpy />} path="/artist/:id" />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
});

describe("SearchResult Spotify flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickerState.lastProps = null;

    apiMock.get.mockResolvedValue({
      data: {
        connected: true,
        results: {
          tracks: {
            items: [
              {
                id: "track-1",
                uri: "spotify:track:track-1",
                name: "Track One",
                duration_ms: 60000,
                album: {
                  name: "Album One",
                  images: [],
                },
                artists: [{ name: "Artist One" }],
              },
            ],
          },
          artists: {
            items: [
              {
                id: "artist-1",
                name: "Artist One",
                images: [],
                genres: [],
              },
            ],
          },
        },
      },
    });
  });

  it("passes trackId to TrackPlaylistPicker when expanding a track", async () => {
    renderSearchResult();

    await screen.findByText("Track One");
    const trackButton = screen.getByText("Track One").closest("button");
    expect(trackButton).toBeTruthy();
    fireEvent.click(trackButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByTestId("track-playlist-picker")).toBeTruthy();
    });

    expect(pickerState.lastProps).toEqual(
      expect.objectContaining({
        trackId: "track-1",
        trackUri: "spotify:track:track-1",
      }),
    );
  });

  it("navigates to artist route without provider query params", async () => {
    renderSearchResult();

    const artistAvatar = await screen.findByAltText("Artist One");
    const artistCardButton = artistAvatar.closest("button");
    expect(artistCardButton).toBeTruthy();
    fireEvent.click(artistCardButton as HTMLButtonElement);

    const locationNode = await screen.findByTestId("artist-location");
    expect(locationNode.textContent).toBe("/artist/artist-1");
    expect(locationNode.textContent).not.toContain("provider=");
  });
});
