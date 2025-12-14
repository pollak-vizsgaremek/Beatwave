export const isTokenExpired = (token: string): boolean => {
  // Allow Dev Token in Development
  if (token === "DEV_TOKEN" && import.meta.env.DEV) {
    return false;
  }

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
