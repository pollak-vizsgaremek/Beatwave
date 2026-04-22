import type { ReactNode } from "react";

interface InputProps {
  labelTitle?: string;
  inputType: string;
  inputName: string;
  inputPlaceHolder?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  forgotPwd?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onForgotPasswordClick?: () => void;
}

interface ButtonProps {
  labelTitle: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

interface DiscussionType {
  id: string;
  text: string;
  likeAmount: number;
  isLiked?: boolean;
  hashtags: string;
  postedAt: Date;
  userId: string;
  title: string;
  topic: string;
  user: {
    id: string;
    username: string;
  };
}

interface CommentType {
  id: string;
  text: string;
  likeAmount: number;
  commentedAt: Date;
  userId: string;
  postId: string;
  previousCommentId: string | null;
  isLiked?: boolean;
  user: {
    id: string;
    username: string;
  };
  replies?: CommentType[];
}

interface NotificationType {
  id: string;
  type: string;
  message: string | null;
  link?: string | null;
  read: boolean;
  createdAt: Date;
  userId: string;
  triggeredById: string | null;
}

export type {
  InputProps,
  ButtonProps,
  DiscussionType,
  CommentType,
  NotificationType,
};
