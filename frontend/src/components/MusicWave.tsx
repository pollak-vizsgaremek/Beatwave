import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { THEMES, BAR_VARIANTS, BAR_COUNT } from "../constants/musicWave";

const MusicWave = () => {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentThemeIndex((prev) => (prev + 1) % THEMES.length);
        setTimeout(() => setIsTransitioning(false), 500);
      }, 500);
    }, 60000); // 60s interval

    return () => clearInterval(interval);
  }, []);

  const currentTheme = THEMES[currentThemeIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full transition-colors duration-1000">
      <div className="flex justify-center gap-3 h-[200px] items-center">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const effectiveIndex = currentTheme.reverse ? BAR_COUNT - 1 - i : i;

          return (
            <motion.div
              key={i}
              className={`w-4 bg-linear-to-t ${currentTheme.gradient} rounded-full`}
              variants={BAR_VARIANTS}
              animate={isTransitioning ? "stop" : currentTheme.variant}
              custom={effectiveIndex}
            />
          );
        })}
      </div>
      <p
        className={`mt-12 text-5xl font-bold text-white tracking-widest uppercase opacity-80 transition-all duration-500 ${
          isTransitioning ? "scale-95 opacity-50" : "scale-100 opacity-80"
        }`}
      >
        {currentTheme.name === "Chaos" ? "CHAOS MODE" : "Feel the Beat"}
      </p>
    </div>
  );
};

export default MusicWave;
