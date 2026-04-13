import { Link } from "react-router";
import Button from "../components/Button";
import { useEffect, useState } from "react";
import api from "../utils/api";

const Discussion = () => {
  const [postsData, setPostsData] = useState({
    id: String,
    text: String,
    likeAmount: Number,
    hastags: String,
    postedAt: Date,
    userId: String,
    title: String,
    topic: String,
  });
  const [lodingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const response = await api.get("/posts");

        setPostsData(response);
      } catch (error) {
        console.error("Error fetching Posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };
  });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mt-10">
          Welcome to discussion, we yap
        </h1>
        <p className="text-lg mt-2">
          This is where we talk about music, life, and everything in between
        </p>
      </div>

      <div>
        <Link to="/create_discussion">
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
        <div className="flex flex-col items-center justify-center">
          <p>No posts yet</p>
        </div>
      </div>
    </div>
  );
};

export default Discussion;
