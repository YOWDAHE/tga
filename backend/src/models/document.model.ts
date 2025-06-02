export type document = {
    id: number;
    filename: string;
    title: string;
    category_id: number;
    author?: string;
    content_text: string;
    file_url: string;
}

export type document_create = {
    filename: string;
    title: string;
    category_id: number;
    author?: string;
    content_text?: string;
    file_url: string;
}