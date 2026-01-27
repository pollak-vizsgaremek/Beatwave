const Card = () => {
  return (
    <div className="">
      <div className="bg-card rounded-lg p-5 flex flex-col items-center">
        <h1 className="font-bold text-xl">#[placing]</h1>
        <div>
          <div className="bg-accent w-24 h-24 mb-4 rounded-full flex items-center justify-center">
            [album pic here]
          </div>
          <h2 className="font-semibold text-lg">[artist/song name]</h2>
          <p className="text-sm text-gray-400 mt-2">[additional info]</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
