import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

import Button from "../components/Button";
import api from "../utils/api";

const CreateDiscusson = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    hashtags: "",
    text: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hashtagInputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, selectionStart } = e.target;
    let newValue = value;
    let newCursor = selectionStart;

    if (name === "hashtags") {
      const words = value.split(" ");
      const formattedWords = words.map((word) => {
        if (word.length > 0 && !word.startsWith("#")) {
          return "#" + word;
        }
        return word;
      });

      newValue = formattedWords.join(" ");

      if (newCursor !== null && newValue.length > value.length) {
        newCursor += newValue.length - value.length;
      }
    }

    setFormData({ ...formData, [name]: newValue });

    if (name === "hashtags") {
      setCursorPosition(newCursor);
    }

    if (error) setError(null);
  };

  useEffect(() => {
    if (cursorPosition !== null && hashtagInputRef.current) {
      hashtagInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [cursorPosition, formData.hashtags]);

  const SubmitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.topic.trim() ||
      !formData.text.trim()
    ) {
      showError("Please fill in all required fields (Title, Topic, Text).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/posts", formData);
      navigate("/discussion");
    } catch (err: any) {
      console.error("Failed to create post:", err);
      showError(
        err.response?.data?.error || "Failed to create post. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full relative pb-20">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold mt-10 text-white">Create a post</h1>
        <p className="text-lg mt-2 text-white/70">
          Share your thoughts with the community
        </p>
      </div>

      <form onSubmit={SubmitPost} className="w-full max-w-3xl mt-10">
        <div className="flex flex-col items-center justify-center w-full gap-5">
          <input
            type="text"
            name="title"
            placeholder="Title *"
            value={formData.title}
            onChange={handleChange}
            className="w-3/4 md:w-1/2 p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
          />
          <input
            type="text"
            name="topic"
            placeholder="Topic *"
            value={formData.topic}
            onChange={handleChange}
            className="w-3/4 md:w-1/2 p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
          />
          <input
            type="text"
            name="hashtags"
            ref={hashtagInputRef} // <-- Attached the ref here
            placeholder="Hashtags (e.g. #music #beatwave)"
            value={formData.hashtags}
            onChange={handleChange}
            className="w-3/4 md:w-1/2 p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
          />
          <textarea
            name="text"
            placeholder="What's on your mind? *"
            value={formData.text}
            onChange={handleChange}
            className="w-3/4 md:w-1/2 p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40 resize-none"
          />
        </div>

        <div className="flex flex-col items-center justify-center w-full mt-8">
          <Button
            type="submit"
            labelTitle={isLoading ? "Creating..." : "Create Post"}
            disabled={isLoading}
          />
        </div>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateDiscusson;
