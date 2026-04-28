import { useLocation } from "react-router";
import { motion, useReducedMotion } from "framer-motion";

const bubbles = [
  {
    style: {
      top: "-10%",
      left: "-10%",
      width: "50vw",
      height: "50vw",
      backgroundColor: "#4f46e5",
    },
    animate: {
      x: [0, 24, -12, 0],
      y: [0, -28, 14, 0],
      scale: [1, 1.05, 0.98, 1],
    },
    duration: 12,
    delay: 0,
  },
  {
    style: {
      top: "40%",
      right: "-5%",
      width: "40vw",
      height: "40vw",
      backgroundColor: "#3b82f6",
    },
    animate: {
      x: [0, -18, 10, 0],
      y: [0, 16, -10, 0],
      scale: [1, 1.04, 0.99, 1],
    },
    duration: 14,
    delay: 3,
  },
  {
    style: {
      bottom: "-10%",
      left: "20%",
      width: "35vw",
      height: "35vw",
      backgroundColor: "#a855f7",
    },
    animate: {
      x: [0, 14, -20, 0],
      y: [0, -12, 18, 0],
      scale: [1, 1.03, 0.97, 1],
    },
    duration: 11,
    delay: 3,
  },
];

const Background = () => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const hiddenRoutes = ["/login", "/register", "/reset-password"];

  const shouldHide = hiddenRoutes.includes(location.pathname);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 bg-linear-to-b from-[#000000] to-[#13313d] overflow-hidden">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-[72px] opacity-60 transform-gpu will-change-transform"
          style={bubble.style}
          animate={prefersReducedMotion ? undefined : bubble.animate}
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: bubble.duration,
                  delay: bubble.delay,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
};

export default Background;
