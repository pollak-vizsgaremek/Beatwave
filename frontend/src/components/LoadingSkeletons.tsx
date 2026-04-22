import Skeleton from "react-loading-skeleton";

type SectionHeadingSkeletonProps = {
  width?: number | string;
};

export const SectionHeadingSkeleton = ({
  width = "16rem",
}: SectionHeadingSkeletonProps) => (
  <Skeleton height={32} width={width} borderRadius={12} />
);

export const CurrentTrackCardSkeleton = () => (
  <div className="flex flex-col items-center gap-4 sm:flex-row">
    <Skeleton height={128} width={128} borderRadius={14} />
    <div className="flex w-full flex-col gap-3">
      <Skeleton height={30} width="70%" borderRadius={10} />
      <Skeleton height={22} width="50%" borderRadius={10} />
      <Skeleton height={20} width="65%" borderRadius={10} />
    </div>
  </div>
);

export const TopListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <SectionHeadingSkeleton width="18rem" />
      <div className="hidden gap-3 sm:flex">
        <Skeleton circle height={56} width={56} />
        <Skeleton circle height={56} width={56} />
      </div>
    </div>
    <div className="flex gap-6 overflow-hidden sm:ml-6 sm:gap-12">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-40 shrink-0 sm:min-w-52">
          <Skeleton height={32} width={56} borderRadius={10} />
          <div className="mt-3">
            <Skeleton className="h-44 w-40 sm:h-56 sm:w-52" borderRadius={14} />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton height={22} width="80%" borderRadius={10} />
            <Skeleton height={18} width="55%" borderRadius={10} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const RecommendedTracksSkeleton = ({
  count = 5,
}: {
  count?: number;
}) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-white/8 bg-card/90 p-4 shadow-lg"
      >
        <Skeleton className="aspect-square w-full" borderRadius={16} />
        <div className="mt-4 space-y-2">
          <Skeleton height={24} width="80%" borderRadius={10} />
          <Skeleton height={16} width="60%" borderRadius={10} />
          <Skeleton height={16} width="72%" borderRadius={10} />
          <div className="flex items-center justify-between pt-1">
            <Skeleton height={14} width={60} borderRadius={10} />
            <Skeleton height={14} width={48} borderRadius={10} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SearchResultsSkeleton = () => (
  <div className="w-[95%] xl:w-3/4 mx-auto pb-20">
    <div className="mb-8 space-y-3">
      <Skeleton height={38} width="20rem" borderRadius={12} />
      <Skeleton height={22} width="16rem" borderRadius={10} />
    </div>

    <div className="mb-12">
      <SectionHeadingSkeleton width="8rem" />
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-xl bg-card p-3"
          >
            <Skeleton height={48} width={48} borderRadius={10} />
            <div className="flex-1 space-y-2">
              <Skeleton height={18} width="55%" borderRadius={8} />
              <Skeleton height={14} width="35%" borderRadius={8} />
            </div>
            <Skeleton height={14} width={42} borderRadius={8} />
          </div>
        ))}
      </div>
    </div>

    <div className="mb-12">
      <SectionHeadingSkeleton width="8rem" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-4">
            <Skeleton className="mx-auto h-24 w-24" circle />
            <div className="mt-4 space-y-2">
              <Skeleton height={16} width="75%" borderRadius={8} />
              <Skeleton height={12} width="55%" borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <SectionHeadingSkeleton width="8rem" />
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl bg-card p-4">
            <Skeleton className="aspect-square w-full" borderRadius={12} />
            <div className="mt-4 space-y-2">
              <Skeleton height={16} width="70%" borderRadius={8} />
              <Skeleton height={12} width="60%" borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ArtistViewSkeleton = () => (
  <div className="flex flex-col items-center px-4 pb-24">
    <div className="w-full max-w-5xl mt-8 space-y-6">
      <Skeleton height={42} width={42} borderRadius={999} />
      <section className="rounded-4xl border border-white/10 bg-card/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,30rem),1fr] lg:items-center">
          <Skeleton className="h-120 w-full" borderRadius={40} />
          <div className="space-y-5">
            <Skeleton height={54} width="65%" borderRadius={14} />
            <Skeleton height={20} width="35%" borderRadius={10} />
            <Skeleton height={42} width={160} borderRadius={999} />
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <SectionHeadingSkeleton width="12rem" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-xl bg-card p-3"
            >
              <Skeleton height={48} width={48} borderRadius={10} />
              <div className="flex-1 space-y-2">
                <Skeleton height={18} width="50%" borderRadius={8} />
                <Skeleton height={14} width="30%" borderRadius={8} />
              </div>
              <Skeleton height={14} width={48} borderRadius={8} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const PublicProfileSkeleton = () => (
  <div className="flex flex-col items-center px-4 pb-16">
    <div className="w-full max-w-5xl mt-10 space-y-4">
      <Skeleton height={44} width={44} borderRadius={999} />
      <div className="bg-card-black w-full min-h-[460px] rounded-3xl border border-white/5 p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:w-1/3 lg:border-r lg:border-white/10">
            <Skeleton circle height={128} width={128} />
            <Skeleton height={28} width="70%" borderRadius={10} />
            <Skeleton count={3} borderRadius={10} />
          </div>
          <div className="flex-1 space-y-4 p-2">
            <div className="flex items-center gap-2">
              <Skeleton height={28} width="8rem" borderRadius={10} />
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-black/20 p-6"
              >
                <Skeleton height={22} width="45%" borderRadius={10} />
                <div className="mt-3 space-y-2">
                  <Skeleton count={2} borderRadius={10} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const UserProfileSkeleton = () => (
  <div className="flex flex-col items-center px-4">
    <div className="mt-12 flex w-full max-w-5xl flex-col gap-4">
      <div className="flex gap-4 self-start">
        <Skeleton height={28} width={72} borderRadius={10} />
        <Skeleton height={28} width={84} borderRadius={10} />
      </div>
      <div className="bg-card-black w-full min-h-[460px] rounded-3xl border border-white/5 p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-4 lg:w-1/3">
            <Skeleton circle height={128} width={128} />
            <Skeleton height={28} width="70%" borderRadius={10} />
            <Skeleton count={3} borderRadius={10} />
          </div>
          <div className="flex-1 space-y-4 p-2">
            <div className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Skeleton height={28} width="9rem" borderRadius={10} />
                <Skeleton height={18} width="7rem" borderRadius={10} />
              </div>
              <ProfilePostsSkeleton count={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ProfilePostsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-white/10 bg-card-black p-4 shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton height={24} width="45%" borderRadius={10} />
            <Skeleton height={16} width="35%" borderRadius={8} />
          </div>
          <Skeleton circle height={32} width={32} />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton count={2} borderRadius={10} />
        </div>
        <div className="mt-3">
          <Skeleton height={16} width="30%" borderRadius={8} />
        </div>
      </div>
    ))}
  </div>
);

export const PlaylistPickerSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-3"
      >
        <Skeleton height={48} width={48} borderRadius={10} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height={16} width="55%" borderRadius={8} />
          <Skeleton height={12} width="35%" borderRadius={8} />
        </div>
        <Skeleton circle height={20} width={20} />
      </div>
    ))}
  </div>
);

export const AdminPanelSkeleton = () => (
  <div className="space-y-3 py-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="rounded-lg border border-white/10 bg-gray-700/30 p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 sm:w-2/3">
            <Skeleton height={22} width="40%" borderRadius={8} />
            <Skeleton height={16} width="65%" borderRadius={8} />
          </div>
          <div className="flex gap-2">
            <Skeleton height={34} width={90} borderRadius={10} />
            <Skeleton height={34} width={90} borderRadius={10} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const DiscussionPostsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid w-full max-w-[1600px] mx-auto mt-2 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="mt-2 flex min-h-[220px] w-full flex-col rounded-lg bg-gray-500/35 p-2 shadow-md outline-1 outline-black sm:min-h-[260px] sm:p-4"
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton height={24} width="55%" borderRadius={8} />
            <Skeleton height={18} width="45%" borderRadius={8} />
          </div>
          <Skeleton height={14} width={72} borderRadius={8} />
        </div>
        <div className="mt-5 space-y-2">
          <Skeleton count={4} borderRadius={10} />
        </div>
        <div className="mt-auto flex items-center justify-between pt-6">
          <Skeleton height={18} width={84} borderRadius={8} />
          <Skeleton height={18} width={64} borderRadius={8} />
        </div>
      </div>
    ))}
  </div>
);

export const DiscussionDetailSkeleton = () => (
  <div className="w-full max-w-4xl mx-auto px-4 md:px-10">
    <div className="rounded-2xl bg-gray-500/35 p-4 shadow-md outline-1 outline-black sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height={28} width="42%" borderRadius={10} />
          <Skeleton height={18} width="30%" borderRadius={8} />
        </div>
        <Skeleton height={16} width={96} borderRadius={8} />
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton count={5} borderRadius={10} />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <Skeleton height={18} width={84} borderRadius={8} />
        <Skeleton height={18} width={64} borderRadius={8} />
      </div>
    </div>
  </div>
);

export const CommentThreadSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4 py-4">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-white/10 bg-card-black p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <Skeleton height={18} width="28%" borderRadius={8} />
          <Skeleton height={14} width={72} borderRadius={8} />
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton count={3} borderRadius={10} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Skeleton height={16} width={52} borderRadius={8} />
          <Skeleton height={16} width={44} borderRadius={8} />
        </div>
      </div>
    ))}
  </div>
);
