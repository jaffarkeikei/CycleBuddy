# 🔌 CycleBuddy API Documentation

## Overview

The CycleBuddy API provides secure endpoints for managing user data, authentication, and community interactions. All endpoints use HTTPS and require authentication unless specified otherwise.

## API Architecture

```mermaid
graph TD
    A[API Gateway] --> B[Auth API]
    A --> C[Data API]
    A --> D[Community API]
    A --> E[Analytics API]
    
    B --> F[Passkey Service]
    C --> G[Storage Service]
    D --> H[Moderation Service]
    E --> I[ML Service]
    
    style A fill:#ff9999
    style B fill:#99ff99
    style C fill:#9999ff
    style D fill:#ffff99
    style E fill:#ff99ff
    style F fill:#99ffff
    style G fill:#ffcc99
    style H fill:#ccff99
    style I fill:#ff99cc
```

## Base URL

```
Production: https://api.cyclebuddy.com/v1
Staging: https://api-staging.cyclebuddy.com/v1
Development: http://localhost:3000/v1
```

## Authentication

### Passkey Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant B as Blockchain
    
    C->>A: POST /auth/challenge
    A->>C: Return Challenge
    C->>A: POST /auth/verify
    A->>B: Verify Signature
    B->>A: Confirmation
    A->>C: Return JWT Token
```

### Endpoints

#### 1. Request Authentication Challenge
```http
POST /auth/challenge
Content-Type: application/json

{
  "username": "string"
}
```

Response:
```json
{
  "challenge": "string",
  "expires_at": "timestamp"
}
```

#### 2. Verify Authentication
```http
POST /auth/verify
Content-Type: application/json

{
  "challenge": "string",
  "signature": "string"
}
```

Response:
```json
{
  "token": "string",
  "expires_at": "timestamp"
}
```

## User Data API

### Data Flow

```mermaid
graph LR
    A[Client] --> B[API Gateway]
    B --> C[Data Service]
    C --> D[Smart Contract]
    D --> E[IPFS Storage]
    
    style A fill:#ff9999
    style B fill:#99ff99
    style C fill:#9999ff
    style D fill:#ffff99
    style E fill:#ff99ff
```

### Endpoints

#### 1. Store Cycle Data
```http
POST /data/cycle
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-05-14",
  "symptoms": ["string"],
  "mood": "string",
  "notes": "string"
}
```

Response:
```json
{
  "id": "string",
  "timestamp": "string",
  "status": "success"
}
```

#### 2. Retrieve Cycle History
```http
GET /data/cycle
Authorization: Bearer <token>
Query Parameters:
  - start_date: string (YYYY-MM-DD)
  - end_date: string (YYYY-MM-DD)
```

Response:
```json
{
  "cycles": [
    {
      "id": "string",
      "date": "string",
      "symptoms": ["string"],
      "mood": "string",
      "notes": "string"
    }
  ]
}
```

## Community API

### Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as API
    participant M as Moderation
    participant S as Storage
    
    U->>A: Create Post
    A->>M: Check Content
    M-->>A: Approval
    A->>S: Store Post
    S-->>A: Confirmation
    A-->>U: Success
```

### Endpoints

#### 1. Create Post
```http
POST /community/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "tags": ["string"],
  "anonymous": boolean
}
```

Response:
```json
{
  "id": "string",
  "timestamp": "string",
  "status": "pending|approved|rejected"
}
```

#### 2. Get Posts
```http
GET /community/posts
Authorization: Bearer <token>
Query Parameters:
  - page: number
  - limit: number
  - tags: string[]
```

Response:
```json
{
  "posts": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "tags": ["string"],
      "created_at": "timestamp",
      "author": "anonymous|username"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number
  }
}
```

## Analytics API

### Data Flow

```mermaid
graph TD
    A[Raw Data] --> B[Processing]
    B --> C[ML Analysis]
    C --> D[Predictions]
    D --> E[Recommendations]
    
    style A fill:#ff9999
    style B fill:#99ff99
    style C fill:#9999ff
    style D fill:#ffff99
    style E fill:#ff99ff
```

### Endpoints

#### 1. Get Predictions
```http
GET /analytics/predictions
Authorization: Bearer <token>
```

Response:
```json
{
  "next_cycle": {
    "start_date": "string",
    "confidence": number
  },
  "symptoms": [
    {
      "type": "string",
      "likelihood": number
    }
  ]
}
```

#### 2. Get Insights
```http
GET /analytics/insights
Authorization: Bearer <token>
Query Parameters:
  - period: string (3m|6m|1y)
```

Response:
```json
{
  "cycle_length": {
    "average": number,
    "variation": number
  },
  "common_symptoms": [
    {
      "name": "string",
      "frequency": number
    }
  ],
  "patterns": [
    {
      "type": "string",
      "description": "string"
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 422  | Validation Error |
| 429  | Rate Limit Exceeded |
| 500  | Server Error |

## Rate Limiting

```mermaid
graph LR
    A[Request] --> B{Rate Check}
    B -->|Within Limit| C[Process]
    B -->|Exceeded| D[429 Error]
    
    style A fill:#ff9999
    style B fill:#99ff99
    style C fill:#9999ff
    style D fill:#ffff99
```

- Rate limit: 100 requests per minute
- Headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Webhooks

### Available Events
```json
{
  "cycle.started": "Triggered when a new cycle starts",
  "prediction.updated": "Triggered when predictions are updated",
  "post.moderated": "Triggered when a post is moderated"
}
```

### Webhook Format
```json
{
  "event": "string",
  "timestamp": "string",
  "data": {}
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { CycleBuddyClient } from '@cyclebuddy/sdk';

const client = new CycleBuddyClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Authentication
const token = await client.auth.authenticate();

// Store cycle data
await client.data.storeCycle({
  date: '2025-05-14',
  symptoms: ['headache'],
  mood: 'good'
});

// Get predictions
const predictions = await client.analytics.getPredictions();
```

## Best Practices

1. **Authentication**
   - Always use HTTPS
   - Implement token refresh
   - Handle token expiration

2. **Error Handling**
   - Implement retry logic
   - Log errors properly
   - Provide user feedback

3. **Performance**
   - Use pagination
   - Implement caching
   - Optimize payloads

## Testing

### Endpoints
```bash
# Test environment
https://api-test.cyclebuddy.com/v1

# Test credentials
API_KEY=test_key_123
```

### Postman Collection
Download our Postman collection for easy API testing:
[CycleBuddy.postman_collection.json](https://api.cyclebuddy.com/postman)

## Support

For API support:
- Documentation: https://docs.cyclebuddy.com
- Email: api@cyclebuddy.com
- Status: https://status.cyclebuddy.com 