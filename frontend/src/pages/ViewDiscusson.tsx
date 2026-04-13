import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type { DiscussionType } from "../utils/Type";
import api from "../utils/api";

const ViewDiscussion = () => {
  const { id } = useParams();

  const [postData, setPostData] = useState<DiscussionType | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);
        setPostData(response.data);
      } catch (error) {
        console.error("Error fetching Post:", error);
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPost();
  }, [id]);

  const formatRelative = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diff = (posted.getTime() - now.getTime()) / 1000; // seconds

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    const minutes = Math.round(diff / 60);
    const hours = Math.round(diff / 3600);
    const days = Math.round(diff / 86400);

    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
    return rtf.format(days, "day");
  };

  return (
    <div>
      {loadingPost ? (
        <p>Loading post...</p>
      ) : !postData ? (
        <p>No post found</p>
      ) : (
        <div className="w-full h-full px-40 pt-20">
          <div className="flex flex-row items-end justify-between">
            <div className="flex flex-row items-end">
              <h1 className="text-2xl font-bold">{postData.title}</h1>
              <p className="ml-2">by {postData.user.username}</p>
            </div>
            <p>{formatRelative(postData.postedAt)}</p>
          </div>
          <p className='pt-5 pb-2'>{postData.text}</p>
          <p>{postData.hashtags}</p>
        </div>
      )}
    </div>
  );
};

export default ViewDiscussion;
