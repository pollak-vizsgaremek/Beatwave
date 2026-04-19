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
    <div className="mr-6 sm:mr-12 mt-5 shrink-0 text-center min-w-[10rem] select-none pointer-events-none">
      <h1 className="font-bold text-2xl mb-2">#{placing}</h1>
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={`bg-cover bg-center rounded-lg p-5 flex flex-col items-center border-2 border-black w-[10rem] h-[10rem] sm:w-[13rem] sm:h-[13rem]`}
      ></div>
      <div className="mt-2 w-[10rem] sm:w-[13rem]">
        <h2 className="font-semibold text-xl overflow-hidden text-ellipsis line-clamp-2">
          {name}
        </h2>
      </div>
    </div>
  );
};

export default TopCard;
