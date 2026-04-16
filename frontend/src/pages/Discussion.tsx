import { Link } from "react-router";
import { Heart, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import Button from "../components/Button";

import api from "../utils/api";
import formatRelative from "../utils/DateFormatting";
import type { DiscussionType } from "../utils/Type";

const Discussion = () => {
  const [postsData, setPostsData] = useState<DiscussionType[]>([]);
  const [lodingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const response = await api.get("/posts");

        setPostsData(response.data);
      } catch (error) {
        console.error("Error fetching Posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchAllPosts();
  }, []);

  return (
    <div className="flex flex-col items-center w-full mt-2 mb-10">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mt-10 text-center">
          Welcome to discussion
        </h1>
        <p className="text-lg mt-2 text-center">
          This is where we talk about music, life, and everything in between
        </p>
      </div>

      <div>
        <Link to="/discussion/create">
          <Button
            labelTitle="Create a post"
            className="outline-1 outline-black hover:outline-gray-500 mt-8!"
          />
        </Link>
      </div>

      <div className="flex flex-col justify-center self-center w-full ml-0 md:ml-20">
        <h1 className="text-3xl font-semibold text-center w-full">Posts</h1>
        <div className="grid flex-row items-center justify-center w-full max-w-[420px] md:max-w-none mx-auto gap-4 mt-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {lodingPosts ? (
            <p>Loading posts...</p>
          ) : postsData.length === 0 ? (
            <p>No posts yet</p>
          ) : (
            postsData.map((post) => (
              <Link className="z-10" to={`/discussion/view/${post.id}`}>
                <div
                  key={post.id}
                  className="flex flex-col relative bg-gray-500/60 w-full min-h-[220px] sm:min-h-[260px] p-2 sm:p-4 mt-2 rounded-lg outline-1 outline-black"
                >
                  <div className="flex flex-col sm:flex-row self-start items-start sm:items-center relative top-1 w-full">
                    <p className="font-bold text-xl max-w-[100px] sm:max-w-[150px] truncate">
                      {post.user.username}
                    </p>
                    <p className="mx-2 font-bold text-lg hidden sm:block">
                      {" "}
                      —{" "}
                    </p>
                    <p className="text-lg font-extralight max-w-[80px] sm:max-w-[120px] truncate">
                      {post.title}
                    </p>
                    <p className="mx-2 font-bold text-lg hidden sm:block">
                      {" "}
                      -{" "}
                    </p>
                    <p className="text-lg font-extralight italic max-w-[80px] sm:max-w-[120px] truncate">
                      {post.topic}
                    </p>
                    <p className="text-sm text-gray-400 ml-auto mt-1 sm:mt-0">
                      {formatRelative(post.postedAt)}
                    </p>
                  </div>

                  <div className="px-2 sm:px-4 mt-2 sm:mt-3">
                    <p className="line-clamp-5">{post.text}</p>
                  </div>

                  <div className="mt-2 sm:mt-3">
                    <p>{post.hashtags}</p>
                    <p className="text-sm text-gray-400 mt-1"></p>
                  </div>

                  <div className="mt-2 sm:mt-3 flex flex-row gap-4 justify-end absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
                    <p className="flex items-center hover:text-red-500 cursor-pointer">
                      <Heart className="mr-2 z-99" /> {post.likeAmount}
                    </p>
                    <p className="flex items-center hover:text-blue-500 cursor-pointer">
                      <MessageCircle className="mr-2 z-99" />
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussion;
