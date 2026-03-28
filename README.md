# Raila AI Chat

Realtime group chat application built with React, Vite, Firebase Auth, and Firestore. Supports room-based messaging, group creation, emoji reactions, user search, and AI-assisted conversations via Google Gemini. The long-term direction is to turn it into a portfolio-grade realtime communication product with AI-assisted conversation features.

## Live Demo

[Add link here]

## Screenshots

[Add 3-5 screenshots or GIFs here]

- Sign-in screen
- Main chat room
- Sidebar / room switching
- Search + emoji flow
- Mobile layout

## Why We Built It

Raila AI Chat started as a collaborative idea between me and my friend Suvanga. We wanted to build a modern group chat product and explore what it would take to make it feel like a real collaborative app rather than a simple messaging demo.

Suvanga started the initial implementation while I was focused on other projects. I am actively improving the product and shaping it into a stronger portfolio project with clearer realtime architecture, better UX, and eventually AI-assisted chat features.

## My Contributions

Raila AI Chat was a shared product idea between me and Suvanga. Suvanga began the initial implementation while I was busy with other projects, and I am actively developing and improving the app to make it production-quality and portfolio-worthy.

My role includes:

- Defining the product direction and feature roadmap
- Improving the realtime chat experience and UX
- Expanding the technical scope toward private chat, presence, unread state, and AI-assisted features
- Helping shape the app into a stronger engineering case study

## Current Features

- Firebase Authentication (Google sign-in)
- Realtime room-based group chat
- Group chat creation with member search
- Private 1-on-1 messaging
- Room switching sidebar
- Emoji picker support
- User search
- AI chat assistant (@RailaAI mention with configurable personality)
- Responsive chat interface with mobile sidebar toggle
- Firebase-backed persistence
- Message timestamps and sender display names

## Planned Features

- Typing indicators
- Online presence / last seen
- Unread counts
- Room membership controls
- Admin / moderation tools
- AI-generated room summaries
- Semantic search across chat history

## Tech Stack

- React 19
- Vite 7
- Firebase Auth
- Firestore
- Google Gemini API
- emoji-picker-react
- JavaScript (ES Modules)
- CSS (custom dark theme)

## Architecture Overview

The frontend is built with React and Vite and uses Firebase Authentication for sign-in. Chat data is stored in Firestore and rendered through a room-based interface with a sidebar for navigation. The app separates the main chat surface, authentication flow, and reusable UI components so the product can grow into a more feature-rich realtime collaboration tool. AI responses are powered by Google Gemini, triggered by @RailaAI mentions in any chat room.

## Project Structure

```
src/
  App.jsx                        # Root layout, auth gate, sidebar + chat panel
  App.css                        # Full application styles (dark theme)
  main.jsx                       # React entry point
  index.css                      # Base resets
  firebase-config.js             # Firebase project credentials (gitignored)
  components/
    ChatRoom.jsx                 # Realtime message list, send form, emoji picker, AI integration
    ChatMessage.jsx              # Individual message bubble with avatar, name, timestamp
    Sidebar.jsx                  # Room list, group chats, user search, private chat
    CreateGroupModal.jsx         # Modal for creating group chats with member selection
    Signin.jsx                   # Google sign-in screen
```

## Local Setup

```bash
git clone https://github.com/Suvanga/Raila-AI-Group-Chat.git
cd Raila-AI-Group-Chat
npm install
```

Create `src/firebase-config.js` with your Firebase project credentials (see `src/firebase-config.example.js` for the template), then:

```bash
npm run dev
```

## What I'd Improve Next

- Add presence and typing indicators
- Improve Firestore data modeling and security rules
- Add production-ready screenshots and live demo link
- Ship more AI features (room summaries, semantic search)
- Add unit and integration tests

## Resume / Portfolio Framing

Raila AI Chat is best described as:

**Realtime group chat web application with Firebase-backed messaging, room management, emoji support, AI-assisted conversations, and planned collaboration features.**

## License

[Add license here]
