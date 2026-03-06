import {
  Bell,
  UserRound,
  Search,
  Settings,
  LogOut,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

import Input from "./Input";

const Navigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isActiveSpotify, setIsActiveSpotify] = useState(true);
  const [isActiveSoundCloud, setIsActiveSoundCloud] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-linear-to-b from-accent to-accent-dark flex gap-10 h-17 items-center justify-around w-2/3 mx-auto rounded-b-3xl mb-10 shadow-md shadow-black-100/30 min-w-2/4">
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
        iconLeft={<Search strokeWidth={3} size={30} />}
        iconRight={<SlidersHorizontal strokeWidth={3} size={30} />}
        inputClassName="min-w-2/3 m"
        wrapperClassName="!-mt-0"
      />
      <div className="relative top-20 bg-accent p-3 rounded-2xl">
        <div className="flex flex-row gap-4">
          <button
            onClick={() => {
              setIsActiveSpotify(!isActiveSpotify);

              if (!isActiveSpotify && isActiveSoundCloud === true) {
                setIsActiveSoundCloud(false);
              }
            }}
            className={`w-32 cursor-pointer bg-spotify-green p-3 rounded-xl text-black outline hover:outline-2 hover:font-medium ${
              isActiveSpotify ? "outline-2 font-medium" : "!bg-gray-500"
            }`}
          >
            Spotify
          </button>
          <button
            onClick={() => {
              if (isActiveSpotify && !isActiveSoundCloud == true) {
                setIsActiveSpotify(false);
              }

              setIsActiveSoundCloud(!isActiveSoundCloud);
            }}
            className={`w-32 cursor-pointer bg-soundcloud-orange p-3 rounded-xl text-white outline-black outline hover:outline-2 hover:font-medium ${
              isActiveSoundCloud
                ? "outline-2 font-medium"
                : "!bg-gray-500 !text-black"
            }`}
          >
            SoundCloud
          </button>
        </div>
        <div className="flex flex-row gap-5">
          <Input
            wrapperClassName="flex-row-reverse"
            inputName="Artists"
            inputClassName="!w-4"
            inputType="checkbox"
            labelTitle="Artists"
            labelClassName="text-sm"
          />
          <Input
            wrapperClassName="flex-row-reverse w-2"
            inputName="Artists"
            inputClassName="!w-4"
            inputType="checkbox"
            labelTitle="Artists"
            labelClassName="text-sm"
          />
          <Input
            wrapperClassName="flex-row-reverse w-2"
            inputName="Artists"
            inputClassName="!w-4"
            inputType="checkbox"
            labelTitle="Artists"
            labelClassName="text-sm"
          />
        </div>
      </div>

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
                <span>Profile</span>
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
