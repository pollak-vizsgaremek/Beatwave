const Card = () => {
  return (
    <div className="bg-card w-2/6 rounded-lg p-5 flex justify-between">
      <div className="text-xl">
        <h2 className="font-semibold">Recently played on [platform]:</h2>
        <p>[song name]</p>
      </div>
      <div>[album pic here]</div>
    </div>
  );
};

export default Card;
