import Input from "../components/Input";

const Login = () => {
  return (
    <div className="w-screen h-screen flex flex-row">
      <div className="w-1/2"></div>
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-1/2 h-3/5 bg-linear-to-tl from-[#423686]/70 to-fuchsia-600/70 border rounded-2xl flex flex-col items-center shadow-md shadow-blue-100/30">
          <h1 className="font-semibold text-5xl mt-10 text-white">
            Bejelentkezés
          </h1>
          <form
            action="login"
            method="post"
            className="mt-16 w-full flex flex-col items-center"
          >
            <Input
              labelTile="Email"
              inputType="email"
              inputName="loginEmail"
              inputPlaceHolder="kisferenc3532@gmail.com"
            />
            <Input
              labelTile="Jelszó"
              inputType="password"
              inputName="loginPwd"
              inputPlaceHolder="•••••••"
              wrapperClassName="mt-8"
              forgotPwd={true}
            />
            <button
              className="mt-16 px-12 py-4 bg-[#C5E1ED] rounded-3xl text-black font-medium"
              type="submit"
              disabled
            >
              Bejelentkezés
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
