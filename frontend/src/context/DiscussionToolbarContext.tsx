import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type DiscussionFilterOption = {
  value: string;
  label: string;
};

type DiscussionToolbarContextValue = {
  topicOptions: DiscussionFilterOption[];
  authorOptions: DiscussionFilterOption[];
  setTopicOptions: Dispatch<SetStateAction<DiscussionFilterOption[]>>;
  setAuthorOptions: Dispatch<SetStateAction<DiscussionFilterOption[]>>;
};

const DiscussionToolbarContext = createContext<
  DiscussionToolbarContextValue | undefined
>(undefined);

export const DiscussionToolbarProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [topicOptions, setTopicOptions] = useState<DiscussionFilterOption[]>(
    [],
  );
  const [authorOptions, setAuthorOptions] = useState<DiscussionFilterOption[]>(
    [],
  );

  const value = useMemo(
    () => ({
      topicOptions,
      authorOptions,
      setTopicOptions,
      setAuthorOptions,
    }),
    [authorOptions, topicOptions],
  );

  return (
    <DiscussionToolbarContext.Provider value={value}>
      {children}
    </DiscussionToolbarContext.Provider>
  );
};

export const useDiscussionToolbar = () => {
  const context = useContext(DiscussionToolbarContext);

  if (!context) {
    throw new Error(
      "useDiscussionToolbar must be used within a DiscussionToolbarProvider.",
    );
  }

  return context;
};
