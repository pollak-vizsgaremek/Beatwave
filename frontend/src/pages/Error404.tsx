import { Link } from "react-router";
import Button from '../components/Button';

const Error404 = () => {
  return (
    <>
      <div className="flex flex-col items-center w-full p-20">
        <div className="flex flex-col items-center justify-center w-full">
          <h1 className="text-4xl font-extrabold mb-10">404</h1>
          <p className="text-3xl mb-5">Page not found</p>

          <Link to="/home">
            <Button
              labelTitle="Go back home"
              className="mt-6! outline-1 border-none hover:outline-white hover:outline-1 hover:outline-offset-2"
            />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Error404;
