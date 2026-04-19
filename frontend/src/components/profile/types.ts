export interface UserProfileData {
  username: string;
  email: string;
  role: string;
  description?: string | null;
  isPrivate: boolean;
  spotifyConnected: boolean;
  soundCloudConnected: boolean;
}

export interface PostFormData {
  title: string;
  topic: string;
  hashtags: string;
  text: string;
}
