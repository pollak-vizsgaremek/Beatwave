export const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);

    if (!exp) return false;

    // JWT exp is in seconds, Date.now() is in ms
    return Date.now() >= exp * 1000;
  } catch (e) {
    return true; // If we can't decode it, treat as expired/invalid
  }
};

type StoredUser = {
  id?: string;
  username?: string;
  email?: string;
};

export const getStoredUser = (): StoredUser | null => {
  try {
    const rawToken = localStorage.getItem("token");
    if (!rawToken || isTokenExpired(rawToken)) {
      localStorage.removeItem("token");
      return null;
    }

    const payload = JSON.parse(atob(rawToken.split(".")[1]));
    return payload as StoredUser;
  } catch {
    return null;
  }
};

const getLikedPostsKey = () => {
  const userId = getStoredUser()?.id ?? "guest";
  return `likedPosts:${userId}`;
};

export const getLikedPosts = (): Set<string> => {
  try {
    const rawLikes = localStorage.getItem(getLikedPostsKey());
    return new Set<string>(rawLikes ? JSON.parse(rawLikes) : []);
  } catch {
    return new Set<string>();
  }
};

export const saveLikedPosts = (likedPosts: Set<string>) => {
  localStorage.setItem(getLikedPostsKey(), JSON.stringify([...likedPosts]));
};
