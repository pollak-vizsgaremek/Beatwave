import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import api from "../utils/api";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import TrackPlaylistPicker from "../components/TrackPlaylistPicker";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: { name: string }[];
  release_date: string;
}

interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  album: { images: SpotifyImage[]; name: string };
  artists: { name: string }[];
  duration_ms: number;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: SpotifyImage[];
  owner: { display_name: string };
  tracks: { total: number };
}

interface SpotifyShow {
  id: string;
  name: string;
  images: SpotifyImage[];
  publisher: string;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  duration_ms: number;
}

interface SpotifyAudiobook {
  id: string;
  name: string;
  images: SpotifyImage[];
  authors: { name: string }[];
}

interface SearchResults {
  albums?: { items: SpotifyAlbum[] };
  artists?: { items: SpotifyArtist[] };
  tracks?: { items: SpotifyTrack[] };
  playlists?: { items: SpotifyPlaylist[] };
  shows?: { items: SpotifyShow[] };
  episodes?: { items: SpotifyEpisode[] };
  audiobooks?: { items: SpotifyAudiobook[] };
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const SearchResult = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(true);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [hasMore, setHasMore] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState<Record<string, boolean>>({});
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  // All errors shown as the bottom toast
  const { error, showError } = useErrorToast();

  const DEFAULT_VISIBLE = 5;
  const BATCH_SIZE = 10;

  const getVisible = (key: string) => visibleCounts[key] ?? DEFAULT_VISIBLE;

  const showMore = async (key: string) => {
    const items = (results as any)[key]?.items?.filter(Boolean) || [];
    const currentVisible = getVisible(key);

    // If there are still hidden local items, just reveal them
    if (currentVisible < items.length) {
      setVisibleCounts((prev) => ({
        ...prev,
        [key]: currentVisible + 5,
      }));
      return;
    }

    // Otherwise, fetch more from the backend
    setLoadingMore((prev) => ({ ...prev, [key]: true }));
    try {
      const params = Object.fromEntries(searchParams.entries());
      params.type =
        key === "artists"
          ? "artist"
          : key === "albums"
            ? "album"
            : key === "tracks"
              ? "track"
              : key === "playlists"
                ? "playlist"
                : key === "shows"
                  ? "show"
                  : key === "episodes"
                    ? "episode"
                    : key === "audiobooks"
                      ? "audiobook"
                      : key;
      params.offset = String(items.length);
      params.limit = String(BATCH_SIZE);

      const response = await api.get("/auth/spotify/search", { params });
      const newItems =
        response.data.results?.[key]?.items?.filter(Boolean) || [];

      const existingIds = new Set(items.map((item: any) => item.id));
      const uniqueNewItems = newItems.filter(
        (item: any) => !existingIds.has(item.id),
      );

      if (uniqueNewItems.length > 0) {
        setResults((prev) => ({
          ...prev,
          [key]: {
            ...((prev as any)[key] || {}),
            items: [...items, ...uniqueNewItems],
          },
        }));
        setVisibleCounts((prev) => ({
          ...prev,
          [key]: currentVisible + 5,
        }));
      }

      if (newItems.length < BATCH_SIZE) {
        setHasMore((prev) => ({ ...prev, [key]: false }));
      }
    } catch (err: any) {
      // Show toast instead of silently swallowing
      showError(`Failed to load more ${key}. Please try again.`);
    } finally {
      setLoadingMore((prev) => ({ ...prev, [key]: false }));
    }
  };

  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "";

  useEffect(() => {
    let isMounted = true;

    const fetchResults = async () => {
      if (!query || !type) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setVisibleCounts({});
      setHasMore({});
      setLoadingMore({});
      setExpandedTrackId(null);

      try {
        const response = await api.get("/auth/spotify/search", {
          params: Object.fromEntries(searchParams.entries()),
        });

        if (!isMounted) return;

        if (response.data.error) {
          showError(response.data.error);
        } else {
          const data = response.data.results || {};
          setResults(data);

          const moreState: Record<string, boolean> = {};
          const types = [
            "tracks",
            "artists",
            "albums",
            "playlists",
            "shows",
            "episodes",
            "audiobooks",
          ];
          for (const t of types) {
            const items = data[t]?.items?.filter(Boolean) || [];
            moreState[t] = items.length >= BATCH_SIZE;
          }
          setHasMore(moreState);
        }
      } catch (err: any) {
        if (isMounted) {
          showError(
            err.response?.data?.error || "An error occurred while searching.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [searchParams.toString()]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-xl animate-pulse">Searching...</div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400 text-lg">
          Enter a search query to get started.
        </p>
      </div>
    );
  }

  const hasResults =
    (results.tracks?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.artists?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.albums?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.playlists?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.shows?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.episodes?.items?.filter(Boolean)?.length ?? 0) > 0 ||
    (results.audiobooks?.items?.filter(Boolean)?.length ?? 0) > 0;

  return (
    <div className="w-[95%] xl:w-3/4 mx-auto pb-20">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">
        Search results for "<span className="text-spotify-green">{query}</span>"
      </h1>

      {!hasResults && (
        <p className="text-gray-400 text-lg text-center mt-20">
          No results found. Try a different search or adjust your filters.
        </p>
      )}

      {/* Tracks */}
      {results.tracks && results.tracks.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Tracks
          </h2>
          <div className="flex flex-col gap-2">
            {results.tracks.items
              .filter(Boolean)
              .slice(0, getVisible("tracks"))
              .map((track) => (
                <div
                  key={track.id}
                  className={`rounded-xl border p-3 transition-all ${
                    expandedTrackId === track.id
                      ? "border-spotify-green bg-accent-dark/60 scale-[1.01]"
                      : "border-transparent bg-card hover:bg-accent-dark"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTrackId((prev) =>
                        prev === track.id ? null : track.id,
                      )
                    }
                    className="flex w-full cursor-pointer items-center gap-4 text-left"
                  >
                    <img
                      src={
                        track.album.images?.[0]?.url ||
                        "https://placehold.co/48x48"
                      }
                      alt={track.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {track.name}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {track.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm shrink-0">
                      {formatDuration(track.duration_ms)}
                    </span>
                  </button>

                  {expandedTrackId === track.id && (
                    <TrackPlaylistPicker
                      trackUri={track.uri}
                      trackName={track.name}
                      expanded={expandedTrackId === track.id}
                      onToggle={() => setExpandedTrackId(null)}
                      onError={showError}
                    />
                  )}
                </div>
              ))}
          </div>
          {hasMore["tracks"] && (
            <button
              onClick={() => showMore("tracks")}
              disabled={loadingMore["tracks"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["tracks"] ? "Loading..." : "Show 5 more Tracks"}
            </button>
          )}
        </section>
      )}

      {/* Artists */}
      {results.artists && results.artists.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Artists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.artists.items
              .filter(Boolean)
              .slice(0, getVisible("artists"))
              .map((artist) => (
                <div
                  key={artist.id}
                  className="flex flex-col items-center gap-3 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer"
                >
                  <img
                    src={
                      artist.images?.[0]?.url ||
                      "https://placehold.co/120x120"
                    }
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <p className="text-white font-medium text-center text-sm truncate w-full">
                    {artist.name}
                  </p>
                  {artist.genres && artist.genres.length > 0 && (
                    <p className="text-gray-400 text-xs text-center truncate w-full">
                      {artist.genres.slice(0, 2).join(", ")}
                    </p>
                  )}
                </div>
              ))}
          </div>
          {hasMore["artists"] && (
            <button
              onClick={() => showMore("artists")}
              disabled={loadingMore["artists"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["artists"] ? "Loading..." : "Show 5 more Artists"}
            </button>
          )}
        </section>
      )}

      {/* Albums */}
      {results.albums && results.albums.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.albums.items
              .filter(Boolean)
              .slice(0, getVisible("albums"))
              .map((album) => (
                <div
                  key={album.id}
                  className="flex flex-col gap-2 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer"
                >
                  <img
                    src={
                      album.images?.[0]?.url || "https://placehold.co/160x160"
                    }
                    alt={album.name}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <p className="text-white font-medium text-sm truncate">
                    {album.name}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {album.artists.map((a) => a.name).join(", ")} ·{" "}
                    {album.release_date?.substring(0, 4)}
                  </p>
                </div>
              ))}
          </div>
          {hasMore["albums"] && (
            <button
              onClick={() => showMore("albums")}
              disabled={loadingMore["albums"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["albums"] ? "Loading..." : "Show 5 more Albums"}
            </button>
          )}
        </section>
      )}

      {/* Playlists */}
      {results.playlists && results.playlists.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Playlists
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.playlists.items
              .filter(Boolean)
              .slice(0, getVisible("playlists"))
              .map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex flex-col gap-2 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer"
                >
                  <img
                    src={
                      playlist.images?.[0]?.url ||
                      "https://placehold.co/160x160"
                    }
                    alt={playlist.name}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <p className="text-white font-medium text-sm truncate">
                    {playlist.name}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    by {playlist.owner?.display_name ?? "Unknown"} ·{" "}
                    {playlist.tracks?.total ?? 0} tracks
                  </p>
                </div>
              ))}
          </div>
          {hasMore["playlists"] && (
            <button
              onClick={() => showMore("playlists")}
              disabled={loadingMore["playlists"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["playlists"]
                ? "Loading..."
                : "Show 5 more Playlists"}
            </button>
          )}
        </section>
      )}

      {/* Shows */}
      {results.shows && results.shows.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Shows
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.shows.items
              .filter(Boolean)
              .slice(0, getVisible("shows"))
              .map((show) => (
                <div
                  key={show.id}
                  className="flex flex-col gap-2 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer"
                >
                  <img
                    src={
                      show.images?.[0]?.url || "https://placehold.co/160x160"
                    }
                    alt={show.name}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <p className="text-white font-medium text-sm truncate">
                    {show.name}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {show.publisher}
                  </p>
                </div>
              ))}
          </div>
          {hasMore["shows"] && (
            <button
              onClick={() => showMore("shows")}
              disabled={loadingMore["shows"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["shows"] ? "Loading..." : "Show 5 more Shows"}
            </button>
          )}
        </section>
      )}

      {/* Episodes */}
      {results.episodes && results.episodes.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Episodes
          </h2>
          <div className="flex flex-col gap-2">
            {results.episodes.items
              .filter(Boolean)
              .slice(0, getVisible("episodes"))
              .map((episode) => (
                <div
                  key={episode.id}
                  className="flex items-center gap-4 bg-card hover:bg-accent-dark transition-colors rounded-xl p-3 cursor-pointer"
                >
                  <img
                    src={
                      episode.images?.[0]?.url || "https://placehold.co/48x48"
                    }
                    alt={episode.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {episode.name}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {episode.release_date}
                    </p>
                  </div>
                  <span className="text-gray-500 text-sm shrink-0">
                    {formatDuration(episode.duration_ms)}
                  </span>
                </div>
              ))}
          </div>
          {hasMore["episodes"] && (
            <button
              onClick={() => showMore("episodes")}
              disabled={loadingMore["episodes"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["episodes"] ? "Loading..." : "Show 5 more Episodes"}
            </button>
          )}
        </section>
      )}

      {/* Audiobooks */}
      {results.audiobooks && results.audiobooks.items.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-accent-dark pb-2">
            Audiobooks
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.audiobooks.items
              .filter(Boolean)
              .slice(0, getVisible("audiobooks"))
              .map((book) => (
                <div
                  key={book.id}
                  className="flex flex-col gap-2 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer"
                >
                  <img
                    src={
                      book.images?.[0]?.url || "https://placehold.co/160x160"
                    }
                    alt={book.name}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <p className="text-white font-medium text-sm truncate">
                    {book.name}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {book.authors.map((a) => a.name).join(", ")}
                  </p>
                </div>
              ))}
          </div>
          {hasMore["audiobooks"] && (
            <button
              onClick={() => showMore("audiobooks")}
              disabled={loadingMore["audiobooks"]}
              className="mt-4 mx-auto block px-6 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore["audiobooks"]
                ? "Loading..."
                : "Show 5 more Audiobooks"}
            </button>
          )}
        </section>
      )}

      <ErrorToast error={error} />
    </div>
  );
};

export default SearchResult;
