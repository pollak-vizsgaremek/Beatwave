import { useRef } from "react";
import Card from "./TopCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TopListProps = { list: { name: string; image: string }[]; title: string };

const TopList = ({ list, title }: TopListProps) => {
  const topListScroll = useRef<HTMLDivElement | null>(null);
  const handleNav = (direction: "left" | "right") => {
    if (!topListScroll.current) return;
    const scrollAmount = 250;
    topListScroll.current.scrollLeft +=
      direction === "left" ? -scrollAmount : scrollAmount;
  };

  return (
    <div className="flex flex-col">
      <div className='flex flex-row justify-center items-center'>
        <h2 className="text-3xl font-semibold start w-1/2">{title}</h2>
        <div className='flex items-center w-1/2 justify-end mr-30'>
          <button type="button" onClick={() => handleNav("left")}>
            <ChevronLeft size={60} />
          </button>
          <button type="button" onClick={() => handleNav("right")}>
            <ChevronRight size={60} />
          </button>
        </div>
      </div>
      <div
        className="flex flex-row overflow-auto overscroll-auto ml-6 scroll-smooth no-scrollbar"
        ref={topListScroll}
      >
        {list.map((list, i) => (
          <Card key={i} name={list.name} image={list.image} placing={i + 1} />
        ))}
      </div>
    </div>
  );
};

export default TopList;
