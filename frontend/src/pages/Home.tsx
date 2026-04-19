import { useState, useEffect } from "react";
import api from "../utils/api";
import TopList from "../components/TopList";
import CurrentTrackCard from "../components/CurrentTrackCard";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { motion } from "framer-motion";

interface CurrentlyPlaying {
  progress_ms: number;
  is_playing: boolean;
  name: string;
  image: string;
  artist: string;
}

interface RecentlyPlayed {
  name: string;
  image: string;
  artist: string;
}

const Home = () => {
  const [artists, setArtists] = useState<{ name: string; image: string }[]>([]);
  const [timeRange] = useState(
    () => localStorage.getItem("spotifyTimeRange") ?? "4week",
  );
  const [loadingArtists, setLoadingArtists] = useState(true);

  const [tracks, setTracks] = useState<{ name: string; image: string }[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const [currentlyPlaying, setCurrentlyPlaying] =
    useState<CurrentlyPlaying | null>(null);
  const [loadingCurrentlyPlaying, setLoadingCurrentlyPlaying] = useState(true);
  const [spotifyConnected, setSpotifyConnected] = useState<boolean | null>(
    null,
  );

  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayed | null>(
    null,
  );
  const [loadingRecentlyPlayed, setLoadingRecentlyPlayed] = useState(true);

  const { error, showError } = useErrorToast();

  useEffect(() => {
    let isMounted = true;

    const fetchSpotifyConnection = async () => {
      try {
        const response = await api.get("/user-profile");
        if (!isMounted) return;
        setSpotifyConnected(response.data.spotifyConnected ?? false);
      } catch {
        if (!isMounted) return;
        setSpotifyConnected(false);
      }
    };

    fetchSpotifyConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTopArtists = async () => {
      try {
        const response = await api.get("/auth/spotify/top/artists", {
          params: { timeRange },
        });
        if (!isMounted) return;

        if (response.data.connected === false) {
          setSpotifyConnected(false);
          setArtists([]);
          return;
        }

        const formattedArtists = response.data.items.map((artist: any) => ({
          name: artist.name,
          image:
            artist.images?.length > 0
              ? artist.images[0].url
              : "https://placehold.co/300x300",
        }));
        setSpotifyConnected(true);
        setArtists(formattedArtists);
      } catch (err: any) {
        if (!isMounted) return;
        // Only show toast for unexpected errors — not for "not connected"
        if (err.response?.status === 404) {
          setSpotifyConnected(false);
        } else {
          showError("Failed to load top artists.");
        }
      } finally {
        if (isMounted) setLoadingArtists(false);
      }
    };

    fetchTopArtists();
    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  useEffect(() => {
    let isMounted = true;
    const fetchTopTracks = async () => {
      try {
        const response = await api.get("/auth/spotify/top/tracks", {
          params: { timeRange },
        });
        if (!isMounted) return;

        if (response.data.connected === false) {
          setSpotifyConnected(false);
          setTracks([]);
          return;
        }

        const formattedTracks = response.data.items.map((track: any) => ({
          name: track.name,
          image:
            track.album?.images?.length > 0
              ? track.album.images[0].url
              : "https://placehold.co/300x300",
        }));
        setSpotifyConnected(true);
        setTracks(formattedTracks);
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setSpotifyConnected(false);
        } else {
          showError("Failed to load top tracks.");
        }
      } finally {
        if (isMounted) setLoadingTracks(false);
      }
    };

    fetchTopTracks();
    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const fetchCurrentlyPlaying = async () => {
      try {
        const response = await api.get("/auth/spotify/currently-playing");
        if (!isMounted) return;

        if (response.data?.connected === false) {
          setSpotifyConnected(false);
          setCurrentlyPlaying(null);
          return;
        }

        setSpotifyConnected(true);

        if (response.status === 204 || !response.data || !response.data.item) {
          setCurrentlyPlaying(null);
        } else {
          const formattedCurrentlyPlaying = {
            progress_ms: response.data.progress_ms,
            is_playing: response.data.is_playing,
            name: response.data.item?.name ?? null,
            image:
              response.data.item?.album?.images?.[0]?.url ??
              "https://placehold.co/300x300",
            artist:
              response.data.item?.artists
                ?.map((artist: any) => artist.name)
                .join(", ") ?? null,
          };
          setCurrentlyPlaying(formattedCurrentlyPlaying);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setSpotifyConnected(false);
          setCurrentlyPlaying(null);
        } else {
          showError("Failed to load currently playing track.");
        }
      } finally {
        if (isMounted) {
          setLoadingCurrentlyPlaying(false);
          // Poll every 15 seconds (server caches for 15s)
          timeoutId = setTimeout(fetchCurrentlyPlaying, 15000);
        }
      }
    };

    fetchCurrentlyPlaying();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const fetchRecentlyPlayed = async () => {
      try {
        const response = await api.get("/auth/spotify/recently-played/1");
        if (!isMounted) return;

        if (response.data?.connected === false) {
          setSpotifyConnected(false);
          setRecentlyPlayed(null);
          return;
        }

        setSpotifyConnected(true);

        if (response.data?.items?.length > 0) {
          const track = response.data.items[0].track;
          setRecentlyPlayed({
            name: track.name,
            image:
              track.album?.images?.[0]?.url ?? "https://placehold.co/300x300",
            artist:
              track.artists?.map((artist: any) => artist.name).join(", ") ??
              null,
          });
        } else {
          setRecentlyPlayed(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setSpotifyConnected(false);
          setRecentlyPlayed(null);
        } else {
          showError("Failed to load recently played tracks.");
        }
      } finally {
        if (isMounted) {
          setLoadingRecentlyPlayed(false);
          // Only keep polling when nothing is currently playing (every 30s)
          if (!currentlyPlaying?.name) {
            timeoutId = setTimeout(fetchRecentlyPlayed, 30000);
          }
        }
      }
    };

    fetchRecentlyPlayed();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentlyPlaying?.name]);

  return (
    <div className="flex flex-col gap-20 mb-30">
      <div className="flex flex-col items-center justify-center w-full px-4 sm:px-0">
        <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold mt-10 mb-10 md:mb-20 text-center">
          Welcome to Beatwave
        </h1>
        <div className="bg-card w-full sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-1/2 max-w-[500px] rounded-2xl p-6 sm:p-8 shadow-xl whitespace-normal">
          {spotifyConnected === false ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                ♪
              </div>
              <span className="text-lg sm:text-xl font-medium">
                Spotify is not connected
              </span>
              <p className="text-gray-400 text-sm sm:text-base max-w-sm">
                Connect your Spotify account in your profile settings
              </p>
            </div>
          ) : loadingCurrentlyPlaying ? (
            <p className="text-gray-400 text-center text-sm sm:text-base">
              Loading your currently playing track...
            </p>
          ) : !currentlyPlaying?.name ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-4">
              <span className="text-lg sm:text-xl text-center font-medium">
                Here is your last played music
              </span>
              {loadingRecentlyPlayed ? (
                <p className="text-gray-400 text-sm sm:text-base text-center">
                  Loading your last played track...
                </p>
              ) : recentlyPlayed ? (
                <CurrentTrackCard
                  name={recentlyPlayed.name ?? ""}
                  image={recentlyPlayed.image ?? ""}
                  artist={recentlyPlayed.artist ?? ""}
                  text="The Last Played Music"
                />
              ) : (
                <p className="text-gray-400 text-sm sm:text-base text-center">
                  No recently played track found.
                </p>
              )}
            </div>
          ) : (
            <div>
              <CurrentTrackCard
                name={currentlyPlaying.name || ""}
                image={currentlyPlaying.image || ""}
                artist={currentlyPlaying.artist || ""}
                text={
                  currentlyPlaying.is_playing
                    ? "The Music is Currently Playing"
                    : "The Music is Currently Paused"
                }
              />
            </div>
          )}

          {spotifyConnected !== false && (
            <div className="w-full flex justify-center mt-4 gap-10">
              <motion.div
                whileTap={{ scale: 0.75 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <SkipBack
                  size={36}
                  className="cursor-pointer hover:text-gray-400 active:text-gray-500"
                />
              </motion.div>

              {loadingCurrentlyPlaying ? null : currentlyPlaying?.is_playing ? (
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Pause
                    className="animate-pulse hover:text-gray-400 active:text-gray-500 cursor-pointer translate-x-1"
                    size={36}
                  />
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Play
                    className="animate-pulse hover:text-gray-400 active:text-gray-500 cursor-pointer translate-x-1"
                    size={36}
                  />
                </motion.div>
              )}

              <motion.div
                whileTap={{ scale: 0.75 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <SkipForward
                  size={36}
                  className="cursor-pointer hover:text-gray-400 active:text-gray-500"
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>

      <div className="pl-4 md:pl-20 flex flex-col">
        {loadingArtists ? (
          <p className="text-gray-400">Loading your top artists...</p>
        ) : artists.length > 0 ? (
          <TopList list={artists} title={"Your top 10 Artists:"} />
        ) : (
          <p className="text-gray-400">
            Connect your Spotify to see your top artists here.
          </p>
        )}
      </div>
      <div className="pl-4 md:pl-20 flex flex-col">
        {loadingTracks ? (
          <p className="text-gray-400">Loading your top tracks...</p>
        ) : tracks.length > 0 ? (
          <TopList list={tracks} title={"Your top 10 Tracks:"} />
        ) : (
          <p className="text-gray-400">
            Connect your Spotify to see your top tracks here.
          </p>
        )}
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default Home;
