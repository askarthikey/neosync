# MongoDB Chat Messages Collection Setup

## Collection: chat_messages

### Document Structure:
```javascript
{
  _id: ObjectId("..."),              // MongoDB auto-generated ID
  id: "msg_1696345678901_abc123",    // Custom message ID for client-side tracking
  project_id: "project123",          // Project identifier
  message: "Hello, how's the project going?", // Message content
  sender: "john.doe@example.com",    // User who sent the message
  message_type: "text",              // Type: "text", "status-update", "priority-update"
  created_at: ISODate("2025-10-03T10:30:00Z") // Message timestamp
}
```

### Indexes (Optional for better performance):
```javascript
// Create indexes in MongoDB shell or MongoDB Compass:

// Index for faster project-based queries
db.chat_messages.createIndex({ "project_id": 1 })

// Index for sorting by timestamp
db.chat_messages.createIndex({ "created_at": 1 })

// Compound index for project + timestamp (most efficient for chat loading)
db.chat_messages.createIndex({ "project_id": 1, "created_at": 1 })
```

### Connection Settings:
- Database: `neosync`
- Collection: `chat_messages`
- Connection URL: Set in `MONGO_URL` environment variable (default: `mongodb://localhost:27017`)

### Usage:
The chat messages are automatically stored when users send messages through the real-time chat interface. No manual setup required - the collection will be created automatically when the first message is sent.

### Data Retention:
Messages are stored permanently unless manually deleted using the DELETE endpoint:
`DELETE /chatApi/project/:projectId/messages`