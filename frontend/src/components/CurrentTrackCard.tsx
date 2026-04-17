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
    <div className="flex flex-col sm:flex-row items-center gap-4 h-auto">
      <img
        src={image}
        alt={name}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded object-cover"
      />
      <div className="flex flex-col justify-center items-center sm:items-start w-full sm:ml-4">
        <div className="mb-4 text-center sm:text-left">
          <p className="text-xl sm:text-2xl font-semibold break-words">
            {name}
          </p>
          {artist ? (
            <p className="text-base sm:text-lg font-light italic h-auto overflow-hidden no-scrollbar break-words">
              {artist}
            </p>
          ) : null}
        </div>
        <p className="text-base sm:text-xl text-gray-400">{text}</p>
      </div>
    </div>
  );
};

export default CurrentlyPlayingCard;
