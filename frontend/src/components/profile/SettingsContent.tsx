import { X } from "lucide-react";
import Button from "../Button";

interface SettingsContentProps {
  connectedToSpotify: boolean;
  connectedToSoundCloud: boolean;
  spotiHover: boolean;
  soundHover: boolean;
  timeRange: string;
  isPrivate: boolean;
  isUpdatingPrivacy: boolean;
  onOpenEditModal: () => void;
  onTogglePrivacy: () => void;
  onConnectSpotify: () => void;
  onDisconnectSpotify: () => void;
  onSpotifyHoverChange: (value: boolean) => void;
  onSoundHoverChange: (value: boolean) => void;
  onTimeRangeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SettingsContent = ({
  connectedToSpotify,
  connectedToSoundCloud,
  spotiHover,
  soundHover,
  timeRange,
  isPrivate,
  isUpdatingPrivacy,
  onOpenEditModal,
  onTogglePrivacy,
  onConnectSpotify,
  onDisconnectSpotify,
  onSpotifyHoverChange,
  onSoundHoverChange,
  onTimeRangeChange,
}: SettingsContentProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Profile settings
          </h2>
          <p className="text-gray-400 mt-1">
            Update your username, description and music preferences.
          </p>
        </div>
        <Button
          labelTitle="Edit profile"
          onClick={onOpenEditModal}
          className="mt-0! px-6 py-3 self-start sm:self-auto"
        />
      </div>

      <div className="bg-card rounded-2xl p-5 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Profile privacy</h3>
            <p className="text-gray-400 mt-1">
              When private, other users will see “this profile is private” instead of your posts.
            </p>
          </div>
          <button
            type="button"
            onClick={onTogglePrivacy}
            disabled={isUpdatingPrivacy}
            className={`rounded-2xl px-5 py-3 font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              isPrivate
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-spotify-green text-black hover:bg-spotify-green/85"
            }`}
          >
            {isUpdatingPrivacy
              ? "Saving..."
              : isPrivate
                ? "Private profile: ON"
                : "Private profile: OFF"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-white/10 flex flex-col items-start">
          <h3 className="text-lg font-semibold text-white mb-3">Spotify</h3>
          {connectedToSpotify ? (
            <div
              onPointerEnter={() => onSpotifyHoverChange(true)}
              onPointerLeave={() => onSpotifyHoverChange(false)}
              onClick={onDisconnectSpotify}
              className={`flex justify-center bg-spotify-green p-3 rounded-2xl text-black font-semibold w-full hover:bg-spotify-green/85 outline-1 hover:outline-2 cursor-pointer transition-colors ${
                spotiHover ? "bg-red-700! text-white outline-black" : ""
              }`}
            >
              {spotiHover ? (
                <p className="flex flex-row items-center gap-1">
                  Disconnect <X size={18} />
                </p>
              ) : (
                <p>Connected to Spotify</p>
              )}
            </div>
          ) : (
            <div
              onClick={onConnectSpotify}
              className="flex justify-center bg-gray-400 border-spotify-green border-2 p-3 rounded-2xl text-black w-full text-center cursor-pointer hover:bg-gray-500 transition-colors"
              title="Connect your Spotify account"
            >
              Connect Spotify
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 border border-white/10 flex flex-col items-start">
          <h3 className="text-lg font-semibold text-white mb-3">SoundCloud</h3>
          {connectedToSoundCloud ? (
            <div
              onPointerEnter={() => onSoundHoverChange(true)}
              onPointerLeave={() => onSoundHoverChange(false)}
              className={`flex justify-center bg-soundcloud-orange p-3 rounded-2xl text-white font-semibold w-full hover:bg-soundcloud-orange/85 outline-white outline-1 hover:outline-2 ${
                soundHover ? "bg-red-700! text-white outline-black!" : ""
              }`}
            >
              {soundHover ? (
                <p className="flex flex-row items-center gap-1">
                  Disconnect <X size={18} />
                </p>
              ) : (
                <p>Connected to SoundCloud</p>
              )}
            </div>
          ) : (
            <div className="flex justify-center bg-gray-400 border-soundcloud-orange border-2 p-3 rounded-2xl text-black w-full text-center">
              SoundCloud is not connected yet
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-white/10">
        <label
          htmlFor="timeRange"
          className="text-lg font-semibold text-white block mb-3"
        >
          Top items time range
        </label>
        <select
          id="timeRange"
          name="timeRange"
          value={timeRange}
          onChange={onTimeRangeChange}
          className="w-full md:w-2/3 p-3 rounded-2xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="4week">Last 4 weeks</option>
          <option value="6month">Last 6 months</option>
          <option value="alltime">All time</option>
        </select>
      </div>
    </div>
  );
};

export default SettingsContent;
