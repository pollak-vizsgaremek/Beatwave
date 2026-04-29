import { motion } from "framer-motion";
import { Mail, Lock, User, CheckCircle2, Circle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";

import Input from "../components/Input";
import MusicWave from "../components/MusicWave";
import Button from "../components/Button";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import api from "../utils/api";
import {
  createSessionUser,
  type SessionUser,
  useSession,
} from "../context/SessionContext";

type SessionStatusResponse = {
  authenticated: boolean;
  user?: SessionUser;
};

const Register = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { error, showError } = useErrorToast();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const response = await api.get<SessionStatusResponse>("/auth/session", {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        });
        if (!mounted) return;

        if (response.data.authenticated && response.data.user) {
          setCurrentUser(createSessionUser(response.data.user));
          navigate("/home");
          return;
        }

        setCurrentUser(null);
      } catch {
        if (mounted) {
          setCurrentUser(null);
        }
        // Expected for signed-out visitors.
      }
    };

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate, setCurrentUser]);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [strengthScore, setStrengthScore] = useState(0);
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    const { email, username, password, confirmPassword } = formData;

    const reqs = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>+-]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };

    const score = Object.values(reqs).filter(Boolean).length;
    setStrengthScore(score);

    const allMet = Object.values(reqs).every(Boolean);
    const match = password === confirmPassword && password !== "";
    const fieldsFilledIn =
      email.trim().length > 0 && username.trim().length > 0;
    setCanRegister(allMet && match && fieldsFilledIn);
  }, [
    formData.email,
    formData.username,
    formData.password,
    formData.confirmPassword,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) return;

    setIsLoading(true);

    try {
      await api.post("/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      const response = await api.post("/login", {
        email: formData.email,
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
      showError(
        err.response?.data?.error || err.message || "Registration failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen w-screen bg-linear-to-r from-black to-border">
      <div className="w-full sm:w-1/2 flex items-center justify-center order-2 sm:order-1">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="min-w-[300px] w-full max-w-[500px] min-h-[60vh] sm:min-h-[80vh] h-auto bg-card border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30 relative py-6 sm:py-10"
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
          <h1 className="font-semibold text-5xl mt-8 text-white">
            Registration
          </h1>
          <form
            onSubmit={handleSubmit}
            className="mt-5 w-full flex flex-col items-center"
          >
            <Input
              labelTitle="Email"
              inputType="email"
              inputName="email"
              inputPlaceHolder="example@example.com"
              iconLeft={<Mail size={20} />}
              wrapperClassName="mt-0"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              labelTitle="Username"
              inputType="text"
              inputName="username"
              inputPlaceHolder="ExampleUsername"
              iconLeft={<User size={20} />}
              wrapperClassName="mt-2 sm:mt-4"
              value={formData.username}
              onChange={handleChange}
            />
            <Input
              labelTitle="Password"
              inputType="password"
              inputName="password"
              inputPlaceHolder="•••••••"
              iconLeft={<Lock size={20} />}
              wrapperClassName="mt-2 sm:mt-4"
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              labelTitle="Confirm Password"
              inputType="password"
              inputName="confirmPassword"
              inputPlaceHolder="•••••••"
              iconLeft={<Lock size={20} />}
              wrapperClassName="mt-2 sm:mt-4"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {formData.password.length > 0 &&
              (() => {
                const reqs = {
                  "8+ characters": formData.password.length >= 8,
                  "Contains a number": /\d/.test(formData.password),
                  "Contains a symbol": /[!@#$%^&*(),.?":{}|<>+-]/.test(
                    formData.password,
                  ),
                  "Uppercase letter": /[A-Z]/.test(formData.password),
                };

                return (
                  <div className="mt-3 px-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-white/80 font-medium">
                        Password Strength
                      </span>
                      <span
                        className={`font-bold transition-colors ${
                          strengthScore <= 1
                            ? "text-red-400"
                            : strengthScore <= 3
                              ? "text-yellow-400"
                              : "text-spotify-green"
                        }`}
                      >
                        {strengthScore <= 1
                          ? "Weak"
                          : strengthScore <= 3
                            ? "Medium"
                            : "Strong"}
                      </span>
                    </div>

                    <div className="flex gap-1.5 h-1.5 w-full mb-4">
                      {[1, 2, 3, 4].map((segment) => {
                        let bgColor = "bg-white/10";
                        if (segment <= strengthScore) {
                          if (strengthScore <= 1)
                            bgColor =
                              "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                          else if (strengthScore <= 3)
                            bgColor =
                              "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                          else
                            bgColor =
                              "bg-spotify-green shadow-[0_0_8px_rgba(30,215,96,0.5)]";
                        }
                        return (
                          <div
                            key={segment}
                            className={`flex-1 rounded-full transition-all duration-300 ${bgColor}`}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                      {Object.entries(reqs).map(([label, isMet]) => (
                        <div key={label} className="flex items-center gap-2">
                          {isMet ? (
                            <CheckCircle2
                              size={16}
                              className="text-spotify-green"
                            />
                          ) : (
                            <Circle size={16} className="text-white/30" />
                          )}
                          <span
                            className={`text-xs transition-colors duration-300 ${isMet ? "text-white" : "text-white/50"}`}
                          >
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            <Button
              labelTitle={isLoading ? "Loading..." : "Register"}
              type="submit"
              disabled={!canRegister || isLoading}
              className="mt-3 sm:mt-12"
            />
          </form>
          <p className="mt-6 mb-6 text-white/80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-white font-semibold hover:underline"
            >
              Login!
            </Link>
          </p>
        </motion.div>
      </div>
      <div className="w-full sm:w-1/2 relative order-1 sm:order-2 mb-4 sm:mb-0 max-h-[40vh] sm:max-h-none overflow-hidden">
        <MusicWave />
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default Register;
