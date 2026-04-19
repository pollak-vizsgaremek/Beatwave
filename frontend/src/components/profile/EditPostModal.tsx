import { X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import Button from "../Button";
import type { PostFormData } from "./types";

interface EditPostModalProps {
  isOpen: boolean;
  postForm: PostFormData;
  isSavingPost: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onFieldChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const EditPostModal = ({
  isOpen,
  postForm,
  isSavingPost,
  onClose,
  onSubmit,
  onFieldChange,
}: EditPostModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card w-full max-w-[700px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
        >
          <X size={40} />
        </button>

        <h2 className="text-3xl font-semibold text-white mb-6 mt-8">
          Edit post
        </h2>

        <form
          onSubmit={onSubmit}
          className="w-full flex flex-col items-center gap-4"
        >
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={postForm.title}
            onChange={onFieldChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="topic"
            placeholder="Topic"
            value={postForm.topic}
            onChange={onFieldChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            name="text"
            placeholder="Post text"
            value={postForm.text}
            onChange={onFieldChange}
            rows={6}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <input
            type="text"
            name="hashtags"
            placeholder="Hashtags"
            value={postForm.hashtags}
            onChange={onFieldChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            labelTitle={isSavingPost ? "Saving..." : "Save post"}
            type="submit"
            disabled={isSavingPost}
            className="mt-2 mb-4"
          />
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
