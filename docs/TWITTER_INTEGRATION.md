# Twitter Integration

This document describes the Twitter integration feature for the news system.

## Overview

When creating news articles, the system automatically posts them to Twitter (X) in addition to Telegram. LinkedIn integration is currently commented out as requested.

## Environment Variables

The following environment variables are required for Twitter integration:

```env
TWITTER_API_KEY=your_api_key
TWITTER_API_KEY_SECRET=your_api_key_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_APP_ID=your_app_id
```

## Features

### News Creation
- When a news article is created, it's automatically posted to Twitter
- The tweet includes:
  - News title
  - First 200 characters of content (truncated if longer)
  - Hashtags (if provided)
  - Up to 4 images (if uploaded)
- Tweet content is automatically truncated to fit Twitter's 280-character limit

### News Updates
- When a news article is updated, the corresponding Twitter post is updated
- Since Twitter doesn't support editing tweets, the old tweet is deleted and a new one is created

### News Deletion
- When a news article is deleted, the corresponding Twitter post is also deleted

## Technical Implementation

### Backend Functions

1. **`uploadImageToTwitter(imageBuffer: Buffer)`**
   - Uploads images to Twitter's media API
   - Returns media ID for use in tweets

2. **`sendNewsToTwitter(newsData: any, imageBuffers?: Buffer[])`**
   - Creates a tweet with the news content
   - Handles image uploads and media attachments
   - Returns the tweet ID

3. **`editTwitterPost(twitterPostId: number, newsData: any, imageBuffers?: Buffer[])`**
   - Deletes the old tweet and creates a new one
   - Used for updating news articles

4. **`deleteFromTwitter(twitterPostId: number)`**
   - Deletes a tweet from Twitter

### Database Schema

The `news` table includes a `twitter_message_id` field to store the Twitter post ID:

```sql
twitter_message_id: integer('twitter_message_id')
```

### API Integration

The Twitter integration uses Twitter API v2 with OAuth 1.0a authentication. The system:

- Uses the `oauth-1.0a` package for OAuth signature generation
- Posts to the `/2/tweets` endpoint for creating tweets
- Uses the media upload endpoint for images
- Handles rate limiting and error responses gracefully

## Error Handling

- If Twitter credentials are not configured, the system logs a warning but continues with news creation
- If Twitter API calls fail, the error is logged but doesn't prevent news creation
- Image upload failures are handled gracefully - the tweet is still posted without images

## Testing

Use the "Test Twitter Integration" button in the server storage test page to verify the integration is working correctly.

## Limitations

- Twitter has a 280-character limit for tweets
- Maximum 4 images per tweet
- Twitter doesn't support editing tweets (only delete and recreate)
- Rate limiting applies to Twitter API calls

## Future Enhancements

- Add support for Twitter threads for longer content
- Implement better error handling and retry logic
- Add Twitter analytics tracking
- Support for Twitter Spaces integration 