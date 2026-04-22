import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type SessionContextValue = {
  currentUser: SessionUser | null;
  setCurrentUser: Dispatch<SetStateAction<SessionUser | null>>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export const createSessionUser = (data: SessionUser): SessionUser => ({
  id: data.id,
  username: data.username,
  email: data.email,
  role: data.role,
});

export const SessionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  return (
    <SessionContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider.");
  }

  return context;
};
