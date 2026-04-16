import { PencilLine, X } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../utils/api";
import Input from "../components/Input";
import Button from "../components/Button";
import { Link } from 'react-router';

interface User {
  username: string;
  email: string;
  spotifyConnected: boolean;
  soundCloudConnected: boolean;
}

const UserProfile = () => {
  const [isOnProfile, setIsOnProfile] = useState(true);
  const [spotiHover, setSpotiHover] = useState(false);
  const [soundHover, setSoundHover] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (newUsername !== confirmUsername) {
      setModalError("A két felhasználónév nem egyezik!");
      return;
    }

    if (!password) {
      setModalError("Kérlek add meg a jelszavad!");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.put("/user-profile", {
        username: newUsername,
        password: password,
      });
      setUser((prev) =>
        prev ? { ...prev, username: response.data.username } : null,
      );
      setIsModalOpen(false);
      resetModal();
    } catch (error: any) {
      console.error("Update error:", error);
      setModalError(
        error.response?.data?.error || "Hiba történt a frissítés során",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const resetModal = () => {
    setNewUsername("");
    setConfirmUsername("");
    setPassword("");
    setModalError(null);
  };

  const handleConnectSpotify = async () => {
    try {
      const response = await api.get("/auth/spotify/url");
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error connecting Spotify:", error);
    }
  };

  const handleDisconnectSpotify = async () => {
    try {
      await api.delete("/auth/spotify");
      setUser((prev) => (prev ? { ...prev, spotifyConnected: false } : null));
      setSpotiHover(false);
    } catch (error) {
      console.error("Error disconnecting from Spotify:", error);
    }
  };

  const connectedToSpotify = user?.spotifyConnected ?? false;
  const connectedToSoundCloud = user?.soundCloudConnected ?? false;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/user-profile");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <p className="text-white">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center justify-center mt-20 w-4/7">
        <div className="flex gap-4 self-start ml-10 mb-2 text-2xl">
          <button
            className={`pointer hover:font-medium hover:underline underline-offset-2 ${
              isOnProfile ? "font-medium underline" : ""
            }`}
            onClick={() => setIsOnProfile(true)}
          >
            Profile
          </button>
          <button
            className={`pointer hover:font-medium hover:underline underline-offset-2${
              isOnProfile ? "" : "font-medium underline"
            }`}
            onClick={() => setIsOnProfile(false)}
          >
            Settings
          </button>
        </div>
        <div className="bg-card-black w-full h-auto p-3 flex flex-row rounded-3xl">
          <div className="w-2/5 p-2 h-full flex flex-col justify-center ">
            <div className="flex justify-center items-center flex-col">
              <div className="bg-accent mt-2 p-2 w-32 h-32 rounded-full flex justify-center items-center">
                pfp-pic
              </div>
              <div
                className="flex justify-center items-center mt-2 text-lg text-amber-600 cursor-pointer hover:text-amber-500"
                onClick={() => setIsModalOpen(true)}
              >
                {user?.username || "Felhasználó"}{" "}
                <PencilLine size={14} className="ml-1" />
              </div>
            </div>
            <div className="flex justify-center items-center flex-col mt-2">
              {connectedToSpotify ? (
                <div
                  onPointerEnter={() => setSpotiHover(true)}
                  onPointerLeave={() => setSpotiHover(false)}
                  onClick={handleDisconnectSpotify}
                  className={`flex justify-center bg-spotify-green mt-2 p-3 rounded-2xl text-black font-semibold text-lg w-3/4 hover:bg-spotify-green/85 outline-1 hover:outline-2 cursor-pointer transition-colors ${
                    spotiHover ? "bg-red-700! text-white outline-black" : ""
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
                <div
                  onClick={handleConnectSpotify}
                  className="flex justify-center bg-gray-400 border-spotify-green border-2 mt-2 p-3 rounded-2xl text-black w-3/4 text-center cursor-pointer hover:bg-gray-500 transition-colors"
                  title="Kattints a Spotify összekapcsolásához"
                >
                  Csatlakozás a Spotify-hoz
                </div>
              )}

              {connectedToSoundCloud ? (
                <div
                  onPointerEnter={() => setSoundHover(true)}
                  onPointerLeave={() => setSoundHover(false)}
                  className={`flex justify-center bg-soundcloud-orange mt-4 p-3 rounded-2xl text-white font-semibold text-lg w-3/4 hover:bg-soundcloud-orange/85 outline-white outline-1 hover:outline-2 ${
                    soundHover ? "bg-red-700! text-white outline-black!" : ""
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
                <div className="flex justify-center bg-gray-400 border-soundcloud-orange border-2 mt-4 p-3 rounded-2xl text-black w-3/4 text-center">
                  {soundHover && connectedToSoundCloud ? (
                    <p className="flex flex-row items-center">Összkapcsolás</p>
                  ) : (
                    <p>SoundCloud fiókod nincs hozzá kapcsolva</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-3/4 p-2 h-full ">
            <select name="timeRange" className="w-2/5 p-3 rounded-2xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              <option selected value="4week">4 weeks</option>
              <option value="6month">6 months</option>
              <option value="alltime">All time</option>
            </select>

            <Link to="/admin">
              <Button
                labelTitle="admin"
                className="mt-6! outline-1 border-none hover:outline-white hover:outline-1 hover:outline-offset-2"
              />
            </Link>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-[600px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetModal();
                }}
                className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
              >
                <X size={40} />
              </button>

              <h2 className="text-3xl font-semibold text-white mb-6 mt-8">
                Felhasználónév módosítása
              </h2>

              <form
                onSubmit={handleUpdateUsername}
                className="w-full flex flex-col items-center"
              >
                <Input
                  labelTitle="Új felhasználónév"
                  inputName="newUsername"
                  inputType="text"
                  inputPlaceHolder="Új név"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  wrapperClassName="!mt-2"
                  labelClassName="!font-normal"
                />

                <Input
                  labelTitle="Felhasználónév megerősítése"
                  inputName="confirmUsername"
                  inputType="text"
                  inputPlaceHolder="Új név újra"
                  value={confirmUsername}
                  onChange={(e) => setConfirmUsername(e.target.value)}
                  wrapperClassName="!mt-5"
                  labelClassName="!font-normal"
                />

                <Input
                  labelTitle="Jelenlegi jelszó"
                  inputName="password"
                  inputType="password"
                  inputPlaceHolder="Jelszó"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  wrapperClassName="!mt-5"
                  labelClassName="!font-normal"
                />

                {modalError && (
                  <p className="text-red-400 text-sm mt-4">{modalError}</p>
                )}

                <Button
                  labelTitle={isUpdating ? "Mentés..." : "Mentés"}
                  type="submit"
                  disabled={isUpdating}
                  className="mt-6 mb-4"
                />
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
