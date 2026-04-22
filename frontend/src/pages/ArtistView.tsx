import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import api from "../utils/api";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import TrackPlaylistPicker from "../components/TrackPlaylistPicker";

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface Artist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  external_urls?: { spotify: string };
}

interface Track {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  album: { name: string; images: SpotifyImage[] };
  artists: { name: string }[];
}

interface Album {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  album_type: string;
  external_urls?: { spotify: string };
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const ArtistView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const { error, showError } = useErrorToast();

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setLoading(true);
    setArtist(null);
    setTopTracks([]);
    setRelatedArtists([]);
    setAlbums([]);
    setExpandedTrackId(null);

    const fetchArtist = async () => {
      try {
        const res = await api.get(`/auth/spotify/artist/${id}`);
        if (!isMounted) return;

        if (res.data.connected === false) {
          showError("Spotify is not connected.");
          return;
        }

        setArtist(res.data.artist);
        setTopTracks(res.data.topTracks ?? []);
        setRelatedArtists(res.data.relatedArtists ?? []);
        setAlbums(res.data.albums ?? []);
      } catch (err: any) {
        if (!isMounted) return;
        showError(err.response?.data?.error ?? "Failed to load artist.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchArtist();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const heroImage = artist?.images?.[0]?.url ?? "https://placehold.co/640x640";

  return (
    <div className="flex flex-col items-center px-4 pb-24">
      <div className="w-full max-w-5xl mt-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <ChevronLeft size={36} />
        </button>

        {loading ? (
          <p className="text-gray-400 text-center animate-pulse mt-20 text-lg">
            Loading artist...
          </p>
        ) : !artist ? (
          <p className="text-gray-400 text-center mt-20 text-lg">
            Artist not found.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-12"
          >
            <section className="rounded-4xl border border-white/10 bg-card/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,30rem),1fr] lg:items-center">
                <div className="mx-auto w-full max-w-120">
                  <div className="relative h-120 w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/30 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <img
                      src={heroImage}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-radial-[circle_at_top] from-transparent via-transparent to-black/35" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                        {artist.name}
                      </h1>
                    </div>

                    {artist.external_urls?.spotify && (
                      <a
                        href={artist.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-spotify-green px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                      >
                        <ExternalLink size={14} />
                        Open in Spotify
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Popular Tracks ── */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-accent-dark pb-2">
                Popular Tracks
              </h2>
              {topTracks.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {topTracks.map((track, i) => (
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
                        className="flex w-full cursor-pointer items-center gap-3 text-left"
                      >
                        <span className="w-5 shrink-0 text-right font-mono text-sm text-gray-500">
                          {i + 1}
                        </span>
                        <img
                          src={
                            track.album.images?.[0]?.url ||
                            "https://placehold.co/48x48"
                          }
                          alt={track.name}
                          className="h-11 w-11 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">
                            {track.name}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {track.artists
                              .map((trackArtist) => trackArtist.name)
                              .join(", ")}{" "}
                            · {track.album.name}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-gray-500">
                          {formatDuration(track.duration_ms)}
                        </span>
                      </button>

                      {expandedTrackId === track.id && (
                        <TrackPlaylistPicker
                          trackUri={track.uri}
                          trackName={track.name}
                          expanded={true}
                          onToggle={() => setExpandedTrackId(null)}
                          onError={showError}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-card px-5 py-6 text-sm text-gray-400">
                  No popular tracks available for this artist right now.
                </div>
              )}
            </section>

            {/* ── Discography ── */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-accent-dark pb-2">
                Discography
              </h2>
              {albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {albums.map((album) => (
                    <a
                      key={album.id}
                      href={album.external_urls?.spotify ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 bg-card hover:bg-accent-dark transition-colors rounded-xl p-3 group"
                    >
                      <img
                        src={
                          album.images?.[0]?.url ||
                          "https://placehold.co/160x160"
                        }
                        alt={album.name}
                        className="w-full aspect-square rounded-lg object-cover group-hover:brightness-110 transition"
                      />
                      <p className="text-white font-medium text-sm truncate">
                        {album.name}
                      </p>
                      <p className="text-gray-400 text-xs capitalize">
                        {album.album_type} · {album.release_date?.slice(0, 4)}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-card px-5 py-6 text-sm text-gray-400">
                  No albums or singles available for this artist right now.
                </div>
              )}
            </section>

            {/* ── Fans Also Like ── */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4 border-b border-accent-dark pb-2">
                Fans Also Like
              </h2>
              {relatedArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {relatedArtists.map((related) => (
                    <button
                      key={related.id}
                      type="button"
                      onClick={() => navigate(`/artist/${related.id}`)}
                      className="flex flex-col items-center gap-3 bg-card hover:bg-accent-dark transition-colors rounded-xl p-4 cursor-pointer text-center"
                    >
                      <img
                        src={
                          related.images?.[0]?.url ||
                          "https://placehold.co/120x120"
                        }
                        alt={related.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <p className="text-white font-medium text-sm truncate w-full">
                        {related.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-card px-5 py-6 text-sm text-gray-400">
                  No related artists available for this artist right now.
                </div>
              )}
            </section>
          </motion.div>
        )}
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default ArtistView;
