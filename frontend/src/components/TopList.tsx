import { useRef, useState, useEffect } from "react";
import Card from "./TopCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type TopListProps = { list: { name: string; image: string }[]; title: string };

const TopList = ({ list, title }: TopListProps) => {
  const topListScroll = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (topListScroll.current) {
      const { scrollLeft, scrollWidth, clientWidth } = topListScroll.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [list]);

  const handleNav = (direction: "left" | "right") => {
    if (!topListScroll.current) return;
    const scrollAmount = 250;
    topListScroll.current.scrollLeft +=
      direction === "left" ? -scrollAmount : scrollAmount;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!topListScroll.current) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startScrollLeft.current = topListScroll.current.scrollLeft;
    topListScroll.current.style.cursor = "grabbing";
    topListScroll.current.style.scrollBehavior = "auto";
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !topListScroll.current) return;
    e.preventDefault();
    const walk = (e.clientX - startX.current) * 1.15;
    topListScroll.current.scrollLeft = startScrollLeft.current - walk;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    if (topListScroll.current) {
      topListScroll.current.style.cursor = "grab";
      topListScroll.current.style.scrollBehavior = "smooth";
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold w-full sm:w-1/2 whitespace-normal break-words">
          {title}
        </h2>
        <div className="flex items-center w-full sm:w-1/2 justify-start sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => handleNav("left")}
            disabled={!canScrollLeft}
            className={`hidden sm:inline-flex transition-colors ${
              canScrollLeft
                ? "cursor-pointer hover:text-white"
                : "text-gray-600"
            }`}
          >
            <motion.div whileTap={{ scale: 0.8 }}>
              <ChevronLeft size={60} />
            </motion.div>
          </button>
          <button
            type="button"
            onClick={() => handleNav("right")}
            disabled={!canScrollRight}
            className={`hidden sm:inline-flex transition-colors ${
              canScrollRight
                ? "cursor-pointer hover:text-white"
                : "text-gray-600"
            }`}
          >
            <motion.div whileTap={{ scale: 0.8 }}>
              <ChevronRight size={60} />
            </motion.div>
          </button>
        </div>
      </div>
      <div
        className="flex flex-row overflow-x-auto overflow-y-hidden sm:overflow-auto overscroll-x-contain ml-0 sm:ml-6 no-scrollbar cursor-grab select-none active:cursor-grabbing"
        ref={topListScroll}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: "pan-y" }}
      >
        {list.map((list, i) => (
          <Card key={i} name={list.name} image={list.image} placing={i + 1} />
        ))}
      </div>
    </div>
  );
};

export default TopList;
