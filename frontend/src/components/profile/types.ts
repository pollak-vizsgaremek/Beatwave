export interface UserProfileData {
  username: string;
  email: string;
  role: string;
  description?: string | null;
  isPrivate: boolean;
  spotifyConnected: boolean;
  spotifyProfileImage?: string | null;
  soundCloudConnected: boolean;
}

export interface PostFormData {
  title: string;
  topic: string;
  hashtags: string;
  text: string;
}
