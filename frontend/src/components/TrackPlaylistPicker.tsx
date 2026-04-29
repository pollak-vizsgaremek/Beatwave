import { useEffect, useState, type SyntheticEvent } from "react";
import { Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { PlaylistPickerSkeleton } from "./LoadingSkeletons";
import { spotifyPlaylistController } from "../controllers/spotifyPlaylistController";

type PlaylistItem = {
  id: string;
  name: string;
  ownerName: string;
  image: string | null;
  tracksTotal: number;
  canModify: boolean;
  containsTrack?: boolean;
  trackOccurrences?: number;
  owner?: { display_name?: string };
  images?: { url?: string }[];
  tracks?: { total?: number };
};

type TrackPlaylistPickerProps = {
  trackUri: string;
  trackId?: string | number;
  trackName: string;
  expanded: boolean;
  onToggle: () => void;
  onSuccess?: (message: string) => void;
  onError: (message: string) => void;
};

const TrackPlaylistPicker = ({
  trackUri,
  trackId,
  trackName,
  expanded,
  onToggle,
  onSuccess,
  onError,
}: TrackPlaylistPickerProps) => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingPlaylistId, setRemovingPlaylistId] = useState<string | null>(
    null,
  );
  const playlistController = spotifyPlaylistController;
  const fallbackCoverImage = "/Beatwave_logo.png";

  const handleImageFallback = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.src.endsWith(fallbackCoverImage)) {
      return;
    }

    image.src = fallbackCoverImage;
  };

  useEffect(() => {
    if (!expanded) {
      return;
    }

    let isMounted = true;

    const fetchPlaylists = async () => {
      try {
        setLoadingPlaylists(true);
        const response = await playlistController.getPlaylists(
          trackUri,
          trackId,
        );

        if (!isMounted) {
          return;
        }

        if (response.data.connected === false) {
          onError(
            "Reconnect Spotify to grant playlist access before adding tracks.",
          );
          return;
        }

        setPlaylists(response.data.playlists || []);
      } catch (err: any) {
        if (!isMounted) {
          return;
        }

        onError(
          err.response?.data?.error ||
            "Failed to load your Spotify playlists.",
        );
      } finally {
        if (isMounted) {
          setLoadingPlaylists(false);
        }
      }
    };

    fetchPlaylists();
    return () => {
      isMounted = false;
    };
  }, [
    expanded,
    onError,
    trackUri,
    trackId,
    playlistController,
  ]);

  const togglePlaylist = (playlistId: string) => {
    setSelectedPlaylistIds((prev) =>
      prev.includes(playlistId)
        ? prev.filter((id) => id !== playlistId)
        : [...prev, playlistId],
    );
  };

  const handleAdd = async () => {
    if (selectedPlaylistIds.length === 0) {
      onError("Select at least one playlist first.");
      return;
    }

    try {
      setSaving(true);

      const checkResponse = await playlistController.checkTrackInPlaylists(
        selectedPlaylistIds,
        trackUri,
        trackId,
      );

      const duplicateChecks = (checkResponse.data?.checks || []) as {
        playlistId: string;
        containsTrack: boolean;
      }[];

      const duplicatePlaylists = duplicateChecks.filter((c) => c.containsTrack);
      if (duplicatePlaylists.length > 0) {
        const duplicateNameMap = new Map(
          playlists.map((playlist) => [playlist.id, playlist.name]),
        );
        const duplicateNames = duplicatePlaylists
          .map((item) => duplicateNameMap.get(item.playlistId) || "a playlist")
          .filter(Boolean);

        onError(
          duplicateNames.length === 1
            ? `"${trackName}" is already in ${duplicateNames[0]}.`
            : `"${trackName}" is already in ${duplicateNames.length} selected playlists.`,
        );

        setSaving(false);
        return;
      }

      const response = await playlistController.addTrackToPlaylists(
        selectedPlaylistIds,
        trackUri,
        trackId,
      );

      setPlaylists((prev) =>
        prev.map((playlist) =>
          selectedPlaylistIds.includes(playlist.id)
            ? {
                ...playlist,
                containsTrack: true,
                trackOccurrences: (playlist.trackOccurrences ?? 0) + 1,
                tracksTotal: playlist.tracksTotal + 1,
              }
            : playlist,
        ),
      );

      onSuccess?.(
        `"${trackName}" was added to ${response.data.addedTo} playlist(s).`,
      );
      setSelectedPlaylistIds([]);
      onToggle();
    } catch (err: any) {
      const detailedError =
        err.response?.data?.details?.errors?.[0]?.error_message ||
        err.response?.data?.details?.error_message ||
        err.response?.data?.details?.error ||
        err.response?.data?.details?.message;
      onError(
        detailedError ||
          err.response?.data?.error ||
          "Failed to add the track to Spotify playlists.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (playlistId: string, playlistName: string) => {
    try {
      setRemovingPlaylistId(playlistId);
      await playlistController.removeTrackFromPlaylist(
        playlistId,
        trackUri,
        trackId,
      );

      setPlaylists((prev) =>
        prev.map((playlist) => {
          if (playlist.id !== playlistId) {
            return playlist;
          }

          const removedOccurrences = Math.max(
            1,
            playlist.trackOccurrences ?? 1,
          );

          return {
            ...playlist,
            containsTrack: false,
            trackOccurrences: 0,
            tracksTotal: Math.max(0, playlist.tracksTotal - removedOccurrences),
          };
        }),
      );

      setSelectedPlaylistIds((prev) => prev.filter((id) => id !== playlistId));
      onSuccess?.(`Removed "${trackName}" from ${playlistName}.`);
    } catch (err: any) {
      onError(
        err.response?.data?.error ||
          "Failed to remove the track from the Spotify playlist.",
      );
    } finally {
      setRemovingPlaylistId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Add to playlist</p>
          <p className="text-xs text-gray-400">
            Choose one or more playlists for this track.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="cursor-pointer text-xs text-gray-400 transition-colors hover:text-white"
        >
          Close
        </button>
      </div>

      {loadingPlaylists ? (
        <PlaylistPickerSkeleton />
      ) : playlists.length > 0 ? (
        <>
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
            {playlists.map((playlist) => {
              const selected = selectedPlaylistIds.includes(playlist.id);
              const alreadyAdded = Boolean(playlist.containsTrack);
              const ownerName =
                playlist.ownerName ||
                playlist.owner?.display_name ||
                "Unknown owner";
              const playlistImage =
                playlist.image || playlist.images?.[0]?.url || null;
              const tracksTotal =
                playlist.tracksTotal ?? playlist.tracks?.total ?? 0;

              return (
                <div
                  key={playlist.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    selected
                      ? "border-spotify-green bg-spotify-green/10"
                      : alreadyAdded
                        ? "border-amber-400/40 bg-amber-400/8 hover:border-amber-300/60 hover:bg-amber-400/10"
                        : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!alreadyAdded) {
                        togglePlaylist(playlist.id);
                      }
                    }}
                    disabled={alreadyAdded}
                    className={`flex min-w-0 flex-1 items-center gap-3 text-left ${alreadyAdded ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <img
                      src={playlistImage || fallbackCoverImage}
                      alt={playlist.name}
                      className="h-12 w-12 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                      onError={handleImageFallback}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {playlist.name}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {ownerName}
                        {alreadyAdded
                          ? ` - Already added${(playlist.trackOccurrences ?? 0) > 1 ? ` x${playlist.trackOccurrences}` : ""}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-full border border-white/12 bg-white/6 px-2 py-1 text-[11px] font-medium text-gray-300">
                      {tracksTotal} tracks
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        selected
                          ? "border-spotify-green bg-spotify-green text-black"
                          : "border-white/20 text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </div>
                  </button>

                  {alreadyAdded && (
                    <button
                      type="button"
                      onClick={() => handleRemove(playlist.id, playlist.name)}
                      disabled={removingPlaylistId === playlist.id}
                      className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold text-amber-100 transition-colors hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingPlaylistId === playlist.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-spotify-green px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {saving ? "Adding..." : "Add to selected playlists"}
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-400">
          No editable playlists were found for this Spotify account.
        </p>
      )}
    </motion.div>
  );
};

export default TrackPlaylistPicker;
