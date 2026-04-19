import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TrackPlaylistPicker from "./TrackPlaylistPicker";

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

const smoothTransition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1] as const,
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
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (expanded) {
      setIsClosing(false);
    }
  }, [expanded]);

  const handleToggle = () => {
    if (expanded) {
      setIsClosing(true);
    }

    onToggle();
  };

  const keepExpandedLayout = expanded || isClosing;

  return (
    <motion.div
      layout
      // 1. LÉPÉS: Konkrét induló és érkező állapotok megadása a berepülés elkerülésére
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!expanded ? { y: -4 } : { y: 0 }}
      transition={smoothTransition}
      className={`group rounded-2xl border bg-card/90 p-4 shadow-lg transition-colors duration-200 ${
        expanded
          ? "xl:col-span-2 border-spotify-green shadow-[0_0_0_1px_rgba(29,185,84,0.35)]"
          : "border-white/8"
      }`}
    >
      <div
        className={`flex flex-col gap-4 ${
          keepExpandedLayout ? "xl:flex-row xl:items-start" : ""
        }`}
      >
        <motion.button
          layout="position"
          type="button"
          onClick={handleToggle}
          className={`block cursor-pointer text-left ${
            keepExpandedLayout ? "xl:w-[15rem] shrink-0" : "w-full"
          }`}
        >
          <motion.div
            layout="position"
            style={{ backgroundImage: `url(${image})` }}
            className="aspect-square w-full rounded-xl bg-cover bg-center"
          />
          <motion.div layout="position" className="mt-4 space-y-2">
            <h3 className="line-clamp-2 text-lg font-semibold">{name}</h3>
            <p className="line-clamp-1 text-sm text-gray-300">{artist}</p>
            <p className="line-clamp-1 text-sm text-gray-400">Album: {album}</p>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-500">
              <span>{duration}</span>
              <span>{releaseYear}</span>
            </div>
          </motion.div>
        </motion.button>

        <AnimatePresence
          initial={false}
          onExitComplete={() => setIsClosing(false)}
        >
          {expanded && (
            <motion.div
              key={`${id}-picker`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={smoothTransition}
              className="min-w-0 flex-1 overflow-hidden xl:pl-2"
            >
              <div className="pt-2 xl:pt-0">
                <TrackPlaylistPicker
                  key={id}
                  trackUri={trackUri}
                  trackName={name}
                  expanded={expanded}
                  onToggle={handleToggle}
                  onSuccess={onSuccess}
                  onError={onError}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {!expanded && !isClosing && (
          <motion.div
            key={`${id}-hint`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={smoothTransition}
            className="overflow-hidden"
          >
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
              Click to add to playlists
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecommendedTrackCard;
