import api from "../utils/api";
import type { PostFormData } from "../components/profile/types";

export const discussionController = {
  getMyPosts: () => api.get("/user-profile/posts"),
  updatePost: (postId: string, postForm: PostFormData) =>
    api.put(`/post/${postId}`, postForm),
  deletePost: (postId: string) => api.delete(`/post/${postId}`),
  likePost: (postId: string) => api.post(`/post/${postId}/like`),
  unlikePost: (postId: string) => api.delete(`/post/${postId}/like`),
  reportPost: (postId: string, reason: string) =>
    api.post(`/post/${postId}/report`, { reason }),
  createComment: (postId: string, text: string) =>
    api.post(`/post/${postId}/comments`, { text }),
  likeComment: (commentId: string) => api.post(`/comment/${commentId}/like`),
  unlikeComment: (commentId: string) =>
    api.delete(`/comment/${commentId}/like`),
  reportComment: (commentId: string, reason: string) =>
    api.post(`/comment/${commentId}/report`, { reason }),
};
