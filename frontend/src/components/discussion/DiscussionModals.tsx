import type { ChangeEvent, FormEvent } from "react";
import { X } from "lucide-react";

import Button from "../Button";

interface PostFormState {
  title: string;
  topic: string;
  hashtags: string;
  text: string;
}

interface EditPostModalProps {
  isOpen: boolean;
  form: PostFormState;
  isSaving: boolean;
  onClose: () => void;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (event: FormEvent) => void;
}

interface ReportModalProps {
  isOpen: boolean;
  targetLabel?: string;
  reason: string;
  maxLength: number;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const EditPostModal = ({
  isOpen,
  form,
  isSaving,
  onClose,
  onChange,
  onSubmit,
}: EditPostModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card w-full max-w-[700px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
        <button
          type="button"
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
            value={form.title}
            onChange={onChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            name="topic"
            placeholder="Topic"
            value={form.topic}
            onChange={onChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            name="text"
            placeholder="Post text"
            value={form.text}
            onChange={onChange}
            rows={6}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <input
            type="text"
            name="hashtags"
            placeholder="Hashtags"
            value={form.hashtags}
            onChange={onChange}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            labelTitle={isSaving ? "Saving..." : "Save post"}
            type="submit"
            disabled={isSaving}
            className="mt-2 mb-4"
          />
        </form>
      </div>
    </div>
  );
};

export const ReportModal = ({
  isOpen,
  targetLabel,
  reason,
  maxLength,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}: ReportModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card w-full max-w-[650px] p-4 rounded-3xl relative border border-border flex flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-red-500 cursor-pointer"
        >
          <X size={40} />
        </button>

        <h2 className="text-3xl font-semibold text-white mb-4 mt-8">
          Report {targetLabel ?? "content"}
        </h2>
        <p className="text-gray-400 text-center mb-4 px-4">
          Please tell us why you want to report this {targetLabel ?? "content"}.
        </p>

        <div className="w-full flex flex-col items-center gap-4">
          <textarea
            name="reportReason"
            placeholder="Write the reason for your report"
            value={reason}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            maxLength={maxLength}
            className="w-4/5 p-4 rounded-xl bg-card-black border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
          />
          <p className="w-4/5 text-right text-sm text-gray-400">
            {reason.length}/{maxLength}
          </p>

          <div className="w-4/5 flex justify-end gap-3 mb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-yellow-400 text-black text-sm font-bold rounded-full hover:bg-yellow-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
