import { Bell, UserRound, Search, Settings, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

import Input from "./Input";

const Navigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

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
        wrapperClassName="!-mt-0"
      />

      <div className="flex gap-5 mr-10 items-center">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            <UserRound strokeWidth={3} size={30} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark">
              <button
                onClick={() => handleNavigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors first:rounded-t-lg border-b border-accent-dark"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors border-b border-accent-dark"
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors last:rounded-b-lg"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
