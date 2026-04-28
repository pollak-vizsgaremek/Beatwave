export type SpotifyTimeRange = "SHORT" | "MEDIUM" | "LONG";

export interface UserProfileData {
  id: string;
  username: string;
  email: string;
  role: string;
  description?: string | null;
  isPrivate: boolean;
  spotifyTimeRange?: SpotifyTimeRange;
  spotifyConnected: boolean;
  spotifyProfileImage?: string | null;
  activeProfileImage?: string | null;
}

export interface PostFormData {
  title: string;
  topic: string;
  hashtags: string;
  text: string;
}
