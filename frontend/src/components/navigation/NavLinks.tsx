import { Link } from "react-router";
import { motion } from "framer-motion";

const NavLinks = () => {
  return (
    <div className="flex items-center gap-4 md:gap-8 shrink-0">
      <Link to="/home">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-white text-lg sm:text-xl md:text-2xl font-bold shrink-0"
        >
          Beatwave
        </motion.div>
      </Link>

      <Link to="/discussion" className="hidden md:block">
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="text-white text-sm sm:text-base md:text-lg font-medium shrink-0"
        >
          Discussion
        </motion.div>
      </Link>
    </div>
  );
};

export default NavLinks;
