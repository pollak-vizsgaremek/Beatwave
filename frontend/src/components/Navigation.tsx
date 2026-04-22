import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import ErrorToast from "./ErrorToast";
import MobileMenu from "./navigation/MobileMenu";
import NavLinks from "./navigation/NavLinks";
import NotificationsMenu from "./navigation/NotificationsMenu";
import SearchBar from "./navigation/SearchBar";
import UserMenu from "./navigation/UserMenu";
import type {
  SearchAvailability,
  SearchFilterSetters,
  SearchFilterState,
  SearchTypeSetters,
  SearchTypeState,
} from "./navigation/types";
import api from "../utils/api";
import { useSession } from "../context/SessionContext";
import type { NotificationType } from "../utils/Type";
import { useErrorToast } from "../utils/useErrorToast";

const defaultYearMin = 1955;
const defaultYearMax = 2025;

const searchTypeParamMap: Record<keyof SearchTypeState, string> = {
  albums: "album",
  artists: "artist",
  audiobooks: "audiobook",
  episodes: "episode",
  playlists: "playlist",
  shows: "show",
  tracks: "track",
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser } = useSession();
  const isDiscussionRoute = location.pathname.startsWith("/discussion");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isActiveSpotify, setIsActiveSpotify] = useState(true);
  const [isActiveSoundCloud, setIsActiveSoundCloud] = useState(false);

  const [searchAlbums, setSearchAlbums] = useState(false);
  const [searchArtists, setSearchArtists] = useState(false);
  const [searchAudiobooks, setSearchAudiobooks] = useState(false);
  const [searchEpisodes, setSearchEpisodes] = useState(false);
  const [searchPlaylists, setSearchPlaylists] = useState(false);
  const [searchShows, setSearchShows] = useState(false);
  const [searchTracks, setSearchTracks] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [filterAlbum, setFilterAlbum] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterIsrc, setFilterIsrc] = useState("");
  const [filterUpc, setFilterUpc] = useState("");
  const [filterTagNew, setFilterTagNew] = useState(false);
  const [filterTagHipster, setFilterTagHipster] = useState(false);
  const [yearMin, setYearMin] = useState(defaultYearMin);
  const [yearMax, setYearMax] = useState(defaultYearMax);

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { error: warningMsg, showError: showWarning } = useErrorToast();

  const filterRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const searchTypes: SearchTypeState = {
    albums: searchAlbums,
    artists: searchArtists,
    audiobooks: searchAudiobooks,
    episodes: searchEpisodes,
    playlists: searchPlaylists,
    shows: searchShows,
    tracks: searchTracks,
  };

  const searchTypeSetters: SearchTypeSetters = {
    albums: setSearchAlbums,
    artists: setSearchArtists,
    audiobooks: setSearchAudiobooks,
    episodes: setSearchEpisodes,
    playlists: setSearchPlaylists,
    shows: setSearchShows,
    tracks: setSearchTracks,
  };

  const filters: SearchFilterState = {
    artist: filterArtist,
    album: filterAlbum,
    track: filterTrack,
    genre: filterGenre,
    isrc: filterIsrc,
    upc: filterUpc,
    tagNew: filterTagNew,
    tagHipster: filterTagHipster,
    yearMin,
    yearMax,
  };

  const filterSetters: SearchFilterSetters = {
    artist: setFilterArtist,
    album: setFilterAlbum,
    track: setFilterTrack,
    genre: setFilterGenre,
    isrc: setFilterIsrc,
    upc: setFilterUpc,
    tagNew: setFilterTagNew,
    tagHipster: setFilterTagHipster,
    yearMin: setYearMin,
    yearMax: setYearMax,
  };

  const availability: SearchAvailability = {
    artist: searchAlbums || searchArtists || searchTracks,
    year: searchAlbums || searchArtists || searchTracks,
    album: searchAlbums || searchTracks,
    genre: searchArtists || searchTracks,
    isrc: searchTracks,
    track: searchTracks,
    upc: searchAlbums,
    tagNew: searchAlbums,
    tagHipster: searchAlbums,
  };

  const canAccessAdminPanel =
    currentUser?.role === "ADMIN" || currentUser?.role === "MODERATOR";

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
  }, [isDropdownOpen, isFilterOpen, isMenuOpen, isNotificationsOpen]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications");
        setNotifications(response.data);
        setUnreadCount(
          response.data.filter(
            (notification: NotificationType) => !notification.read,
          ).length,
        );
      } catch {
        // Ignore polling failures quietly.
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/search") {
      return;
    }

    const params = new URLSearchParams(location.search);
    const rawTypes = params.get("type") || "track";
    const types = rawTypes.split(",");

    setSearchQuery(params.get("q") || "");
    setSearchAlbums(types.includes("album"));
    setSearchArtists(types.includes("artist"));
    setSearchAudiobooks(types.includes("audiobook"));
    setSearchEpisodes(types.includes("episode"));
    setSearchPlaylists(types.includes("playlist"));
    setSearchShows(types.includes("show"));
    setSearchTracks(types.includes("track"));

    setFilterArtist(params.get("artist") || "");
    setFilterAlbum(params.get("album") || "");
    setFilterTrack(params.get("track") || "");
    setFilterGenre(params.get("genre") || "");
    setFilterIsrc(params.get("isrc") || "");
    setFilterUpc(params.get("upc") || "");
    setFilterTagNew(params.get("tag:new") === "true");
    setFilterTagHipster(params.get("tag:hipster") === "true");
    setYearMin(Number(params.get("yearMin") || defaultYearMin));
    setYearMax(Number(params.get("yearMax") || defaultYearMax));
  }, [location.pathname, location.search]);

  const closeAllMenus = () => {
    setIsDropdownOpen(false);
    setIsFilterOpen(false);
    setIsNotificationsOpen(false);
    setIsMenuOpen(false);
  };

  const clearLocalSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("spotifyTimeRange");

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("likedPosts:")) {
        localStorage.removeItem(key);
      }
    });
  };

  const markNotificationsAsRead = async () => {
    try {
      await api.patch("/notifications/read");
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true })),
      );
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  const deleteReadNotifications = async () => {
    try {
      await api.delete("/notifications/read");
      setNotifications((prev) =>
        prev.filter((notification) => !notification.read),
      );
    } catch (error) {
      console.error("Failed to delete read notifications:", error);
    }
  };

  const handleOpenNotifications = async () => {
    const nextOpen = !isNotificationsOpen;
    setIsNotificationsOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      await markNotificationsAsRead();
    }
  };

  const handleMenuToggle = async () => {
    const nextOpen = !isMenuOpen;
    setIsMenuOpen(nextOpen);

    if (nextOpen && unreadCount > 0) {
      await markNotificationsAsRead();
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Logout API call failed, clearing local session anyway.", error);
      }
    } finally {
      clearLocalSession();
      setCurrentUser(null);
      closeAllMenus();
      navigate("/login");
    }
  };

  const handleNavigate = (path: string) => {
    closeAllMenus();
    navigate(path);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      return;
    }

    const selectedTypes = (
      Object.entries(searchTypes) as Array<[keyof SearchTypeState, boolean]>
    )
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => searchTypeParamMap[key]);

    if (selectedTypes.length === 0) {
      showWarning(
        "Please select at least one result type (Albums, Artists, Tracks, etc.) before searching.",
      );
      return;
    }

    const params = new URLSearchParams();
    params.set("q", searchQuery.trim());
    params.set("type", selectedTypes.join(","));

    if (filterArtist.trim() && availability.artist) {
      params.set("artist", filterArtist.trim());
    }

    if (filterAlbum.trim() && availability.album) {
      params.set("album", filterAlbum.trim());
    }

    if (filterTrack.trim() && availability.track) {
      params.set("track", filterTrack.trim());
    }

    if (filterGenre.trim() && availability.genre) {
      params.set("genre", filterGenre.trim());
    }

    if (filterIsrc.trim() && availability.isrc) {
      params.set("isrc", filterIsrc.trim());
    }

    if (filterUpc.trim() && availability.upc) {
      params.set("upc", filterUpc.trim());
    }

    if (filterTagNew && availability.tagNew) {
      params.set("tag:new", "true");
    }

    if (filterTagHipster && availability.tagHipster) {
      params.set("tag:hipster", "true");
    }

    if (
      availability.year &&
      (yearMin !== defaultYearMin || yearMax !== defaultYearMax)
    ) {
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
    <div className="bg-linear-to-b from-accent to-accent-dark flex gap-3 sm:gap-4 md:gap-8 items-center justify-between px-4 sm:px-4 md:px-8 w-full sm:w-[95%] xl:w-3/4 mx-auto rounded-b-3xl mb-10 shadow-md shadow-black-100/30 relative py-5 sm:py-3 min-h-[92px] sm:min-h-[68px] overflow-x-clip">
      <div className="flex flex-1 min-w-0 items-center justify-start">
        <NavLinks />
      </div>

      {!isDiscussionRoute ? (
        <div className="flex flex-1 min-w-0 items-center justify-center">
          <SearchBar
            searchQuery={searchQuery}
            isFilterOpen={isFilterOpen}
            filterRef={filterRef}
            onSearch={handleSearch}
            onSearchKeyDown={handleSearchKeyDown}
            onSearchQueryChange={setSearchQuery}
            onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
            filterPanelProps={{
              isOpen: isFilterOpen,
              isActiveSpotify,
              isActiveSoundCloud,
              showAdvancedFilters,
              searchTypes,
              setSearchTypes: searchTypeSetters,
              filters,
              setFilters: filterSetters,
              availability,
              onToggleAdvancedFilters: () =>
                setShowAdvancedFilters((prev) => !prev),
              onToggleSpotify: () => {
                setIsActiveSpotify((prev) => !prev);
                if (!isActiveSpotify && isActiveSoundCloud) {
                  setIsActiveSoundCloud(false);
                }
              },
              onToggleSoundCloud: () => {
                if (isActiveSpotify && !isActiveSoundCloud) {
                  setIsActiveSpotify(false);
                }
                setIsActiveSoundCloud((prev) => !prev);
              },
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 min-w-0 items-center justify-center" />
      )}

      <div className="hidden md:flex flex-1 min-w-0 gap-2 sm:gap-4 md:gap-5 items-center justify-end">
        <NotificationsMenu
          notificationsRef={notificationsRef}
          isOpen={isNotificationsOpen}
          unreadCount={unreadCount}
          notifications={notifications}
          onToggle={handleOpenNotifications}
          onSelectNotification={(link) => {
            if (link) {
              handleNavigate(link);
            }
          }}
          onDeleteRead={deleteReadNotifications}
        />

        <UserMenu
          profileRef={profileRef}
          isOpen={isDropdownOpen}
          canAccessAdminPanel={canAccessAdminPanel}
          onToggle={() => setIsDropdownOpen((prev) => !prev)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </div>

      <button
        type="button"
        onClick={handleMenuToggle}
        className="md:hidden text-white hover:opacity-80 transition-opacity cursor-pointer"
      >
        <Menu size={30} />
      </button>

      <MobileMenu
        menuRef={menuRef}
        isOpen={isMenuOpen}
        notifications={notifications}
        canAccessAdminPanel={canAccessAdminPanel}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onDeleteRead={deleteReadNotifications}
      />

      <ErrorToast error={warningMsg} />
    </div>
  );
};

export default Navigation;
