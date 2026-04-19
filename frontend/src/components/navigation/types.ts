import type { Dispatch, RefObject, SetStateAction } from "react";

import type { NotificationType } from "../../utils/Type";

export interface SearchTypeState {
  albums: boolean;
  artists: boolean;
  audiobooks: boolean;
  episodes: boolean;
  playlists: boolean;
  shows: boolean;
  tracks: boolean;
}

export interface SearchTypeSetters {
  albums: Dispatch<SetStateAction<boolean>>;
  artists: Dispatch<SetStateAction<boolean>>;
  audiobooks: Dispatch<SetStateAction<boolean>>;
  episodes: Dispatch<SetStateAction<boolean>>;
  playlists: Dispatch<SetStateAction<boolean>>;
  shows: Dispatch<SetStateAction<boolean>>;
  tracks: Dispatch<SetStateAction<boolean>>;
}

export interface SearchFilterState {
  artist: string;
  album: string;
  track: string;
  genre: string;
  isrc: string;
  upc: string;
  tagNew: boolean;
  tagHipster: boolean;
  yearMin: number;
  yearMax: number;
}

export interface SearchFilterSetters {
  artist: Dispatch<SetStateAction<string>>;
  album: Dispatch<SetStateAction<string>>;
  track: Dispatch<SetStateAction<string>>;
  genre: Dispatch<SetStateAction<string>>;
  isrc: Dispatch<SetStateAction<string>>;
  upc: Dispatch<SetStateAction<string>>;
  tagNew: Dispatch<SetStateAction<boolean>>;
  tagHipster: Dispatch<SetStateAction<boolean>>;
  yearMin: Dispatch<SetStateAction<number>>;
  yearMax: Dispatch<SetStateAction<number>>;
}

export interface SearchAvailability {
  artist: boolean;
  year: boolean;
  album: boolean;
  genre: boolean;
  isrc: boolean;
  track: boolean;
  upc: boolean;
  tagNew: boolean;
  tagHipster: boolean;
}

export interface SearchFilterPanelProps {
  isOpen: boolean;
  isActiveSpotify: boolean;
  isActiveSoundCloud: boolean;
  showAdvancedFilters: boolean;
  searchTypes: SearchTypeState;
  setSearchTypes: SearchTypeSetters;
  filters: SearchFilterState;
  setFilters: SearchFilterSetters;
  availability: SearchAvailability;
  onToggleAdvancedFilters: () => void;
  onToggleSpotify: () => void;
  onToggleSoundCloud: () => void;
}

export interface SearchBarProps {
  searchQuery: string;
  isFilterOpen: boolean;
  filterRef: RefObject<HTMLDivElement | null>;
  onSearch: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchQueryChange: (value: string) => void;
  onToggleFilter: () => void;
  filterPanelProps: SearchFilterPanelProps;
}

export interface NotificationListProps {
  notifications: NotificationType[];
  compact?: boolean;
  onSelectNotification: (link?: string | null) => void;
  onDeleteRead: () => Promise<void> | void;
}

export interface NotificationsMenuProps {
  notificationsRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  unreadCount: number;
  notifications: NotificationType[];
  onToggle: () => void;
  onSelectNotification: (link?: string | null) => void;
  onDeleteRead: () => Promise<void> | void;
}

export interface UserMenuProps {
  profileRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  canAccessAdminPanel: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export interface MobileMenuProps {
  menuRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  notifications: NotificationType[];
  canAccessAdminPanel: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onDeleteRead: () => Promise<void> | void;
}
