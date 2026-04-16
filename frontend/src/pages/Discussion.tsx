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
        <h1 className="text-4xl font-bold mt-10">
          Welcome to discussion, we yap
        </h1>
        <p className="text-lg mt-2">
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

      <div className="flex flex-col justify-start self-start ml-20 ">
        <h1 className="text-3xl font-semibold start w-1/2 whitespace-nowrap">
          Posts
        </h1>
        <div className="grid flex-row items-center justify-center w-full gap-4 ml-4 mt-2 grid-cols-3">
          {lodingPosts ? (
            <p>Loading posts...</p>
          ) : postsData.length === 0 ? (
            <p>No posts yet</p>
          ) : (
            postsData.map((post) => (
              <Link className="z-10" to={`/discussion/view/${post.id}`}>
                <div
                  key={post.id}
                  className="flex flex-col relative bg-gray-500/60 w-full h-[300px] max-w-[550px] lg:w-[550px] md:w-[400px] sm:w-full min-w-[200px] outline-1 outline-black p-4 mt-2 rounded-lg"
                >
                  <div className="flex self-start items-center relative top-1 w-full">
                    <p className="font-bold text-xl max-w-[150px] truncate">
                      {post.user.username}
                    </p>
                    <p className="mx-2 font-bold text-lg"> — </p>
                    <p className="text-lg font-extralight max-w-[120px] truncate">
                      {post.title}
                    </p>
                    <p className="mx-2 font-bold text-lg"> - </p>
                    <p className="text-lg font-extralight italic max-w-[120px] truncate">
                      {post.topic}
                    </p>
                    <p className="text-sm text-gray-400 ml-auto">
                      {formatRelative(post.postedAt)}
                    </p>
                  </div>

                  <div className="px-4 mt-3">
                    <p className="line-clamp-5">{post.text}</p>
                  </div>

                  <div className="mt-3">
                    <p>{post.hashtags}</p>
                    <p className="text-sm text-gray-400 mt-1"></p>
                  </div>

                  <div className="mt-3 flex flex-row gap-4 justify-end absolute bottom-3 right-3">
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
