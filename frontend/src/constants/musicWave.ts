import { type Variants } from "framer-motion";

export interface Theme {
  name: string;
  gradient: string;
  variant: string;
  reverse?: boolean;
}

export const THEMES: Theme[] = [
  { name: "Ocean", gradient: "from-[#4f46e5] to-[#3b82f6]", variant: "ocean" },
  {
    name: "Sunset",
    gradient: "from-[#f97316] to-[#db2777]",
    variant: "sunset",
  },
  {
    name: "Electric",
    gradient: "from-[#84cc16] to-[#06b6d4]",
    variant: "fast",
  },
  { name: "Chaos", gradient: "from-[#7f1d1d] to-[#000000]", variant: "chaos" },
  { name: "Zen", gradient: "from-[#14b8a6] to-[#2dd4bf]", variant: "pulse" },
  {
    name: "Cyber",
    gradient: "from-[#d946ef] to-[#8b5cf6]",
    variant: "fast",
    reverse: true,
  },
  {
    name: "Reverse Ocean",
    gradient: "from-[#3b82f6] to-[#4f46e5]",
    variant: "ocean",
    reverse: true,
  },
];

export const BAR_COUNT = 10;

export const BAR_VARIANTS: Variants = {
  ocean: (i) => ({
    height: ["20%", "100%", "20%"],
    transition: {
      repeat: Infinity,
      duration: 1.2,
      ease: "easeInOut",
      delay: i * 0.1,
    },
  }),
  sunset: (i) => ({
    height: ["30%", "80%", "30%"],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
      delay: i * 0.2,
    },
  }),
  fast: (i) => ({
    height: ["15%", "100%", "15%"],
    transition: {
      repeat: Infinity,
      duration: 0.6,
      ease: "easeInOut",
      delay: i * 0.05,
    },
  }),
  chaos: () => ({
    height: ["10%", "90%", "30%", "100%", "50%"],
    transition: {
      repeat: Infinity,
      duration: 0.4,
      ease: "easeInOut",
      repeatType: "mirror",
    },
  }),
  pulse: () => ({
    height: ["20%", "40%", "20%"],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  }),
  stop: {
    height: "20%",
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
