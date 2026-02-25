import { useState, useEffect } from "react";
import api from "../utils/api";
import TopList from "../components/TopList";

const Home = () => {
  const [artists, setArtists] = useState<{ name: string; image: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await api.get("/auth/spotify/top/artists");
        // Map Spotify response to { name, image } format expected by TopList
        const formattedArtists = response.data.items.map((artist: any) => ({
          name: artist.name,
          image:
            artist.images?.length > 0
              ? artist.images[0].url
              : "https://via.placeholder.com/150",
        }));
        setArtists(formattedArtists);
      } catch (error) {
        console.error("Error fetching top artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopArtists();
  }, []);

  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-3xl font-bold mb-10">Welcome to Beatwave</h1>
        <div className="bg-card w-2/6 rounded-lg p-5 flex justify-between">
          <div className="text-xl">
            <h2 className="font-semibold">Recently played on [platform]:</h2>
            <p>[song name]</p>
          </div>
          <div>[album pic here]</div>
        </div>
      </div>

      {/* The Top list starts here*/}
      <div className="pl-30 flex flex-col">
        {loading ? (
          <p className="text-gray-400">Loading your top artists...</p>
        ) : artists.length > 0 ? (
          <TopList list={artists} title={"Your top 10 Artists:"} />
        ) : (
          <p className="text-gray-400">
            Connect your Spotify to see your top artists here.
          </p>
        )}
      </div>
      <div className="pl-30">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Songs:</h2>
        <div className="grid grid-cols-5 gap-5"></div>
      </div>
    </div>
  );
};

export default Home;
