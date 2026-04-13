const TopCard = ({
  name,
  image,
  placing,
}: {
  name: string;
  image: string;
  placing: number;
}) => {
  return (
    <div className="mr-12 mt-5 shrink-0 text-center">
      <h1 className="font-bold text-2xl mb-2">#{placing}</h1>
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={`bg-cover bg-center rounded-lg p-5 flex flex-col items-center border-2 border-black w-50 h-50`}
      ></div>
      <div className="mt-2 w-50">
        <h2 className="font-semibold text-xl overflow-hidden">{name}</h2>
      </div>
    </div>
  );
};

export default TopCard;
