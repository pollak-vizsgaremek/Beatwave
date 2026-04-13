const CurrentlyPlayingCard = ({
  name,
  image,
  artist,
  text,
}: {
  name: string;
  image: string;
  artist: string;
  text: string;
}) => {
  return (
    <div className="flex items-center gap-4 h-35">
      <img src={image} alt={name} className="w-32 h-32 rounded" />
      <div className="flex flex-col justify-center items-center w-full ml-4">
        <div className="mb-4 text-center">
          <p className="text-2xl font-semibold">{name}</p>
          <p className="text-lg font-light italic h-12 overflow-y-auto no-scrollbar">
            {artist}
          </p>
        </div>
        <p className="text-xl text-gray-400">{text}</p>
      </div>
    </div>
  );
};

export default CurrentlyPlayingCard;
