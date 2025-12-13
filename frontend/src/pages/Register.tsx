import { Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";

import Input from "../components/Input";
import MusicWave from "../components/MusicWave";
import Button from "../components/Button";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [strengthScore, setStrengthScore] = useState(0);
  const [missingReqs, setMissingReqs] = useState<string[]>([]);

  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    const { password, confirmPassword } = formData;

    const reqs = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
    };

    const score = Object.values(reqs).filter(Boolean).length;
    setStrengthScore(score);

    const missing = [];
    if (!reqs.length) missing.push("8+ karakter");
    if (!reqs.number) missing.push("szám");
    if (!reqs.special) missing.push("szimbólum");
    if (!reqs.uppercase) missing.push("nagybetű");
    setMissingReqs(missing);

    const allMet = Object.values(reqs).every(Boolean);
    const match = password === confirmPassword && password !== "";
    setCanRegister(allMet && match);
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegister) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Success! Redirect to login
      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row h-screen w-screen">
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-1/2 h-5/6 bg-[#336890]/70 border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30 relative py-10">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            {/* You can Replace this with an actual SVG logo if available */}
            <div className="w-8 h-8 bg-linear-to-tr from-[#7c3aed] to-[#3b82f6] rounded-full"></div>
            <span className="text-2xl font-bold text-white tracking-wide">
              Beatwave
            </span>
          </div>
          <h1 className="font-semibold text-5xl mt-8 text-white">
            Regisztrálás
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
              wrapperClassName="mt-0"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              labelTitle="Felhasználónév"
              inputType="text"
              inputName="username"
              inputPlaceHolder="kisferenc3532"
              icon={<User size={20} />}
              value={formData.username}
              onChange={handleChange}
            />
            <Input
              labelTitle="Jelszó"
              inputType="password"
              inputName="password"
              inputPlaceHolder="•••••••"
              icon={<Lock size={20} />}
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              labelTitle="Jelszó megerősítése"
              inputType="password"
              inputName="confirmPassword"
              inputPlaceHolder="•••••••"
              icon={<Lock size={20} />}
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            {formData.password.length > 0 && (
              <div className="w-2/3 mt-4 px-4">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Erősségi</span>
                  <span
                    className={`font-bold ${
                      strengthScore <= 1
                        ? "text-red-400"
                        : strengthScore <= 3
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {strengthScore <= 1
                      ? "Gyenge"
                      : strengthScore <= 3
                      ? "Közepes"
                      : "Erős"}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strengthScore <= 1
                        ? "bg-red-500"
                        : strengthScore <= 3
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(strengthScore / 4) * 100}%` }}
                  ></div>
                </div>
                {missingReqs.length > 0 && (
                  <p className="text-xs text-white/50 mt-2">
                    Szükséges még: {missingReqs.join(", ")}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

            <Button
              labelTitle={isLoading ? "Loading..." : "Regisztrálás"}
              type="submit"
              disabled={!canRegister || isLoading}
              className="mt-6"
            />
          </form>
          <p className="mt-6 text-white/80">
            Van már fiókod?{" "}
            <Link
              to="/login"
              className="text-white font-semibold hover:underline"
            >
              Jelentkez be!
            </Link>
          </p>
        </div>
      </div>
      <div className="w-1/2 relative">
        <MusicWave />
      </div>
    </div>
  );
};

export default Register;
