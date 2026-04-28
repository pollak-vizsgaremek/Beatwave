import { Link } from "react-router";

import Button from "../Button";

const DiscussionHero = () => {
  return (
    <>
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
    </>
  );
};

export default DiscussionHero;
