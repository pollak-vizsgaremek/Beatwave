import { Bell } from "lucide-react";
import { UserRound } from "lucide-react";
import { Search } from "lucide-react";
import { Link } from "react-router";

const Navigation = () => {
  return (
    <div className="bg-gradient-to-b from-[#423686] to-[#100D20] flex gap-20 h-17 items-center justify-between">
      <Link to="/home" className="text-white text-2xl font-bold ml-10">
        Beatwave
      </Link>
      <Link to="/discussion" className="text-white text-lg font-medium">
        Discussion
      </Link>

      <div className="flex items-center">
        <input
          type="search"
          className="bg-[#4B9FBE] rounded-4xl border-4 border-[#245365] w-100 h-10"
        ></input>

        <Search strokeWidth={3} size={30} />
      </div>
      <div className="flex gap-5 mr-10">
        <Bell strokeWidth={3} size={30} />
        <Link to="/profile">
          <UserRound strokeWidth={3} size={30} />
        </Link>
      </div>
    </div>
  );
};

export default Navigation;
