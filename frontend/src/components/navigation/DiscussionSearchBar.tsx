import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import type { DiscussionFilterOption } from "../../context/DiscussionToolbarContext.tsx";
import Input from "../Input";
import DiscussionFilterPanel from "./DiscussionFilterPanel.tsx";

interface DiscussionSearchBarProps {
  topicOptions: DiscussionFilterOption[];
  authorOptions: DiscussionFilterOption[];
}

const DiscussionSearchBar = ({
  topicOptions,
  authorOptions,
}: DiscussionSearchBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const filterRef = useRef<HTMLDivElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const params = new URLSearchParams(location.search);
  const searchQuery = params.get("q") || "";
  const selectedTopic = params.get("topic") || "all";
  const selectedAuthorId = params.get("author") || "all";
  const selectedSort =
    (params.get("sort") as "newest" | "oldest" | "mostLiked" | null) ||
    "newest";
  const hashtagFilter = params.get("hashtags") || "";
  const onlyMyPosts = params.get("mine") === "true";
  const onlyLikedPosts = params.get("liked") === "true";

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isFilterOpen]);

  const updateParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(location.search);

    for (const [key, value] of Object.entries(updates)) {
      if (
        !value ||
        value === "all" ||
        value === "newest" ||
        value === "false"
      ) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    navigate(
      {
        pathname: location.pathname,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: true },
    );
  };

  return (
    <div className="flex w-full min-w-0 items-center justify-center gap-3">
      <Input
        inputClassName="w-full"
        wrapperClassName="w-full! max-w-[780px] min-w-[120px] sm:min-w-[400px] xl:min-w-[560px] mx-1 sm:mx-2 md:mx-4 mt-0!"
        inputType="text"
        inputName="discussion_search"
        inputPlaceHolder="Search in discussions..."
        value={searchQuery}
        onChange={(event) =>
          updateParams({ q: event.target.value.trim() || null })
        }
        iconLeft={<Search strokeWidth={3} size={30} />}
        iconRight={
          <div className="relative flex items-center" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="cursor-pointer transition-colors flex hover:text-white"
            >
              <SlidersHorizontal strokeWidth={3} size={30} />
            </button>

            <DiscussionFilterPanel
              isOpen={isFilterOpen}
              selectedTopic={selectedTopic}
              selectedAuthorId={selectedAuthorId}
              selectedSort={selectedSort}
              discussionHashtagFilter={hashtagFilter}
              onlyMyPosts={onlyMyPosts}
              onlyLikedPosts={onlyLikedPosts}
              topicOptions={topicOptions}
              authorOptions={authorOptions}
              onTopicChange={(value) => updateParams({ topic: value })}
              onAuthorChange={(value) => updateParams({ author: value })}
              onSortChange={(value) => updateParams({ sort: value })}
              onHashtagChange={(value) =>
                updateParams({ hashtags: value || null })
              }
              onOnlyMyPostsChange={(checked) =>
                updateParams({ mine: checked ? "true" : null })
              }
              onOnlyLikedPostsChange={(checked) =>
                updateParams({ liked: checked ? "true" : null })
              }
            />
          </div>
        }
      />
    </div>
  );
};

export default DiscussionSearchBar;
