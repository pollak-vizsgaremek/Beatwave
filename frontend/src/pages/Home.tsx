import Card from "../components/Card";

const Home = () => {
  const Artists = [
    {
      name: "Artist 1",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 2",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 3",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 4",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 5",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 6",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 7",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 8",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 9",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Artist 10",
      image: "https://via.placeholder.com/150",
    },
  ];

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

      <div className="pl-30 ">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Artists:</h2>
        <div className="flex flex-row overflow-x-visible ml-6">
          {Artists.map((artist, i) => (
            <Card
              key={i}
              name={artist.name}
              image={artist.image}
              placing={i + 1}
            />
          ))}
        </div>
      </div>
      <div className="pl-30">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Songs:</h2>
        <div className="grid grid-cols-5 gap-5"></div>
      </div>
    </div>
  );
};

export default Home;
