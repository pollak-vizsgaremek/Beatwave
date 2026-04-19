import { Search, SlidersHorizontal } from "lucide-react";

import Input from "../Input";
import SearchFilterPanel from "./SearchFilterPanel";
import type { SearchBarProps } from "./types";

const SearchBar = ({
  searchQuery,
  isFilterOpen,
  filterRef,
  onSearch,
  onSearchKeyDown,
  onSearchQueryChange,
  onToggleFilter,
  filterPanelProps,
}: SearchBarProps) => {
  return (
    <Input
      inputClassName="w-full"
      wrapperClassName="w-full! max-w-[780px] min-w-[120px] sm:min-w-[600px] mx-1 sm:mx-2 md:mx-4 mt-0!"
      inputType="text"
      inputName="search"
      inputPlaceHolder="Keresés..."
      value={searchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      onKeyDown={onSearchKeyDown}
      iconLeft={
        <button
          type="button"
          onClick={onSearch}
          className="cursor-pointer transition-colors flex"
        >
          <Search strokeWidth={3} size={30} />
        </button>
      }
      iconRight={
        <div className="relative flex items-center" ref={filterRef}>
          <button
            type="button"
            onClick={onToggleFilter}
            className="cursor-pointer transition-colors flex hover:text-white"
          >
            <SlidersHorizontal strokeWidth={3} size={30} />
          </button>

          <SearchFilterPanel {...filterPanelProps} isOpen={isFilterOpen} />
        </div>
      }
    />
  );
};

export default SearchBar;
