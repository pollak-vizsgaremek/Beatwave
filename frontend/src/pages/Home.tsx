import { useState, useEffect } from "react";
import api from "../utils/api";
import TopList from "../components/TopList";
import { div } from "framer-motion/client";

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

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await api.get("/auth/spotify/top/artists");

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
        setLoadingArtists(false);
      }
    };

    fetchTopArtists();
  }, []);

  useEffect(() => {
    const fetchTopTracks = async () => {
      try {
        const response = await api.get("/auth/spotify/top/tracks");

        const formattedTracks = response.data.items.map((track: any) => ({
          name: track.name,
          image:
            track.album.images?.length > 0
              ? track.album.images[0].url
              : "https://placehold.co/300x300",
        }));
        setTracks(formattedTracks);
      } catch (error) {
        console.error("Error fetching top tracks:", error);
      } finally {
        setLoadingTracks(false);
      }
    };

    fetchTopTracks();
  }, []);

  useEffect(() => {
    const fetchCurrentlyPlaying = async () => {
      try {
        const response = await api.get("/auth/spotify/currently-playing");
        console.log("Spotify currently playing response:", response.data);

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
      } catch (error) {
        console.error("Error fetching currently playing:", error);
      } finally {
        setLoadingCurrentlyPlaying(false);
      }
    };

    fetchCurrentlyPlaying();

    const intervalId = setInterval(fetchCurrentlyPlaying, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col gap-20 mb-30">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mb-20">Welcome to Beatwave</h1>
        <div className="bg-card w-2/6 rounded-lg p-5">
          {loadingCurrentlyPlaying ? (
            <p className="text-gray-400">
              Loading your currently playing track...
            </p>
          ) : !currentlyPlaying || !currentlyPlaying.name ? (
            <div className="flex items-center justify-center h-35 text-xl">
              There is no Spotify open
            </div>
          ) : (
            <div>
              {currentlyPlaying.is_playing ? (
                <div className="flex items-center gap-4 h-35">
                  <img
                    src={currentlyPlaying.image}
                    alt={currentlyPlaying.name}
                    className="w-32 h-32 rounded"
                  />
                  <div className="flex flex-col justify-center items-center w-full">
                    <div className="mb-4 text-center">
                      <p className="text-2xl font-semibold">
                        {currentlyPlaying.name}
                      </p>
                      <p className="text-lg font-light italic">
                        {currentlyPlaying.artist}
                      </p>
                    </div>
                    <p className="text-xl text-gray-400">
                      The Music is playing
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-row items-center h-35">
                  <img
                    src={currentlyPlaying.image}
                    alt={currentlyPlaying.name}
                    className="w-32 h-32 rounded"
                  />
                  <div className="flex flex-col justify-center items-center w-full">
                    <div className="mb-4 text-center">
                      <p className="text-2xl font-semibold">
                        {currentlyPlaying.name}
                      </p>
                      <p className="text-lg font-light italic">
                        {currentlyPlaying.artist}
                      </p>
                    </div>
                    <p className="text-xl text-gray-400">The Music is Paused</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The Top list starts here*/}
      <div className="pl-20 flex flex-col">
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
      <div className="pl-20 flex flex-col">
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
