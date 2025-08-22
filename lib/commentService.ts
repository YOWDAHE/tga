import axios from 'axios';
import { patch, del } from './axiosWrapper';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tgalawgroup.com/office/api';

export interface Comment {
    id: number;
    news_id: number;
    user_name: string;
    content: string;
    likes: string[]; // Array of usernames who liked
    dislikes: string[]; // Array of usernames who disliked
    likes_count: number; // Number of likes
    dislikes_count: number; // Number of dislikes
    liked: boolean; // Whether current user liked this comment
    disliked: boolean; // Whether current user disliked this comment
    visible: boolean;
    edited: boolean;
    flagged: boolean;
    flagged_reason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentData {
    news_id: number;
    user_name: string;
    content: string;
}

export const commentService = {
    // Fetch comments for a specific news article with optional username
    async getCommentsByNewsId(newsId: number, username?: string): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
        try {
            const url = new URL(`${API_BASE_URL}/public/comments/news/${newsId}`);
            if (username) {
                url.searchParams.set('username', username);
            }
            
            const response = await axios.get(url.toString());
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error fetching comments:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to fetch comments'
            };
        }
    },

    // Create a new comment
    async createComment(commentData: CreateCommentData): Promise<{ success: boolean; data?: Comment; error?: string }> {
        try {
            const response = await axios.post(`${API_BASE_URL}/public/comments`, commentData);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error creating comment:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to create comment'
            };
        }
    },

    // Toggle like/dislike on a comment
    async toggleLike(commentId: number, username: string, action: 'like' | 'dislike'): Promise<{ success: boolean; data?: Comment; error?: string }> {
        try {
            const response = await axios.patch(`${API_BASE_URL}/public/comments/${commentId}/toggle-like`, {
                username,
                action
            });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error toggling like:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to toggle like'
            };
        }
    },

    // Admin actions - require authentication
    async toggleCommentFlag(commentId: number, reason?: string): Promise<{ success: boolean; data?: Comment; error?: string }> {
        try {
            const response = await axios.patch(`${API_BASE_URL}comments/${commentId}/toggle-flag`, { reason });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error toggling comment flag:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to toggle comment flag'
            };
        }
    },

    async toggleCommentVisibility(commentId: number, reason?: string): Promise<{ success: boolean; data?: Comment; error?: string }> {
        try {
            const response = await axios.patch(`${API_BASE_URL}/comments/${commentId}/toggle-visibility`, { reason });
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error toggling comment visibility:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to toggle comment visibility'
            };
        }
    },

    async deleteComment(commentId: number): Promise<{ success: boolean; data?: Comment; error?: string }> {
        try {
            const response = await axios.delete(`${API_BASE_URL}/comments/${commentId}`);
            return {
                success: true,
                data: response.data.data
            };
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            return {
                success: false,
                error: error?.response?.data?.error || error?.message || 'Failed to delete comment'
            };
        }
    }
}; 