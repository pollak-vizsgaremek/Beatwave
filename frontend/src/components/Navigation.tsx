import { Bell } from "lucide-react";
import { UserRound } from "lucide-react";
import { Search } from "lucide-react";
import { Link } from "react-router";
import Input from "./Input";

const Navigation = () => {
  return (
    <div className="bg-linear-to-b from-accent to-accent-dark flex gap-10 h-17 items-center justify-around w-2/3 mx-auto rounded-b-3xl mb-10 shadow-md shadow-black-100/30">
      <Link to="/home" className="text-white text-2xl font-bold ml-10">
        Beatwave
      </Link>
      <Link to="/discussion" className="text-white text-lg font-medium">
        Discussion
      </Link>
      <Input
        inputType="text"
        inputName="search"
        inputPlaceHolder="Keresés..."
        icon={<Search strokeWidth={3} size={30} />}
        inputClassName="min-w-2/3"
      />

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
