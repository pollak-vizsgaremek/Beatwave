import {
  Bell,
  UserRound,
  Search,
  Settings,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router";
import { useState, useEffect, useRef } from "react";

import ErrorToast from "./ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";

import Input from "./Input";
import api from "../utils/api";
import type { NotificationType } from "../utils/Type";
import Button from "./Button";
import { AnimatePresence, motion } from "framer-motion";

const Navigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isActiveSpotify, setIsActiveSpotify] = useState(true);
  const [isActiveSoundCloud, setIsActiveSoundCloud] = useState(false);

  // Result Types
  const [searchAlbums, setSearchAlbums] = useState(false);
  const [searchArtists, setSearchArtists] = useState(false);
  const [searchAudiobooks, setSearchAudiobooks] = useState(false);
  const [searchEpisodes, setSearchEpisodes] = useState(false);
  const [searchPlaylists, setSearchPlaylists] = useState(false);
  const [searchShows, setSearchShows] = useState(false);
  const [searchTracks, setSearchTracks] = useState(false);

  // Advanced Filters Toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Warning toast (uses shared hook)
  const { error: warningMsg, showError: showWarning } = useErrorToast();

  // Notifications
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter Availability Logic
  const canFilterArtist = searchAlbums || searchArtists || searchTracks;
  const canFilterYear = searchAlbums || searchArtists || searchTracks;
  const canFilterAlbum = searchAlbums || searchTracks;
  const canFilterGenre = searchArtists || searchTracks;
  const canFilterIsrc = searchTracks;
  const canFilterTrack = searchTracks;
  const canFilterUpc = searchAlbums;
  const canFilterTagNew = searchAlbums;
  const canFilterTagHipster = searchAlbums;

  const [yearMin, setYearMin] = useState(1955);
  const [yearMax, setYearMax] = useState(2025);

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced filter values
  const [filterArtist, setFilterArtist] = useState("");
  const [filterAlbum, setFilterAlbum] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterIsrc, setFilterIsrc] = useState("");
  const [filterUpc, setFilterUpc] = useState("");
  const [filterTagNew, setFilterTagNew] = useState(false);
  const [filterTagHipster, setFilterTagHipster] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isFilterOpen &&
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
      if (
        isDropdownOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen, isDropdownOpen, isNotificationsOpen, isMenuOpen]);

  // Fetch and poll notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data);
        setUnreadCount(
          response.data.filter((n: NotificationType) => !n.read).length,
        );
      } catch (error) {
        // Ignore API failures quietly for polling
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s
      return () => clearInterval(interval);
    }
  }, []);

  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen && unreadCount > 0) {
      try {
        await api.patch("/notifications/read");
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  const handleMenuToggle = async () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen && unreadCount > 0) {
      try {
        await api.patch("/notifications/read");
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Sync filter state from URL when navigating to /search
  useEffect(() => {
    if (location.pathname === "/search") {
      const params = new URLSearchParams(location.search);
      const q = params.get("q") || "";
      const types = (params.get("type") || "").split(",");

      if (q) setSearchQuery(q);
      setSearchAlbums(types.includes("album"));
      setSearchArtists(types.includes("artist"));
      setSearchAudiobooks(types.includes("audiobook"));
      setSearchEpisodes(types.includes("episode"));
      setSearchPlaylists(types.includes("playlist"));
      setSearchShows(types.includes("show"));
      setSearchTracks(types.includes("track"));

      // Advanced filters
      if (params.get("artist")) setFilterArtist(params.get("artist") || "");
      if (params.get("album")) setFilterAlbum(params.get("album") || "");
      if (params.get("track")) setFilterTrack(params.get("track") || "");
      if (params.get("genre")) setFilterGenre(params.get("genre") || "");
      if (params.get("isrc")) setFilterIsrc(params.get("isrc") || "");
      if (params.get("upc")) setFilterUpc(params.get("upc") || "");
      if (params.get("tag:new") === "true") setFilterTagNew(true);
      if (params.get("tag:hipster") === "true") setFilterTagHipster(true);
      if (params.get("yearMin")) setYearMin(Number(params.get("yearMin")));
      if (params.get("yearMax")) setYearMax(Number(params.get("yearMax")));
    }
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Build selected types
    const types: string[] = [];
    if (searchAlbums) types.push("album");
    if (searchArtists) types.push("artist");
    if (searchAudiobooks) types.push("audiobook");
    if (searchEpisodes) types.push("episode");
    if (searchPlaylists) types.push("playlist");
    if (searchShows) types.push("show");
    if (searchTracks) types.push("track");

    if (types.length === 0) {
      showWarning(
        "Please select at least one result type (Albums, Artists, Tracks, etc.) before searching.",
      );
      return;
    }

    const params = new URLSearchParams();
    params.set("q", searchQuery.trim());
    params.set("type", types.join(","));

    // Advanced text filters
    if (filterArtist.trim() && canFilterArtist)
      params.set("artist", filterArtist.trim());
    if (filterAlbum.trim() && canFilterAlbum)
      params.set("album", filterAlbum.trim());
    if (filterTrack.trim() && canFilterTrack)
      params.set("track", filterTrack.trim());
    if (filterGenre.trim() && canFilterGenre)
      params.set("genre", filterGenre.trim());
    if (filterIsrc.trim() && canFilterIsrc)
      params.set("isrc", filterIsrc.trim());
    if (filterUpc.trim() && canFilterUpc) params.set("upc", filterUpc.trim());

    // Tag filters
    if (filterTagNew && canFilterTagNew) params.set("tag:new", "true");
    if (filterTagHipster && canFilterTagHipster)
      params.set("tag:hipster", "true");

    // Year filter — only send if user changed from defaults
    if (canFilterYear && (yearMin !== 1955 || yearMax !== 2025)) {
      params.set("yearMin", String(yearMin));
      params.set("yearMax", String(yearMax));
    }

    setIsFilterOpen(false);
    navigate(`/search?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-linear-to-b from-accent to-accent-dark flex gap-3 sm:gap-4 md:gap-8 items-center justify-between px-4 sm:px-4 md:px-8 w-full sm:w-[95%] xl:w-3/4 mx-auto rounded-b-3xl mb-10 shadow-md shadow-black-100/30 relative py-5 sm:py-3 min-h-[92px] sm:min-h-[68px]">
      <Link
        to="/home"
        className="text-white text-lg sm:text-xl md:text-2xl font-bold shrink-0"
      >
        Beatwave
      </Link>
      <Link
        to="/discussion"
        className="hidden md:block text-white text-sm sm:text-base md:text-lg font-medium shrink-0"
      >
        Discussion
      </Link>
      <Input
        inputClassName="w-full"
        wrapperClassName="w-full! max-w-[600px] min-w-[120px] sm:min-w-[280px] mx-1 sm:mx-2 md:mx-4 mt-0!"
        inputType="text"
        inputName="search"
        inputPlaceHolder="Keresés..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        iconLeft={
          <button
            type="button"
            onClick={handleSearch}
            className={`cursor-pointer transition-colors flex`}
          >
            <Search strokeWidth={3} size={30} />
          </button>
        }
        iconRight={
          <div className="relative flex items-center" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`cursor-pointer transition-colors flex hover:text-white`}
            >
              <SlidersHorizontal strokeWidth={3} size={30} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-12 mt-2 -right-4 sm:right-0 bg-accent p-4 md:p-6 rounded-3xl shadow-2xl border border-accent-dark z-50 flex flex-col gap-6 w-[280px] sm:w-[450px] md:w-[500px] max-w-[95vw] max-h-[75vh] overflow-y-auto no-scrollbar cursor-default">
                <div className="flex flex-row justify-between gap-4">
                  <button
                    onClick={() => {
                      setIsActiveSpotify(!isActiveSpotify);
                      if (!isActiveSpotify && isActiveSoundCloud) {
                        setIsActiveSoundCloud(false);
                      }
                    }}
                    className={`flex-1 cursor-pointer bg-spotify-green p-2 sm:p-3 rounded-xl text-black transition-all text-sm sm:text-base font-medium ${
                      isActiveSpotify
                        ? "scale-105 shadow-md border-2 border-white/20"
                        : "bg-gray-600! border-2 border-transparent hover:bg-gray-500!"
                    }`}
                  >
                    Spotify
                  </button>
                  <button
                    onClick={() => {
                      if (isActiveSpotify && !isActiveSoundCloud) {
                        setIsActiveSpotify(false);
                      }
                      setIsActiveSoundCloud(!isActiveSoundCloud);
                    }}
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
                  <div className="flex flex-row flex-wrap gap-x-6">
                    <Input
                      inputName="albums_filter"
                      inputType="checkbox"
                      labelTitle="Albums"
                      checked={searchAlbums}
                      onChange={() => setSearchAlbums(!searchAlbums)}
                    />
                    <Input
                      inputName="artists_filter"
                      inputType="checkbox"
                      labelTitle="Artists"
                      checked={searchArtists}
                      onChange={() => setSearchArtists(!searchArtists)}
                    />
                    <Input
                      inputName="audiobooks_filter"
                      inputType="checkbox"
                      labelTitle="Audiobooks"
                      checked={searchAudiobooks}
                      onChange={() => setSearchAudiobooks(!searchAudiobooks)}
                    />
                    <Input
                      inputName="episodes_filter"
                      inputType="checkbox"
                      labelTitle="Episodes"
                      checked={searchEpisodes}
                      onChange={() => setSearchEpisodes(!searchEpisodes)}
                    />
                    <Input
                      inputName="playlists_filter"
                      inputType="checkbox"
                      labelTitle="Playlists"
                      checked={searchPlaylists}
                      onChange={() => setSearchPlaylists(!searchPlaylists)}
                    />
                    <Input
                      inputName="shows_filter"
                      inputType="checkbox"
                      labelTitle="Shows"
                      checked={searchShows}
                      onChange={() => setSearchShows(!searchShows)}
                    />
                    <Input
                      inputName="tracks_filter"
                      inputType="checkbox"
                      labelTitle="Tracks"
                      checked={searchTracks}
                      onChange={() => setSearchTracks(!searchTracks)}
                    />
                  </div>
                </div>

                <div
                  className="border-t border-accent-dark pt-4 pb-2 cursor-pointer group"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
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
                        <Input
                          inputName="filterArtist"
                          inputType="text"
                          inputPlaceHolder="Artist Name"
                          disabled={!canFilterArtist}
                          value={filterArtist}
                          onChange={(e) => setFilterArtist(e.target.value)}
                        />
                        <Input
                          inputName="filterAlbum"
                          inputType="text"
                          inputPlaceHolder="Album Name"
                          disabled={!canFilterAlbum}
                          value={filterAlbum}
                          onChange={(e) => setFilterAlbum(e.target.value)}
                        />
                        <Input
                          inputName="filterTrack"
                          inputType="text"
                          inputPlaceHolder="Track Name"
                          disabled={!canFilterTrack}
                          value={filterTrack}
                          onChange={(e) => setFilterTrack(e.target.value)}
                        />
                        <Input
                          inputName="filterGenre"
                          inputType="text"
                          inputPlaceHolder="Genre"
                          disabled={!canFilterGenre}
                          value={filterGenre}
                          onChange={(e) => setFilterGenre(e.target.value)}
                        />
                        <Input
                          inputName="filterIsrc"
                          inputType="text"
                          inputPlaceHolder="ISRC"
                          disabled={!canFilterIsrc}
                          value={filterIsrc}
                          onChange={(e) => setFilterIsrc(e.target.value)}
                        />
                        <Input
                          inputName="filterUpc"
                          inputType="text"
                          inputPlaceHolder="UPC"
                          disabled={!canFilterUpc}
                          value={filterUpc}
                          onChange={(e) => setFilterUpc(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-row flex-wrap gap-x-6 gap-y-2 mt-4">
                        <Input
                          inputName="filterTagNew"
                          inputType="checkbox"
                          labelTitle="Tag: New"
                          disabled={!canFilterTagNew}
                          checked={filterTagNew}
                          onChange={() => setFilterTagNew(!filterTagNew)}
                        />
                        <Input
                          inputName="filterTagHipster"
                          inputType="checkbox"
                          labelTitle="Tag: Hipster"
                          disabled={!canFilterTagHipster}
                          checked={filterTagHipster}
                          onChange={() =>
                            setFilterTagHipster(!filterTagHipster)
                          }
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <h3 className="text-white text-sm font-semibold mb-3">
                        Year Filter
                      </h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-white text-sm font-medium">
                          <span>{yearMin}</span>
                          <span>{yearMax}</span>
                        </div>
                        <div className="flex flex-col gap-2 relative">
                          <input
                            type="range"
                            min="1950"
                            max="2025"
                            value={yearMin}
                            onChange={(e) =>
                              setYearMin(
                                Math.min(Number(e.target.value), yearMax),
                              )
                            }
                            disabled={!canFilterYear}
                            className={`w-full accent-spotify-green cursor-pointer ${
                              !canFilterYear
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                          <input
                            type="range"
                            min="1950"
                            max="2025"
                            value={yearMax}
                            onChange={(e) =>
                              setYearMax(
                                Math.max(Number(e.target.value), yearMin),
                              )
                            }
                            disabled={!canFilterYear}
                            className={`w-full accent-spotify-green cursor-pointer ${
                              !canFilterYear
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

      <div className="hidden md:flex gap-2 sm:gap-4 md:gap-5 items-center shrink-0">
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={handleOpenNotifications}
            className="text-white hover:opacity-80 transition-opacity cursor-pointer relative mt-1 mr-2"
          >
            <Bell strokeWidth={2.5} size={28} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#1A1E23]"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark max-h-96 overflow-y-auto no-scrollbar z-50">
              <div className="p-3 border-b border-accent-dark sticky top-0 bg-accent z-10 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">Notifications</h3>
              </div>
              <div className="flex flex-col">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.link) {
                            handleNavigate(notif.link);
                            setIsNotificationsOpen(false);
                          }
                        }}
                        className={`p-3 border-b border-accent-dark/50 last:border-0 hover:bg-accent-dark/30 transition-colors cursor-pointer ${
                          !notif.read ? "bg-accent-dark/60" : "opacity-60"
                        }`}
                      >
                        <p
                          className={`text-[13px] leading-snug ${
                            !notif.read ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {notif.message}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-center">
                      <Button
                        labelTitle="Delete Notif"
                        onClick={async () => {
                          try {
                            await api.delete("/notifications/read");
                            setNotifications((prev) =>
                              prev.filter((n) => !n.read),
                            );
                          } catch (err) {
                            console.error(
                              "Failed to delete read notifications:",
                              err,
                            );
                          }
                        }}
                        className="mt-0! p-4! w-full rounded-lg!"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            <UserRound strokeWidth={3} size={35} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-accent rounded-lg shadow-lg shadow-black-100/50 border border-accent-dark">
              <button
                onClick={() => handleNavigate("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-accent-dark transition-colors first:rounded-t-lg border-b border-accent-dark cursor-pointer"
              >
                <Settings size={18} />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 transition-colors last:rounded-b-lg cursor-pointer"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleMenuToggle}
        className="md:hidden text-white hover:opacity-80 transition-opacity cursor-pointer"
      >
        <Menu size={30} />
      </button>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-80 bg-accent shadow-lg z-50 flex flex-col justify-between p-6"
          >
            {/* Top section */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute -top-2 -right-2 text-white hover:opacity-80 bg-accent-dark/50 rounded-full p-2"
              >
                <X size={32} />
              </button>

              <Link
                to="/discussion"
                onClick={() => setIsMenuOpen(false)}
                className="text-white text-xl mb-6 hover:opacity-80 block font-medium"
              >
                Discussion
              </Link>

              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-4">
                  Notifications
                </h3>
                <div className="max-h-48 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center text-gray-400 text-base">
                      No new notifications
                    </div>
                  ) : (
                    <>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.link) {
                              navigate(notif.link);
                              setIsMenuOpen(false);
                            }
                          }}
                          className={`p-3 border-b border-accent-dark/50 last:border-0 hover:bg-accent-dark/30 transition-colors cursor-pointer rounded-lg mb-2 ${
                            !notif.read ? "bg-accent-dark/60" : "opacity-60"
                          }`}
                        >
                          <p
                            className={`text-sm leading-relaxed ${
                              !notif.read ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {notif.message}
                          </p>
                        </div>
                      ))}
                      <div className="p-3">
                        <Button
                          labelTitle="Delete Read"
                          onClick={async () => {
                            try {
                              await api.delete("/notifications/read");
                              setNotifications((prev) =>
                                prev.filter((n) => !n.read),
                              );
                            } catch (err) {
                              console.error(
                                "Failed to delete read notifications:",
                                err,
                              );
                            }
                          }}
                          className="w-full! text-base! py-3!"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  navigate("/profile");
                  setIsMenuOpen(false);
                }}
                className="text-white text-xl mb-6 text-left hover:opacity-80 w-full py-3 px-4 rounded-lg hover:bg-accent-dark/30 transition-colors font-medium"
              >
                Profile
              </button>
            </div>

            {/* Bottom section - Log Out button */}
            <div className="border-t border-accent-dark/50 pt-6">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="text-red-400 text-xl text-left hover:text-red-300 w-full py-4 px-4 rounded-lg hover:bg-red-600/30 transition-colors font-medium"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ErrorToast error={warningMsg} />
    </div>
  );
};

export default Navigation;
