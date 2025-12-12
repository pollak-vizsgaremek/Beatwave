import { useLocation } from "react-router";

const Background = () => {
  const location = useLocation();
  const hiddenRoutes = ["/login", "/register"];

  const shouldHide = hiddenRoutes.includes(location.pathname);

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 bg-linear-to-r from-[#000000] to-[#13313d] overflow-hidden">
      {/* Bubble 1 */}
      <div
        className="absolute rounded-full blur-[80px] opacity-60 animate-float"
        style={{
          top: "-10%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          backgroundColor: "#4f46e5",
          animationDuration: "25s",
          animationDelay: "0s",
        }}
      ></div>

      {/* Bubble 2 */}
      <div
        className="absolute rounded-full blur-[80px] opacity-60 animate-float"
        style={{
          top: "40%",
          right: "-5%",
          width: "40vw",
          height: "40vw",
          backgroundColor: "#3b82f6",
          animationDuration: "22s",
          animationDelay: "-5s",
        }}
      ></div>

      {/* Bubble 3 */}
      <div
        className="absolute rounded-full blur-[80px] opacity-60 animate-float"
        style={{
          bottom: "-10%",
          left: "20%",
          width: "35vw",
          height: "35vw",
          backgroundColor: "#a855f7",
          animationDuration: "28s",
          animationDelay: "-10s",
        }}
      ></div>
    </div>
  );
};

export default Background;
