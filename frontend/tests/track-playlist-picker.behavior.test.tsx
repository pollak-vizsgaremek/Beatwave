import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const playlistControllerMock = vi.hoisted(() => ({
  getPlaylists: vi.fn(),
  checkTrackInPlaylists: vi.fn(),
  addTrackToPlaylists: vi.fn(),
  removeTrackFromPlaylist: vi.fn(),
}));

vi.mock("../src/controllers/spotifyPlaylistController", () => ({
  spotifyPlaylistController: playlistControllerMock,
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
}));

import TrackPlaylistPicker from "../src/components/TrackPlaylistPicker";

afterEach(() => {
  cleanup();
});

describe("TrackPlaylistPicker behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes trackId through fetch/check/add playlist operations", async () => {
    playlistControllerMock.getPlaylists.mockResolvedValue({
      data: {
        connected: true,
        playlists: [
          {
            id: "playlist-1",
            name: "Playlist One",
            ownerName: "Owner",
            image: null,
            tracksTotal: 5,
            canModify: true,
            containsTrack: false,
          },
        ],
      },
    });
    playlistControllerMock.checkTrackInPlaylists.mockResolvedValue({
      data: { checks: [] },
    });
    playlistControllerMock.addTrackToPlaylists.mockResolvedValue({
      data: { addedTo: 1 },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(
      <TrackPlaylistPicker
        trackUri="spotify:track:track-1"
        trackId="track-1"
        trackName="Track One"
        expanded={true}
        onToggle={() => undefined}
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    await screen.findByText("Playlist One");

    fireEvent.click(screen.getByText("Playlist One"));
    fireEvent.click(screen.getByRole("button", { name: /Add to selected playlists/i }));

    await waitFor(() => {
      expect(playlistControllerMock.checkTrackInPlaylists).toHaveBeenCalledWith(
        ["playlist-1"],
        "spotify:track:track-1",
        "track-1",
      );
    });

    expect(playlistControllerMock.addTrackToPlaylists).toHaveBeenCalledWith(
      ["playlist-1"],
      "spotify:track:track-1",
      "track-1",
    );
    expect(onSuccess).toHaveBeenCalledWith('"Track One" was added to 1 playlist(s).');
    expect(onError).not.toHaveBeenCalled();
  });

  it("passes trackId while removing a track from a playlist", async () => {
    playlistControllerMock.getPlaylists.mockResolvedValue({
      data: {
        connected: true,
        playlists: [
          {
            id: "playlist-2",
            name: "Playlist Two",
            ownerName: "Owner",
            image: null,
            tracksTotal: 9,
            canModify: true,
            containsTrack: true,
            trackOccurrences: 1,
          },
        ],
      },
    });
    playlistControllerMock.removeTrackFromPlaylist.mockResolvedValue({
      data: { ok: true },
    });

    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(
      <TrackPlaylistPicker
        trackUri="spotify:track:track-2"
        trackId="track-2"
        trackName="Track Two"
        expanded={true}
        onToggle={() => undefined}
        onSuccess={onSuccess}
        onError={onError}
      />,
    );

    await screen.findByText("Playlist Two");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(playlistControllerMock.removeTrackFromPlaylist).toHaveBeenCalledWith(
        "playlist-2",
        "spotify:track:track-2",
        "track-2",
      );
    });

    expect(onSuccess).toHaveBeenCalledWith(
      'Removed "Track Two" from Playlist Two.',
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
