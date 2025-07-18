# API Users Integration Guide

## Overview
This document describes how external websites can integrate with the news system using API users. API users are stored in a separate `api_users` table and use the same JWT authentication system as admin users.

## API Endpoints

### Authentication Endpoints

#### Sign Up
- **URL**: `POST /api/api-auth/signup`
- **Description**: Register a new API user
- **Body**:
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "message": "API user sign up successful",
    "status": "success",
    "error": null,
    "data": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        "is_active": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  }
  ```

#### Sign In
- **URL**: `POST /api/api-auth/signin`
- **Description**: Login with existing API user credentials
- **Body**:
  ```json
  {
    "username": "john_doe",
    "password": "securepassword"
  }
  ```
- **Response**: Same as signup response

#### Refresh Token
- **URL**: `POST /api/api-auth/refresh`
- **Description**: Get a new access token using refresh token
- **Body**:
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```
- **Response**: Same as signup response

#### Get Profile
- **URL**: `GET /api/api-auth/me`
- **Description**: Get current user profile (requires authentication)
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "message": "User profile retrieved successfully",
    "status": "success",
    "error": null,
    "data": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "is_active": true,
      "last_login": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

## Public Data Endpoints

API users can access all public data without authentication:

- `GET /api/homepage` - Homepage data
- `GET /api/categories` - News categories
- `GET /api/news` - News list with filtering
- `GET /api/news/:id` - Single news article
- `GET /api/documents` - Documents list
- `GET /api/public/comments/news/:newsId` - Comments for news

## Example Usage

### JavaScript/React Example
```javascript
class NewsAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('api_access_token');
    this.refreshToken = localStorage.getItem('api_refresh_token');
  }

  // Authentication
  async signup(userData) {
    const response = await fetch(`${this.baseURL}/api/api-auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('api_access_token', this.accessToken);
      localStorage.setItem('api_refresh_token', this.refreshToken);
    }
    return data;
  }

  async signin(credentials) {
    const response = await fetch(`${this.baseURL}/api/api-auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('api_access_token', this.accessToken);
      localStorage.setItem('api_refresh_token', this.refreshToken);
    }
    return data;
  }

  async refreshToken() {
    const response = await fetch(`${this.baseURL}/api/api-auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      this.accessToken = data.data.accessToken;
      localStorage.setItem('api_access_token', this.accessToken);
    }
    return data;
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/api/api-auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    return response.json();
  }

  // Public endpoints
  async getHomepage() {
    const response = await fetch(`${this.baseURL}/api/homepage`);
    return response.json();
  }

  async getNews(page = 1, limit = 10) {
    const response = await fetch(
      `${this.baseURL}/api/news?page=${page}&limit=${limit}`
    );
    return response.json();
  }
}

// Usage
const api = new NewsAPI('https://yourdomain.com');

// Get public data
const homepage = await api.getHomepage();
const news = await api.getNews(1, 10);

// User authentication
await api.signup({
  username: 'john_doe',
  email: 'john@example.com',
  phone_number: '+1234567890',
  password: 'securepassword'
});

// Get user profile
const profile = await api.getProfile();
```

## Security Features

1. **Separate user table**: API users are stored in `api_users` table
2. **JWT authentication**: Uses the same JWT system as admin users
3. **Role-based access**: API users have `API_USER` role
4. **Account status**: Users can be deactivated
5. **Last login tracking**: System tracks when users last logged in
6. **Token refresh**: Long-lived refresh tokens for persistent sessions

## Error Handling

### Common HTTP Status Codes
- `200`: Success
- `201`: Created (for signup)
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid credentials or inactive account)
- `403`: Forbidden (invalid token)
- `409`: Conflict (username/email already exists)
- `500`: Internal Server Error

### Error Response Format
```json
{
  "message": "Error message",
  "status": "error",
  "error": "Error type",
  "data": null
}
```

## Getting Started

1. **Test public endpoints** first to ensure connectivity
2. **Implement user registration/login** in your application
3. **Store tokens securely** (localStorage, sessionStorage, or secure cookies)
4. **Handle token expiration** by using refresh tokens
5. **Use the access token** in Authorization header for authenticated requests

## Database Schema

The `api_users` table structure:
```sql
CREATE TABLE api_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
``` 