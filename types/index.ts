// Category
export interface Category {
    id?: number;
    name: string;
    description: string | null;
}

// Document
export interface Document {
    id?: number;
    filename: string;
    title: string;
    category_id: number;
    author: string | null;
    description: string | null;
    content_text: string | null;
    file_size: number;
    file_url: string;
    public_id: string;
    view_count: number;
    createdAt: string | Date;
    updatedAt: string | Date;
}

// News
export interface News {
    id?: number;
    title: string;
    visual_content: string[] | null;
    content: string;
    source: string | null;
    source_id: string | null;
    message_id: string | null;
    published_date: Date | null;
    created_by: string | null;
}

// User
export interface User {
    id?: number;
    username: string;
    email: string;
    phone_number: string;
    password_hash: string;
    role: string;
}

// Landing
export interface Landing {
    id?: number;
    hero_title: string;
    logo_url: string | null;
    hero_image_url: string | null;
    hero_description: string;
    hero_sub_description: string;
    about_us: string;
    office_location: string | null;
    news_description: string | null;
}

// Testimonial
export interface Testimonial {
    id?: number;
    client: string;
    position: string;
    content: string;
}

// Contact Us Info
export interface ContactUsInfo {
    id?: number;
    medium: string;
    email: string | null;
    phone_number: string | null;
  }