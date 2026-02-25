import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock } from "lucide-react";

import Button from "../components/Button";
import Input from "../components/Input";
import MusicWave from "../components/MusicWave";
import api from "../utils/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      console.log("Login success:", response.data);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user || {}));
        navigate("/home"); // Navigate to home/dashboard only on success
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-row bg-linear-to-l from-black to-border overflow-hidden">
      <div className="w-1/2 relative z-0">
        <MusicWave />
      </div>
      <div className="w-1/2 flex items-center justify-center z-10">
        <div className="min-w-[500px] w-1/2 h-4/6 bg-card border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30 relative py-10 backdrop-blur-md">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-tr from-[#7c3aed] to-[#3b82f6] rounded-full"></div>
            <span className="text-2xl font-bold text-white tracking-wide">
              Beatwave
            </span>
          </div>

          <h1 className="font-semibold text-5xl mt-8 text-white">
            Bejelentkezés
          </h1>
          <form
            onSubmit={handleSubmit}
            className="mt-10 w-full flex flex-col items-center"
          >
            <Input
              labelTitle="Email"
              inputType="email"
              inputName="email"
              inputPlaceHolder="kisferenc3532@gmail.com"
              icon={<Mail size={20} />}
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              labelTitle="Jelszó"
              inputType="password"
              inputName="password"
              inputPlaceHolder="•••••••"
              forgotPwd={true}
              icon={<Lock size={20} />}
              value={formData.password}
              onChange={handleChange}
            />

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

            <Button
              labelTitle={isLoading ? "Loading..." : "Bejelentkezés"}
              type="submit"
              disabled={isLoading}
            />

            {import.meta.env.DEV && (
              <button
                type="button"
                className="mt-4 text-xs text-yellow-500 hover:text-yellow-400 underline"
                onClick={() => {
                  localStorage.setItem("token", "DEV_TOKEN");
                  localStorage.setItem(
                    "user",
                    JSON.stringify({ username: "Developer", role: "ADMIN" }),
                  );
                  navigate("/home");
                }}
              >
                [Dev Mode] Login Bypass
              </button>
            )}

            <p className="mt-6 text-white/80">
              Nincs még fiókod?{" "}
              <Link
                to="/register"
                className="text-white font-semibold hover:underline"
              >
                Regisztrálj!
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
