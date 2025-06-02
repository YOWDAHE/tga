export type category = {
    id: number;
    name: string;
    description?: string;
}

export type category_create = {
    name: string;
    description?: string;
}