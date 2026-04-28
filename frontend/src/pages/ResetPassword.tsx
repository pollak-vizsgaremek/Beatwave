import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Circle, CheckCircle2, Lock } from "lucide-react";

import MusicWave from "../components/MusicWave";
import Input from "../components/Input";
import Button from "../components/Button";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import api from "../utils/api";

type TokenValidationResponse = {
  valid: boolean;
};

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { error, showError } = useErrorToast();
  const token = useMemo(
    () => new URLSearchParams(location.search).get("token") ?? "",
    [location.search],
  );
  const [tokenState, setTokenState] = useState<"checking" | "valid" | "invalid">(
    "checking",
  );
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const validateToken = async () => {
      if (!token) {
        if (mounted) {
          setTokenState("invalid");
        }
        return;
      }

      try {
        const response = await api.get<TokenValidationResponse>(
          "/auth/password-reset/validate",
          {
            params: { token },
            headers: {
              "X-Skip-Auth-Redirect": "1",
            },
          },
        );

        if (!mounted) {
          return;
        }

        setTokenState(response.data.valid ? "valid" : "invalid");
      } catch {
        if (mounted) {
          setTokenState("invalid");
        }
      }
    };

    void validateToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const submitChecks = {
      length: formData.password.length >= 8,
      number: /\d/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>+-]/.test(formData.password),
      uppercase: /[A-Z]/.test(formData.password),
    };
    const submitPasswordsMatch =
      formData.password.length > 0 &&
      formData.password === formData.confirmPassword;
    const canSubmitNow =
      tokenState === "valid" &&
      Object.values(submitChecks).every(Boolean) &&
      submitPasswordsMatch;

    if (!canSubmitNow) {
      showError("Please enter a strong password and make sure both fields match");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        "/auth/password-reset/confirm",
        {
          token,
          password: formData.password,
        },
        {
          headers: {
            "X-Skip-Auth-Redirect": "1",
          },
        },
      );

      navigate("/login?reset=success", { replace: true });
    } catch (err: any) {
      showError(err?.response?.data?.error || "Password reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordChecks = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>+-]/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
  };
  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;

  const passwordRequirements = {
    "8+ characters": passwordChecks.length,
    "Contains a number": passwordChecks.number,
    "Contains a symbol": passwordChecks.special,
    "Uppercase letter": passwordChecks.uppercase,
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

          <h1 className="font-semibold text-4xl mt-8 text-white">
            Reset Password
          </h1>

          {tokenState === "checking" && (
            <p className="mt-8 text-white/80">Validating your reset link...</p>
          )}

          {tokenState === "invalid" && (
            <div className="mt-8 px-8 text-center">
              <p className="text-red-300">
                This reset link is invalid or expired.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block text-white font-semibold hover:underline"
              >
                Back to login
              </Link>
            </div>
          )}

          {tokenState === "valid" && (
            <form
              onSubmit={handleSubmit}
              className="mt-6 w-full flex flex-col items-center"
            >
              <Input
                labelTitle="New Password"
                inputType="password"
                inputName="password"
                inputPlaceHolder="•••••••••"
                iconLeft={<Lock size={20} />}
                wrapperClassName="mt-0"
                value={formData.password}
                onChange={handleChange}
              />
              <Input
                labelTitle="Confirm Password"
                inputType="password"
                inputName="confirmPassword"
                inputPlaceHolder="•••••••••"
                iconLeft={<Lock size={20} />}
                wrapperClassName="mt-2 sm:mt-4"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              {formData.password.length > 0 && (
                <div className="mt-4 w-4/6">
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
                        if (strengthScore <= 1) {
                          bgColor =
                            "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
                        } else if (strengthScore <= 3) {
                          bgColor =
                            "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]";
                        } else {
                          bgColor =
                            "bg-spotify-green shadow-[0_0_8px_rgba(30,215,96,0.5)]";
                        }
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
                    {Object.entries(passwordRequirements).map(
                      ([label, isMet]) => (
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
                            className={`text-xs transition-colors duration-300 ${
                              isMet ? "text-white" : "text-white/50"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <Button
                labelTitle={isSubmitting ? "Resetting..." : "Reset Password"}
                type="submit"
                disabled={isSubmitting}
                className="mt-8"
              />
            </form>
          )}
        </motion.div>
      </div>

      <ErrorToast error={error} />
    </div>
  );
};

export default ResetPassword;
