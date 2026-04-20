import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { User, Lock } from "lucide-react";

import Button from "../components/Button";
import Input from "../components/Input";
import MusicWave from "../components/MusicWave";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import api from "../utils/api";
import { createSessionUser, useSession } from "../context/SessionContext";

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useSession();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { error, showError } = useErrorToast();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const response = await api.get("/user-profile?includeSpotify=false", {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        });
        if (!mounted) return;

        setCurrentUser(createSessionUser(response.data));
        navigate("/home");
      } catch {
        if (mounted) {
          setCurrentUser(null);
        }
        // User is not logged in yet, stay on login page.
      }
    };

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate, setCurrentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/login", {
        login: formData.identifier,
        password: formData.password,
      });

      if (response.data.user) {
        setCurrentUser(createSessionUser(response.data.user));
        navigate("/home");
      } else {
        const profileResponse = await api.get("/user-profile?includeSpotify=false");
        setCurrentUser(createSessionUser(profileResponse.data));
        navigate("/home");
      }
    } catch (err: any) {
      showError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col sm:flex-row bg-linear-to-l from-black to-border overflow-hidden">
      <div className="w-full sm:w-1/2 relative z-0 order-1 mb-4 sm:mb-0 max-h-[40vh] sm:max-h-none overflow-hidden">
        <MusicWave />
      </div>
      <div className="w-full sm:w-1/2 flex items-center justify-center z-10 order-2 sm:order-1">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="min-w-[300px] w-full max-w-[500px] min-h-[70vh] h-auto bg-card border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30 relative py-6 sm:py-10 backdrop-blur-md"
        >
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <img
              src="/Beatwave_logo.png"
              alt="Beatwave Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-2xl font-bold text-white tracking-wide">
              Beatwave
            </span>
          </div>

          <h1 className="font-semibold text-5xl mt-8 text-white">Login</h1>
          <form
            onSubmit={handleSubmit}
            className="mt-10 w-full flex flex-col items-center"
          >
            <Input
              labelTitle="Email or Username"
              inputType="text"
              inputName="identifier"
              inputPlaceHolder="Enter your email or username"
              iconLeft={<User size={20} />}
              wrapperClassName="mt-0"
              value={formData.identifier}
              onChange={handleChange}
            />
            <Input
              labelTitle="Password"
              inputType="password"
              inputName="password"
              inputPlaceHolder="•••••••"
              forgotPwd={true}
              iconLeft={<Lock size={20} />}
              wrapperClassName="mt-2 sm:mt-4"
              value={formData.password}
              onChange={handleChange}
            />

            <Button
              labelTitle={isLoading ? "Loading..." : "Login"}
              type="submit"
              disabled={isLoading}
              className="mt-6"
            />

            <p className="mt-6 text-white/80">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-white font-semibold hover:underline"
              >
                Register!
              </Link>
            </p>
          </form>
        </motion.div>
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default Login;
