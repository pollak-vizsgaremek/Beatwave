export type StoredUser = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
};

export const getStoredUser = (): StoredUser | null => {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return null;
    }

    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: StoredUser | null) => {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
};
