import { ChevronLeft, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";

import ErrorToast from "../components/ErrorToast";
import { PublicProfileSkeleton } from "../components/LoadingSkeletons";
import api from "../utils/api";
import formatRelative from "../utils/DateFormatting";
import type { DiscussionType } from "../utils/Type";
import { useErrorToast } from "../utils/useErrorToast";

type PublicProfileData = {
  id: string;
  username: string;
  description?: string | null;
  isPrivate: boolean;
  spotifyProfileImage?: string | null;
  activeProfileImage?: string | null;
  posts: DiscussionType[];
};

const ViewProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, showError } = useErrorToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(
          `/user-profile/${id}?includeSpotify=true`,
        );
        setProfile(response.data);
      } catch (err: any) {
        showError(err.response?.data?.error || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchProfile();
    }
  }, [id]);

  const avatarLabel = useMemo(() => {
    const trimmed = profile?.username?.trim();
    if (!trimmed) {
      return "U";
    }

    return trimmed.slice(0, 2).toUpperCase();
  }, [profile?.username]);

  return (
    <div className="flex flex-col items-center px-4 pb-16">
      <div className="w-full max-w-5xl mt-10">
        <Link
          to="/discussion"
          className="inline-flex text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={40} />
        </Link>

        {loading ? (
          <PublicProfileSkeleton />
        ) : !profile ? (
          <div className="flex justify-center mt-14">
            <p className="text-white text-lg">
              This profile could not be found.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-card-black w-full min-h-[460px] p-4 sm:p-6 flex flex-col lg:flex-row gap-6 rounded-3xl mt-4 shadow-lg border border-white/5"
          >
            <div className="lg:w-1/3 p-2 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="bg-accent mt-2 w-32 h-32 rounded-full flex justify-center items-center text-black text-3xl font-bold uppercase overflow-hidden">
                {profile.activeProfileImage ? (
                  <img
                    src={profile.activeProfileImage}
                    alt={`${profile.username} profile`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  avatarLabel
                )}
              </div>
              <div className="flex justify-center items-center mt-4 text-2xl font-semibold text-white text-center break-all">
                @{profile.username}
              </div>
              <p className="text-sm text-gray-300 mt-4 text-center whitespace-pre-wrap wrap-break-word leading-6 max-w-xs">
                {profile.description?.trim()
                  ? profile.description
                  : "This user has not added a description yet."}
              </p>
            </div>

            <div className="flex-1 p-2">
              <div className="flex items-center gap-2 mb-5">
                <MessageCircle size={20} />
                <h2 className="text-2xl font-semibold text-white">Posts</h2>
              </div>

              {profile.isPrivate ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
                  This profile is private.
                </div>
              ) : profile.posts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-300">
                  This user has not posted anything yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {profile.posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                    >
                      <Link
                        to={`/discussion/view/${post.id}`}
                        className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-spotify-green/60 hover:bg-black/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {post.title}
                            </h3>
                            <p className="text-sm text-spotify-green italic mt-1">
                              {post.topic}
                            </p>
                          </div>
                          <p className="text-sm text-gray-400 whitespace-nowrap">
                            {formatRelative(post.postedAt)}
                          </p>
                        </div>

                        <p className="text-gray-200 mt-3 line-clamp-3 whitespace-pre-wrap">
                          {post.text}
                        </p>

                        {post.hashtags ? (
                          <p className="text-sm text-gray-400 mt-3">
                            {post.hashtags}
                          </p>
                        ) : null}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default ViewProfile;
