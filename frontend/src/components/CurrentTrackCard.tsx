import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col sm:flex-row items-center gap-4 h-auto"
    >
      <motion.img
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
        src={image}
        alt={name}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded object-cover shadow-lg"
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
    </motion.div>
  );
};

export default CurrentlyPlayingCard;
