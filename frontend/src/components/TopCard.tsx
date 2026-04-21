import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const TopCard = ({
  name,
  image,
  placing,
  artistId,
}: {
  name: string;
  image: string;
  placing: number;
  artistId?: string;
}) => {
  const navigate = useNavigate();
  const inner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, delay: placing * 0.05 }}
      className="mr-6 mt-5 min-w-40 shrink-0 select-none text-center sm:mr-12"
    >
      <h1 className="font-bold text-2xl mb-2">#{placing}</h1>
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={`flex h-44 w-40 items-center rounded-lg border-2 border-black bg-cover bg-center p-5 shadow-md sm:h-56 sm:w-52${artistId ? " transition-[filter] hover:brightness-110" : ""}`}
      />
      <div className="mt-2 w-40 sm:w-52">
        <h2 className="font-semibold text-xl overflow-hidden text-ellipsis line-clamp-2">
          {name}
        </h2>
      </div>
    </motion.div>
  );

  if (artistId) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/artist/${artistId}`)}
        className="block cursor-pointer"
      >
        {inner}
      </button>
    );
  }

  return inner;
};

export default TopCard;
