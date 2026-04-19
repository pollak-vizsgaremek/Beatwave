import { Link } from "react-router";

const NavLinks = () => {
  return (
    <>
      <Link
        to="/home"
        className="text-white text-lg sm:text-xl md:text-2xl font-bold shrink-0"
      >
        Beatwave
      </Link>

      <Link
        to="/discussion"
        className="hidden md:block text-white text-sm sm:text-base md:text-lg font-medium shrink-0"
      >
        Discussion
      </Link>
    </>
  );
};

export default NavLinks;
