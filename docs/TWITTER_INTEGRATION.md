# Twitter Integration

## Overview
The application integrates with Twitter to automatically post news articles when they are created or updated.

## Features
- **Automatic posting**: News articles are automatically posted to Twitter when created
- **Image support**: Up to 4 images can be attached to tweets
- **Hashtag formatting**: Hashtags are automatically formatted with # symbols
- **Smart truncation**: Content is truncated intelligently to preserve hashtags and links
- **News links**: Each tweet includes a link to the full news article

## Environment Variables

### Required Twitter Credentials
```env
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_KEY_SECRET=your_twitter_api_key_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
```

### Frontend URL (for news links)
```env
FRONTEND_URL=https://yourdomain.com
```

## Tweet Format
Tweets follow this format:
```
[News Title]

[Content - truncated if needed]...

[Hashtags with # symbols]

Check out news: https://yourdomain.com/news/[news_id]
```

## Character Limit Handling
- **Total limit**: 280 characters
- **Priority order**:
  1. Hashtags (never truncated)
  2. News link (never truncated)
  3. Content (truncated if needed)
  4. Title (truncated if needed)

## Example Tweet
```
Breaking News: Major Update

The latest developments in technology show significant progress...

#technology #news #update

Check out news: https://yourdomain.com/news/123
```

## Error Handling
- Timeout protection (30 seconds)
- Graceful fallback if Twitter API is unavailable
- Detailed logging for debugging
- Non-blocking errors (won't break news creation/update)

## Testing
To test the Twitter integration:
1. Ensure all environment variables are set
2. Create a news article with hashtags
3. Check the Twitter account for the new post
4. Verify hashtags have # symbols
5. Verify the news link is included 