const MusicWave = () => {
  // Create an array for bar delays to create the wave effect
  // Increased count for wider visual
  const bars = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
    id: i,
    delay: `${i * 0.1}s`,
  }));

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex justify-center items-center gap-3 h-[200px]">
        {bars.map((bar) => (
          <div
            key={bar.id}
            className="w-4 bg-linear-to-t from-[#4f46e5] to-[#3b82f6] rounded-full animate-wave"
            style={{ animationDelay: bar.delay }}
          ></div>
        ))}
      </div>
      <p className="mt-12 text-5xl font-bold text-white tracking-widest uppercase opacity-80">
        Feel the Beat
      </p>
    </div>
  );
};

export default MusicWave;
