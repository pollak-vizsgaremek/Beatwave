import { motion } from "framer-motion";

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, delay: placing * 0.05 }}
      className="mr-6 sm:mr-12 mt-5 shrink-0 text-center min-w-[10rem] select-none pointer-events-none"
    >
      <h1 className="font-bold text-2xl mb-2">#{placing}</h1>
      <div
        style={{ backgroundImage: `url(${image})` }}
        className={`bg-cover bg-center rounded-lg p-5 flex flex-col items-center border-2 border-black w-[10rem] h-[10rem] sm:w-[13rem] sm:h-[13rem] shadow-md`}
      ></div>
      <div className="mt-2 w-[10rem] sm:w-[13rem]">
        <h2 className="font-semibold text-xl overflow-hidden text-ellipsis line-clamp-2">
          {name}
        </h2>
      </div>
    </motion.div>
  );
};

export default TopCard;
