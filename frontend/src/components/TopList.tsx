import { useRef, useState, useEffect } from "react";
import Card from "./TopCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TopListProps = { list: { name: string; image: string }[]; title: string };

const TopList = ({ list, title }: TopListProps) => {
  const topListScroll = useRef<HTMLDivElement | null>(null);
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

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-center items-center">
        <h2 className="text-3xl font-semibold start w-1/2 whitespace-nowrap">{title}</h2>
        <div className="flex items-center w-1/2 justify-end sm:mr-0 md:mr-30">
          <button
            type="button"
            onClick={() => handleNav("left")}
            disabled={!canScrollLeft}
            className={`transition-colors ${canScrollLeft ? "cursor-pointer hover:text-white" : "text-gray-600"}`}
          >
            <ChevronLeft size={60} />
          </button>
          <button
            type="button"
            onClick={() => handleNav("right")}
            disabled={!canScrollRight}
            className={`transition-colors ${canScrollRight ? "cursor-pointer hover:text-white" : "text-gray-600"}`}
          >
            <ChevronRight size={60} />
          </button>
        </div>
      </div>
      <div
        className="flex flex-row overflow-auto overscroll-auto ml-6 scroll-smooth no-scrollbar"
        ref={topListScroll}
        onScroll={handleScroll}
      >
        {list.map((list, i) => (
          <Card key={i} name={list.name} image={list.image} placing={i + 1} />
        ))}
      </div>
    </div>
  );
};

export default TopList;
