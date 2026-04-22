import Button from "../Button";

interface CommentComposerProps {
  value: string;
  maxLength: number;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const CommentComposer = ({
  value,
  maxLength,
  isSubmitting,
  onChange,
  onSubmit,
}: CommentComposerProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.nativeEvent.isComposing ||
      event.key !== "Enter" ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    if (!isSubmitting) {
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-10 bg-card-black p-5 rounded-2xl">
      <textarea
        className="w-full bg-[#2D333B] text-white p-4 rounded-xl border border-transparent focus:outline-none focus:border-spotify-green resize-none text-base"
        rows={3}
        maxLength={maxLength}
        placeholder="What are your thoughts?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          {value.length}/{maxLength}
        </p>
        <Button
          labelTitle={isSubmitting ? "Posting..." : "Post Comment"}
          onClick={onSubmit}
          disabled={isSubmitting}
          className="mt-0! px-6 py-2.5 self-end! text-sm font-bold bg-spotify-green hover:bg-spotify-green/80 border-none"
        />
      </div>
    </div>
  );
};

export default CommentComposer;
