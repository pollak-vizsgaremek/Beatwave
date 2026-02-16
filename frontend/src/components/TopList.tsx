import { useRef } from "react";
import Card from "./Card";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TopListProps = { list: { name: string; image: string }[]; title: string };

const TopList = ({ list, title }: TopListProps) => {
  const navRef = useRef<HTMLDivElement | null>(null);
  const handleNav = (direction: "left" | "right") => {
    if (!navRef.current) return;
    const scrollAmount = 250;
    navRef.current.scrollLeft +=
      direction === "left" ? -scrollAmount : scrollAmount;
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-semibold mb-5">{title}</h2>
      <div className="self-end mr-30">
        <button type="button" onClick={() => handleNav("left")}>
          <ChevronLeft size={50} />
        </button>
        <button type="button" onClick={() => handleNav("right")}>
          <ChevronRight size={50} />
        </button>
      </div>
      <div
        className="flex flex-row overflow-auto overscroll-auto ml-6 scroll-smooth no-scrollbar"
        ref={navRef}
      >
        {list.map((list, i) => (
          <Card key={i} name={list.name} image={list.image} placing={i + 1} />
        ))}
      </div>
    </div>
  );
};

export default TopList;
