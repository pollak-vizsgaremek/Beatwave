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
      inputClassName="w-full h-10 sm:h-11 text-sm sm:text-base"
      wrapperClassName="w-full! max-w-[780px] min-w-0 mx-0.5 sm:mx-2 md:mx-4 mt-0!"
      inputType="text"
      inputName="search"
      inputPlaceHolder="Search..."
      value={searchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      onKeyDown={onSearchKeyDown}
      iconLeft={
        <button
          type="button"
          onClick={onSearch}
          className="cursor-pointer transition-colors flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9"
        >
          <Search strokeWidth={2.5} size={22} className="sm:hidden" />
          <Search strokeWidth={2.5} size={26} className="hidden sm:block" />
        </button>
      }
      iconRight={
        <div
          className="relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9"
          ref={filterRef}
        >
          <button
            type="button"
            onClick={onToggleFilter}
            className="cursor-pointer transition-colors flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 hover:text-white"
          >
            <SlidersHorizontal strokeWidth={2.5} size={22} className="sm:hidden" />
            <SlidersHorizontal
              strokeWidth={2.5}
              size={26}
              className="hidden sm:block"
            />
          </button>

          <SearchFilterPanel {...filterPanelProps} isOpen={isFilterOpen} />
        </div>
      }
    />
  );
};

export default SearchBar;
