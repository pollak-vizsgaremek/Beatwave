import { PencilLine, X } from "lucide-react";
import { useState } from "react";

const UserProfile = () => {
  const connectedToSpotify = true;
  const connectedToSoundCloud = true;

  const [spotiHover, setSpotiHover] = useState(true);
  const [soundHover, setSoundHover] = useState(false);

  return (
    <div className="flex justify-center mt-20">
      <div className="bg-card w-4/7 h-auto p-3 flex flex-row rounded-3xl">
        <div className="w-2/5 p-2 h-full flex flex-col justify-center ">
          <div className="flex justify-center items-center flex-col">
            <div className="bg-accent mt-2 p-2 w-32 h-32 rounded-full flex justify-center items-center">
              pfp-pic
            </div>
            <div className="flex justify-center items-center mt-2 text-lg text-amber-600 cursor-pointer">
              userName <PencilLine size={14} className="ml-1" />
            </div>
          </div>
          <div className="flex justify-center items-center flex-col mt-2">
            {connectedToSpotify ? (
              <div
                onPointerEnter={() => setSpotiHover(true)}
                onPointerLeave={() => setSpotiHover(false)}
                className={`flex justify-center bg-spotify-green mt-2 p-3 rounded-2xl text-black font-semibold text-lg w-3/4 hover:bg-spotify-green/85 outline-1 hover:outline-2 ${
                  spotiHover ? "!bg-red-700 text-white outline-black" : ""
                }`}
              >
                {spotiHover ? (
                  <p className="flex flex-row items-center">
                    Leválasztás <X />
                  </p>
                ) : (
                  <p>Spotify</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center bg-gray-400 border-spotify-green border-2 mt-2 p-3 rounded-2xl text-black w-3/4">
                Spotify nincs hozzá kapcsolva
              </div>
            )}

            {connectedToSoundCloud ? (
              <div
                onPointerEnter={() => setSoundHover(true)}
                onPointerLeave={() => setSoundHover(false)}
                className={`flex justify-center bg-soundcloud-orange mt-4 p-3 rounded-2xl text-white font-semibold text-lg w-3/4 hover:bg-soundcloud-orange/85 outline-white outline-1 hover:outline-2 ${
                  soundHover ? "!bg-red-700 text-white !outline-black" : ""
                }`}
              >
                {soundHover ? (
                  <p className="flex flex-row items-center">
                    Leválasztás <X />
                  </p>
                ) : (
                  <p>SoundCloud</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center bg-gray-400 border-soundcloud-orange border-2 mt-4 p-3 rounded-2xl text-black w-3/4">
                SoundCould nincs hozzá kapcsolva
              </div>
            )}
          </div>
        </div>
        <div className="w-3/4 p-2 h-full "></div>
      </div>
    </div>
  );
};

export default UserProfile;
