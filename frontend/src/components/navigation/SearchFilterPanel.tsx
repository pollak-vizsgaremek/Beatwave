import { ChevronDown, ChevronUp } from "lucide-react";

import Input from "../Input";
import type {
  SearchFilterPanelProps,
  SearchFilterState,
  SearchTypeState,
} from "./types";

const resultTypeOptions: Array<{
  key: keyof SearchTypeState;
  inputName: string;
  label: string;
}> = [
  { key: "albums", inputName: "albums_filter", label: "Albums" },
  { key: "artists", inputName: "artists_filter", label: "Artists" },
  { key: "audiobooks", inputName: "audiobooks_filter", label: "Audiobooks" },
  { key: "episodes", inputName: "episodes_filter", label: "Episodes" },
  { key: "playlists", inputName: "playlists_filter", label: "Playlists" },
  { key: "shows", inputName: "shows_filter", label: "Shows" },
  { key: "tracks", inputName: "tracks_filter", label: "Tracks" },
];

const fieldFilterOptions: Array<{
  key: keyof Pick<
    SearchFilterState,
    "artist" | "album" | "track" | "genre" | "isrc" | "upc"
  >;
  inputName: string;
  placeholder: string;
  enabled: keyof SearchFilterPanelProps["availability"];
}> = [
  {
    key: "artist",
    inputName: "filterArtist",
    placeholder: "Artist Name",
    enabled: "artist",
  },
  {
    key: "album",
    inputName: "filterAlbum",
    placeholder: "Album Name",
    enabled: "album",
  },
  {
    key: "track",
    inputName: "filterTrack",
    placeholder: "Track Name",
    enabled: "track",
  },
  {
    key: "genre",
    inputName: "filterGenre",
    placeholder: "Genre",
    enabled: "genre",
  },
  {
    key: "isrc",
    inputName: "filterIsrc",
    placeholder: "ISRC",
    enabled: "isrc",
  },
  {
    key: "upc",
    inputName: "filterUpc",
    placeholder: "UPC",
    enabled: "upc",
  },
];

const SearchFilterPanel = ({
  isOpen,
  isActiveSpotify,
  isActiveSoundCloud,
  showAdvancedFilters,
  searchTypes,
  setSearchTypes,
  filters,
  setFilters,
  availability,
  onToggleAdvancedFilters,
  onToggleSpotify,
  onToggleSoundCloud,
}: SearchFilterPanelProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute top-12 mt-2 -right-4 sm:right-0 bg-accent p-4 md:p-6 rounded-3xl shadow-2xl border border-accent-dark z-50 flex flex-col gap-6 w-[280px] sm:w-[450px] md:w-[500px] max-w-[95vw] max-h-[75vh] overflow-y-auto no-scrollbar cursor-default">
      <div className="flex flex-row justify-between gap-4">
        <button
          type="button"
          onClick={onToggleSpotify}
          className={`flex-1 cursor-pointer bg-spotify-green p-2 sm:p-3 rounded-xl text-black transition-all text-sm sm:text-base font-medium ${
            isActiveSpotify
              ? "scale-105 shadow-md border-2 border-white/20"
              : "bg-gray-600! border-2 border-transparent hover:bg-gray-500!"
          }`}
        >
          Spotify
        </button>
        <button
          type="button"
          onClick={onToggleSoundCloud}
          className={`flex-1 cursor-pointer bg-soundcloud-orange p-2 sm:p-3 rounded-xl text-white transition-all text-sm sm:text-base font-medium ${
            isActiveSoundCloud
              ? "scale-105 shadow-md border-2 border-white/20"
              : "bg-gray-600! text-gray-300! border-2 border-transparent hover:bg-gray-500! hover:text-white!"
          }`}
        >
          SoundCloud
        </button>
      </div>

      <div className="border-t border-accent-dark pt-4">
        <h3 className="text-white text-sm font-semibold mb-2">
          Search For (Result Types){" "}
          <span className="text-red-500 ml-1">*Required</span>
        </h3>
        <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
          {resultTypeOptions.map((option) => (
            <Input
              key={option.key}
              inputName={option.inputName}
              inputType="checkbox"
              labelTitle={option.label}
              checked={searchTypes[option.key]}
              onChange={() => setSearchTypes[option.key]((prev) => !prev)}
            />
          ))}
        </div>
      </div>

      <div
        className="border-t border-accent-dark pt-4 pb-2 cursor-pointer group"
        onClick={onToggleAdvancedFilters}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-semibold group-hover:text-spotify-green transition-colors">
            Advanced Support Filters (Optional)
          </h3>
          {showAdvancedFilters ? (
            <ChevronUp
              size={20}
              className="text-white group-hover:text-spotify-green transition-colors"
            />
          ) : (
            <ChevronDown
              size={20}
              className="text-white group-hover:text-spotify-green transition-colors"
            />
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">
              Field Filters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {fieldFilterOptions.map((option) => (
                <Input
                  key={option.key}
                  inputName={option.inputName}
                  inputType="text"
                  inputPlaceHolder={option.placeholder}
                  disabled={!availability[option.enabled]}
                  value={filters[option.key]}
                  onChange={(e) => setFilters[option.key](e.target.value)}
                />
              ))}
            </div>
            <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 mt-4">
              <Input
                inputName="filterTagNew"
                inputType="checkbox"
                labelTitle="Tag: New"
                disabled={!availability.tagNew}
                checked={filters.tagNew}
                onChange={() => setFilters.tagNew((prev) => !prev)}
              />
              <Input
                inputName="filterTagHipster"
                inputType="checkbox"
                labelTitle="Tag: Hipster"
                disabled={!availability.tagHipster}
                checked={filters.tagHipster}
                onChange={() => setFilters.tagHipster((prev) => !prev)}
              />
            </div>
          </div>

          <div className="mb-2">
            <h3 className="text-white text-sm font-semibold mb-3">
              Year Filter
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-white text-sm font-medium">
                <span>{filters.yearMin}</span>
                <span>{filters.yearMax}</span>
              </div>
              <div className="flex flex-col gap-2 relative">
                <input
                  type="range"
                  min="1950"
                  max="2025"
                  value={filters.yearMin}
                  onChange={(e) =>
                    setFilters.yearMin(
                      Math.min(Number(e.target.value), filters.yearMax),
                    )
                  }
                  disabled={!availability.year}
                  className={`w-full accent-spotify-green cursor-pointer ${
                    !availability.year ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                <input
                  type="range"
                  min="1950"
                  max="2025"
                  value={filters.yearMax}
                  onChange={(e) =>
                    setFilters.yearMax(
                      Math.max(Number(e.target.value), filters.yearMin),
                    )
                  }
                  disabled={!availability.year}
                  className={`w-full accent-spotify-green cursor-pointer ${
                    !availability.year ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilterPanel;
