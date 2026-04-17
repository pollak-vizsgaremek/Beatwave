import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

import Button from "../components/Button";
import ErrorToast from "../components/ErrorToast";
import { useErrorToast } from "../utils/useErrorToast";
import api from "../utils/api";

const MAX_TITLE = 200;
const MAX_TEXT = 10000;
const MAX_TOPIC = 100;

const CreateDiscusson = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    hashtags: "",
    text: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const { error, showError } = useErrorToast();

  const hashtagInputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

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
  };

  useEffect(() => {
    if (cursorPosition !== null && hashtagInputRef.current) {
      hashtagInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [cursorPosition, formData.hashtags]);

  const SubmitPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showError("Title is required.");
      return;
    }
    if (formData.title.trim().length > MAX_TITLE) {
      showError(`Title must be at most ${MAX_TITLE} characters.`);
      return;
    }
    if (!formData.topic.trim()) {
      showError("Topic is required.");
      return;
    }
    if (formData.topic.trim().length > MAX_TOPIC) {
      showError(`Topic must be at most ${MAX_TOPIC} characters.`);
      return;
    }
    if (!formData.text.trim()) {
      showError("Post text is required.");
      return;
    }
    if (formData.text.trim().length > MAX_TEXT) {
      showError(`Post text must be at most ${MAX_TEXT} characters.`);
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/posts", formData);
      navigate("/discussion");
    } catch (err: any) {
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

      <form onSubmit={SubmitPost} className="w-full max-w-4xl mt-10">
        <div className="flex flex-col items-center justify-center w-full gap-5 bg-card-black rounded-3xl p-6 md:p-8 shadow-xl mt-6">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
            <input
              type="text"
              name="title"
              placeholder="Title *"
              value={formData.title}
              onChange={handleChange}
              className="w-3/4 md:w-full p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
            />
            <input
              type="text"
              name="topic"
              placeholder="Topic *"
              value={formData.topic}
              onChange={handleChange}
              className="w-3/4 md:w-full p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
            />
          </div>

          <textarea
            name="text"
            placeholder="What's on your mind? *"
            value={formData.text}
            onChange={handleChange}
            className="w-3/4 h-3/4 md:w-full md:size-40 p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40 resize-none"
          />
          <input
            type="text"
            name="hashtags"
            ref={hashtagInputRef}
            placeholder="Hashtags (e.g. #music #beatwave)"
            value={formData.hashtags}
            onChange={handleChange}
            className="w-3/4 md:w-full p-4 rounded-xl bg-card border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/40"
          />
          <div className="flex flex-col items-center justify-center w-full">
            <Button
              type="submit"
              labelTitle={isLoading ? "Creating..." : "Create Post"}
              disabled={isLoading}
            />
          </div>
        </div>
      </form>

      <ErrorToast error={error} />
    </div>
  );
};

export default CreateDiscusson;
