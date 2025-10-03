const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

// Get chat messages for a project
router.get('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0 } = req.query; // Pagination support
    
    // Use existing database connection from main app
    const neosync = req.app.get('neosync');
    if (!neosync) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const collection = neosync.collection('chat_messages');
    
    // Optimized query with pagination and indexing
    const messages = await collection
      .find({ project_id: projectId })
      .sort({ created_at: -1 }) // Latest first
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .toArray();

    // Reverse to get chronological order for display
    const chronologicalMessages = messages.reverse();

    res.json({ messages: chronologicalMessages || [] });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Save a chat message
router.post('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { message, sender, messageType = 'text' } = req.body;

    if (!message || !sender) {
      return res.status(400).json({ error: 'Message and sender are required' });
    }

    const messageData = {
      project_id: projectId,
      message: message,
      sender: sender,
      message_type: messageType,
      created_at: new Date(),
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate unique ID
    };

    // Use existing database connection
    const neosync = req.app.get('neosync');
    if (!neosync) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const collection = neosync.collection('chat_messages');
    const result = await collection.insertOne(messageData);
    
    // Return the inserted message with MongoDB _id
    const savedMessage = { ...messageData, _id: result.insertedId };

    res.json({ message: savedMessage });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

// Delete chat messages for a project (optional - for cleanup)
router.delete('/project/:projectId/messages', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Use existing database connection
    const neosync = req.app.get('neosync');
    if (!neosync) {
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const collection = neosync.collection('chat_messages');
    await collection.deleteMany({ project_id: projectId });

    res.json({ message: 'Chat messages deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    res.status(500).json({ error: 'Failed to delete chat messages' });
  }
});

module.exports = router;