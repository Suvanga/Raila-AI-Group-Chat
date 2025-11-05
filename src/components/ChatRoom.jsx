import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import ChatMessage from './ChatMessage.jsx';
import Picker from 'emoji-picker-react'; // <-- Import the emoji picker

// Import the AI props
function ChatRoom({ chatId, chatName, aiModel, aiMode }) {
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false); // <-- State for the picker
  const messagesEndRef = useRef(null);
  
  const messagesCollectionPath = chatId === 'public' 
    ? 'messages' 
    : `chats/${chatId}/messages`;

  // Listen for new messages (same as before)
  useEffect(() => {
    const messagesRef = collection(db, messagesCollectionPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, messagesCollectionPath]);

  // Auto-scroll (same as before)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- NEW: Add emoji to text input ---
  const onEmojiClick = (emojiObject) => {
    setFormValue(prevInput => prevInput + emojiObject.emoji);
    setShowPicker(false); // Close picker after selection
  };

  // --- NEW: Function to post AI message to Firestore ---
  const postAiMessage = async (text) => {
    const messagesRef = collection(db, messagesCollectionPath);
    await addDoc(messagesRef, {
      text: text,
      createdAt: serverTimestamp(),
      uid: "RailaAI", // Special UID for the bot
      email: "bot@raila.ai",
      photoURL: "https://api.dicebear.com/8.x/bottts/svg?seed=RailaAI"
    });
  };

  // --- NEW: Function to call Gemini API ---
  const getAiResponse = async (userMessage) => {
    setIsAiTyping(true);
    
    // 1. Define the System Prompt based on user selections
    let systemPrompt = "You are RailaAI, a helpful assistant in a group chat. ";

    // Add Model instructions
    switch(aiModel) {
      case 'Trip Planner':
        systemPrompt += "You are acting as a world-class trip planner. Give detailed itineraries, budget ideas, and hidden gems.";
        break;
      case 'Date Planner':
        systemPrompt += "You are acting as a creative date planner. Suggest unique and fun date ideas, from simple to extravagant.";
        break;
      case 'Budgeting':
        systemPrompt += "You are acting as a strict but helpful budgeting assistant. Give practical financial advice.";
        break;
      case 'Homework Help':
// ... existingcode ...
        break;
      default: // Generic
        systemPrompt += "You are a general-purpose AI. Be helpful and concise.";
    }

    // Add Mode instructions
    if (aiMode === 'Chada') {
      systemPrompt += " Your personality is 'Chada'. You are very frank, open, sassy, and can use *mild* street-smart humor or roast the user lightly. Keep it PG-13 and never be truly offensive, but do be informal and blunt.";
    } else { // Sushil
      systemPrompt += " Your personality is 'Sushil'. You are extremely polite, formal, kind, and helpful to everyone. You are very nice.";
    }

    // 2. Set up the API call
    const apiKey = ""; // API Key is handled by the environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userMessage }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
    };

    // 3. Make the API call
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        await postAiMessage(aiText);
      } else {
        await postAiMessage("Sorry, I had trouble thinking of a response.");
      }

    } catch (error) {
      console.error("Gemini API Error:", error);
      await postAiMessage("Sorry, I'm having connection issues. Please try again.");
    } finally {
      setIsAiTyping(false);
    }
  };

  // --- UPDATED: Send Message ---
  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = formValue; // Store text before clearing
    if (!messageText.trim()) return;

    const { uid, photoURL, email } = auth.currentUser;
    const messagesRef = collection(db, messagesCollectionPath);

    try {
      // Post the user's message
      await addDoc(messagesRef, {
        text: messageText,
        createdAt: serverTimestamp(),
        uid,
        email,
        photoURL: photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${email}`
      });
      setFormValue(''); // Clear the form

      // --- NEW: Check if AI was mentioned ---
      if (messageText.toLowerCase().includes('@railaai')) {
        // Call the AI in the background
        getAiResponse(messageText);
      }

    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <main className="chat-room">
      {/* --- Chat Header --- */}
      <div className="chat-room-header">
        {/* Display the active chat's name */}
        <h2>{chatName}</h2>
      </div>

      {/* --- Message List --- */}
      <div className="message-list">
        {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        
        {/* --- NEW: Show AI Typing Indicator --- */}
        {isAiTyping && (
          <div className="message-wrapper received">
            <img 
              className="message-avatar"
              src="https://api.dicebear.com/8.x/bottts/svg?seed=RailaAI" 
              alt="RailaAI" 
            />
            <div className="message-content">
              <p>... typing ...</p>
            </div>
          </div>
        )}

        <span ref={messagesEndRef}></span>
      </div>

      {/* --- Send Form --- */}
      <form className="send-form" onSubmit={sendMessage}>
        {/* --- NEW: Emoji Picker --- */}
        {showPicker && (
          <div className="emoji-picker-container">
            <Picker 
              onEmojiClick={onEmojiClick}
              theme="dark"
              skinTonesDisabled
              emojiStyle="google"
            />
          </div>
        )}
        
        {/* --- NEW: Emoji Button --- */}
        <button 
          type="button" 
          className="emoji-btn" 
          onClick={() => setShowPicker(!showPicker)}
        >
          😊
        </button>

        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={`Message #${chatName} (try @RailaAI)`}
          onClick={() => setShowPicker(false)} // Close picker when typing
        />
        <button type="submit" disabled={!formValue.trim()}>
          Send
        </button>
      </form>
    </main>
  );
}

export default ChatRoom;