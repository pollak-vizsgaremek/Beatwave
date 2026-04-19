import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { spotifyPlaylistController } from "../controllers/spotifyPlaylistController";

type PlaylistItem = {
  id: string;
  name: string;
  ownerName: string;
  image: string | null;
  tracksTotal: number;
  canModify: boolean;
  owner?: { display_name?: string };
  images?: { url?: string }[];
  tracks?: { total?: number };
};

type TrackPlaylistPickerProps = {
  trackUri: string;
  trackName: string;
  expanded: boolean;
  onToggle: () => void;
  onSuccess?: (message: string) => void;
  onError: (message: string) => void;
};

const TrackPlaylistPicker = ({
  trackUri,
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

  useEffect(() => {
    if (!expanded) {
      return;
    }

    let isMounted = true;

    const fetchPlaylists = async () => {
      try {
        setLoadingPlaylists(true);
        const response = await spotifyPlaylistController.getPlaylists();

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
          err.response?.data?.error || "Failed to load your Spotify playlists.",
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
  }, [expanded, onError]);

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
      const response = await spotifyPlaylistController.addTrackToPlaylists(
        selectedPlaylistIds,
        trackUri,
      );

      onSuccess?.(
        `"${trackName}" was added to ${response.data.addedTo} playlist(s).`,
      );
      setSelectedPlaylistIds([]);
      onToggle();
    } catch (err: any) {
      onError(
        err.response?.data?.error || "Failed to add the track to playlists.",
      );
    } finally {
      setSaving(false);
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
        <p className="text-sm text-gray-400">Loading your playlists...</p>
      ) : playlists.length > 0 ? (
        <>
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
            {playlists.map((playlist) => {
              const selected = selectedPlaylistIds.includes(playlist.id);
              const ownerName =
                playlist.ownerName ||
                playlist.owner?.display_name ||
                "Unknown owner";
              const playlistImage =
                playlist.image || playlist.images?.[0]?.url || null;
              const tracksTotal =
                playlist.tracksTotal ?? playlist.tracks?.total ?? 0;

              return (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => togglePlaylist(playlist.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    selected
                      ? "border-spotify-green bg-spotify-green/10"
                      : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
                  }`}
                >
                  <img
                    src={playlistImage || "https://placehold.co/56x56"}
                    alt={playlist.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {playlist.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {ownerName}
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
