import Button from "../components/Button";
import Input from "../components/Input";
import { Mail, Lock } from "lucide-react";
import { Link } from "react-router";
import MusicWave from "../components/MusicWave";

const Login = () => {
  return (
    <div className="w-screen h-screen flex flex-row ">
      <div className="w-1/2 relative">
        <MusicWave />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-1/2 h-4/6 bg-[#336890]/70 border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30 relative py-10">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            {/* You can Replace this with an actual SVG logo if available */}
            <div className="w-8 h-8 bg-linear-to-tr from-[#7c3aed] to-[#3b82f6] rounded-full"></div>
            <span className="text-2xl font-bold text-white tracking-wide">
              Beatwave
            </span>
          </div>

          <h1 className="font-semibold text-5xl mt-8 text-white">
            Bejelentkezés
          </h1>
          <form
            action="login"
            method="post"
            className="mt-10 w-full flex flex-col items-center"
          >
            <Input
              labelTitle="Email"
              inputType="email"
              inputName="loginEmail"
              inputPlaceHolder="kisferenc3532@gmail.com"
              icon={<Mail size={20} />}
            />
            <Input
              labelTitle="Jelszó"
              inputType="password"
              inputName="loginPwd"
              inputPlaceHolder="•••••••"
              forgotPwd={true}
              icon={<Lock size={20} />}
            />
            <Button labelTitle="Bejelentkezés" type="submit" />

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
