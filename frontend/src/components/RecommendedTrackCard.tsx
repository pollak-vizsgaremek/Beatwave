import TrackPlaylistPicker from "./TrackPlaylistPicker";
import { motion } from "framer-motion";

type RecommendedTrackCardProps = {
  id: string;
  name: string;
  image: string;
  artist: string;
  album: string;
  duration: string;
  releaseYear: string;
  trackUri: string;
  expanded: boolean;
  onToggle: () => void;
  onSuccess?: (message: string) => void;
  onError: (message: string) => void;
};

const RecommendedTrackCard = ({
  id,
  name,
  image,
  artist,
  album,
  duration,
  releaseYear,
  trackUri,
  expanded,
  onToggle,
  onSuccess,
  onError,
}: RecommendedTrackCardProps) => {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group rounded-2xl border bg-card/90 p-4 shadow-lg transition-all duration-200 ${
        expanded
          ? "xl:col-span-2 border-spotify-green shadow-[0_0_0_1px_rgba(29,185,84,0.35)]"
          : "border-white/8 hover:-translate-y-1"
      }`}
    >
      <div className={`flex flex-col gap-4 ${expanded ? "xl:flex-row xl:items-start" : ""}`}>
        <button
          type="button"
          onClick={onToggle}
          className={`block cursor-pointer text-left ${
            expanded ? "xl:w-[15rem] shrink-0" : "w-full"
          }`}
        >
          <div
            style={{ backgroundImage: `url(${image})` }}
            className="aspect-square w-full rounded-xl bg-cover bg-center"
          />
          <div className="mt-4 space-y-2">
            <h3 className="line-clamp-2 text-lg font-semibold">{name}</h3>
            <p className="line-clamp-1 text-sm text-gray-300">{artist}</p>
            <p className="line-clamp-1 text-sm text-gray-400">Album: {album}</p>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-500">
              <span>{duration}</span>
              <span>{releaseYear}</span>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="min-w-0 flex-1 xl:pl-2">
            <TrackPlaylistPicker
              key={id}
              trackUri={trackUri}
              trackName={name}
              expanded={expanded}
              onToggle={onToggle}
              onSuccess={onSuccess}
              onError={onError}
            />
          </div>
        )}
      </div>
      {!expanded && (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
          Click to add to playlists
        </p>
      )}
    </motion.div>
  );
};

export default RecommendedTrackCard;
