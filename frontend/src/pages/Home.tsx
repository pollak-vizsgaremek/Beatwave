import { useState, useEffect } from "react";
import api from "../utils/api";
import TopList from "../components/TopList";
import CurrentTrackCard from "../components/CurrentTrackCard";

const Home = () => {
  const [artists, setArtists] = useState<{ name: string; image: string }[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  const [tracks, setTracks] = useState<{ name: string; image: string }[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const [currentlyPlaying, setCurrentlyPlaying] = useState<{
    progress_ms: number;
    is_playing: boolean;
    name: string | null;
    image: string | null;
    artist: string | null;
  } | null>(null);
  const [loadingCurrentlyPlaying, setLoadingCurrentlyPlaying] = useState(true);

  const [recentlyPlayed, setRecentlyPlayed] = useState<{
    name: string;
    image: string;
    artist: string;
  } | null>(null);
  const [loadingRecentlyPlayed, setLoadingRecentlyPlayed] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTopArtists = async () => {
      try {
        const response = await api.get("/auth/spotify/top/artists");
        if (!isMounted) return;

        const formattedArtists = response.data.items.map((artist: any) => ({
          name: artist.name,
          image:
            artist.images?.length > 0
              ? artist.images[0].url
              : "https://placehold.co/300x300",
        }));
        setArtists(formattedArtists);
      } catch (error) {
        console.error("Error fetching top artists:", error);
      } finally {
        if (isMounted) setLoadingArtists(false);
      }
    };

    fetchTopArtists();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTopTracks = async () => {
      try {
        const response = await api.get("/auth/spotify/top/tracks");
        if (!isMounted) return;

        const formattedTracks = response.data.items.map((track: any) => ({
          name: track.name,
          image:
            track.album?.images?.length > 0
              ? track.album.images[0].url
              : "https://placehold.co/300x300",
        }));
        setTracks(formattedTracks);
      } catch (error) {
        console.error("Error fetching top tracks:", error);
      } finally {
        if (isMounted) setLoadingTracks(false);
      }
    };

    fetchTopTracks();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const fetchCurrentlyPlaying = async () => {
      try {
        const response = await api.get("/auth/spotify/currently-playing");
        if (!isMounted) return;

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
      } catch (error) {
        console.error("Error fetching currently playing:", error);
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
        }
      } catch (error) {
        console.error("Error fetching recently played tracks:", error);
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

    // Fetch immediately on mount, or when currentlyPlaying changes to null
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
        <div className="bg-card w-full sm:w-[80%] md:w-[60%] lg:w-[50%] xl:w-1/2 max-w-[500px] rounded-2xl p-8 shadow-xl whitespace-nowrap">
          {loadingCurrentlyPlaying ? (
            <p className="text-gray-400 text-center text-sm sm:text-base">
              Loading your currently playing track...
            </p>
          ) : !currentlyPlaying?.name ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-4">
              <span className="text-lg sm:text-xl text-center font-medium">
                Here is your last played music
              </span>
              {loadingRecentlyPlayed || !recentlyPlayed ? (
                <p className="text-gray-400 text-sm sm:text-base text-center">
                  Loading your last played track...
                </p>
              ) : (
                <CurrentTrackCard
                  name={recentlyPlayed.name}
                  image={recentlyPlayed.image}
                  artist={recentlyPlayed.artist}
                  text="The Last Played Music"
                />
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
    </div>
  );
};

export default Home;
