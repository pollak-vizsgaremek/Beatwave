import Card from "../components/Card";

const Home = () => {
  return (
    <div className="flex flex-col gap-20 ">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-3xl font-bold mb-10">Welcome to Beatwave</h1>
        <Card />
      </div>
      <div className="pl-30">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Artists:</h2>
        <Card />
      </div>
      <div className="pl-30">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Songs:</h2>
        <Card />
      </div>
    </div>
  );
};

export default Home;
