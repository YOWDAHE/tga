import axios from 'axios';
import { patch, del } from './axiosWrapper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Comment {
    id: number;
    news_id: number;
    user_name: string;
    content: string;
    likes: number;
    dislikes: number;
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
    // Fetch comments for a specific news article
    async getCommentsByNewsId(newsId: number): Promise<{ success: boolean; data?: Comment[]; error?: string }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/public/comments/news/${newsId}`);
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