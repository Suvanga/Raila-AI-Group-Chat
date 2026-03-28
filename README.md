# Raila AI Chat

Realtime chat platform built with React, Firebase, and Google Gemini. Features room-based messaging, persistent direct messages, online presence, unread counts, typing indicators, and AI-generated room summaries — all backed by Firebase Cloud Functions so no secrets touch the browser.

## Live Demo

[Add link here]

## Screenshots

[Add 3-5 screenshots or GIFs here]

- Sign-in screen
- Main chat room with AI summary panel
- Sidebar with unread badges and DM list
- Typing indicator and presence dots
- Mobile layout with hamburger sidebar

## Why We Built It

Raila AI Chat started as a collaborative idea between me and my friend Suvanga. We wanted to build a modern group chat product — not a messaging demo, but something that feels like a real collaborative tool with proper realtime infrastructure.

Suvanga started the initial implementation. I joined to push the project toward production quality: proper backend architecture, first-class DMs, presence system, unread state, AI features behind Cloud Functions, and Firestore security rules.

## My Contributions

- **Backend AI architecture** — moved all Gemini API calls to Firebase Cloud Functions (`generateAiResponse`, `summarizeRoom`); API key stored in Secret Manager, never exposed client-side
- **AI room summaries** — one-click summary of the last 50 messages in any chat, powered by Gemini via Cloud Function
- **First-class DMs** — persistent Firestore DM documents with `isDM` flag, deterministic chat IDs, member info storage, sidebar integration with avatars
- **Online presence** — Firestore-backed online/offline tracking with `lastSeen` timestamps, auto-updates on visibility change and page unload
- **Typing indicators** — real-time per-chat typing status via Firestore sub-collections, debounced input tracking, status bar with multi-user display
- **Unread counts** — per-room unread message badges, `lastRead` timestamps per user, auto-mark-as-read on chat open
- **Custom hooks architecture** — extracted `useAuth`, `useMessages`, `useChatList`, `usePresence`, `useUnread` for clean state separation
- **Firestore security rules** — members-only read/write for chats, messages, and typing; user-scoped presence and lastRead writes
- **UI/CSS overhaul** — polished dark theme, mobile-responsive sidebar, animated typing indicators, loading/empty/error states, AI-styled messages, summary panel
- **Bug fixes** — CreateGroupModal integration, prop wiring across App/Sidebar/ChatRoom, broken AI model case, conflicting Vite CSS

## Current Features

- **Auth** — Firebase Authentication with Google sign-in
- **Realtime chat** — room-based group messaging with Firestore `onSnapshot`
- **Group creation** — modal with member search and selection
- **Direct messages** — persistent 1-on-1 chats with Firestore documents, shown in sidebar
- **AI assistant** — `@RailaAI` mention triggers server-side Gemini response via Cloud Function
- **AI room summaries** — one-click summarize button generates a bullet-point recap of recent messages
- **Online presence** — online/offline status and last-seen timestamps
- **Typing indicators** — real-time "X is typing..." status bar with animated dots
- **Unread counts** — per-room badge counts, auto-cleared on open
- **Emoji picker** — inline emoji selection via `emoji-picker-react`
- **User search** — find and start conversations with other users
- **Message quality** — sender names, formatted timestamps, loading/empty/error states
- **Mobile responsive** — hamburger sidebar toggle with overlay
- **Security rules** — Firestore rules enforce member-only access to chats and messages

## Planned Features

- Room membership controls and admin roles
- Moderation tools
- Semantic search across chat history
- Message delivery receipts
- Push notifications

## Tech Stack

- **Frontend** — React 19, Vite 7, CSS (custom dark theme)
- **Auth** — Firebase Authentication (Google provider)
- **Database** — Cloud Firestore (realtime subscriptions)
- **Backend** — Firebase Cloud Functions v2 (Node 18)
- **AI** — Google Gemini API (proxied server-side)
- **Secrets** — Firebase Secret Manager
- **Libraries** — emoji-picker-react, firebase SDK

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  React Frontend (Vite)                              │
│                                                     │
│  useAuth ─── Firebase Auth (Google sign-in)         │
│  useMessages ── Firestore onSnapshot (realtime)     │
│  useChatList ── groups + DMs from chats collection  │
│  usePresence ── presence/{uid} documents            │
│  useUnread ── lastRead timestamps vs message times  │
│                                                     │
│  ChatRoom ──→ httpsCallable('generateAiResponse')   │
│  App ────────→ httpsCallable('summarizeRoom')       │
└───────────────────────┬─────────────────────────────┘
                        │ Firebase callable
┌───────────────────────▼─────────────────────────────┐
│  Cloud Functions (v2)                               │
│                                                     │
│  generateAiResponse ── auth check → prompt → Gemini │
│  summarizeRoom ─────── auth check → fetch messages  │
│                        → build transcript → Gemini  │
│                                                     │
│  GEMINI_API_KEY stored in Secret Manager            │
└─────────────────────────────────────────────────────┘
```

**Firestore data model:**

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profile (displayName, photoURL) |
| `users/{uid}/lastRead/{chatId}` | Timestamp of last read per chat |
| `messages/{id}` | Public chat messages |
| `chats/{chatId}` | Chat metadata (isGroup, isDM, members, membersInfo) |
| `chats/{chatId}/messages/{id}` | Group/DM messages |
| `chats/{chatId}/typing/{uid}` | Real-time typing indicators |
| `presence/{uid}` | Online status and lastSeen |

## Project Structure

```
src/
  App.jsx                        # Root layout, auth, sidebar, chat panel, AI summary
  App.css                        # Full application styles (dark theme)
  main.jsx                       # React entry point
  index.css                      # Base resets
  firebase-config.js             # Firebase credentials (gitignored)
  firebase-config.example.js     # Template for contributors
  hooks/
    useAuth.js                   # Auth state subscription
    useMessages.js               # Realtime message subscription with loading/error
    useChatList.js               # Group + DM chat list subscription
    usePresence.js               # Online presence, typing indicators
    useUnread.js                 # Unread counts per chat, mark-as-read
  components/
    ChatRoom.jsx                 # Message list, send form, emoji, AI trigger, typing bar
    ChatMessage.jsx              # Message bubble with avatar, sender, timestamp
    Sidebar.jsx                  # Rooms, DMs, unread badges, user search
    CreateGroupModal.jsx         # Group creation with member selection
    Signin.jsx                   # Google sign-in screen
functions/
  index.js                       # Cloud Functions: generateAiResponse, summarizeRoom
  package.json                   # Functions dependencies
firestore.rules                  # Security rules (members-only access)
```

## Local Setup

```bash
git clone https://github.com/Suvanga/Raila-AI-Group-Chat.git
cd Raila-AI-Group-Chat
npm install
```

Create `src/firebase-config.js` from the example template:

```bash
cp src/firebase-config.example.js src/firebase-config.js
# Fill in your Firebase project credentials
```

Start the dev server:

```bash
npm run dev
```

Deploy Cloud Functions and security rules:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## What I'd Improve Next

- Deploy to production with custom domain
- Add screenshots and a 60-second demo GIF
- Push notifications for new messages
- Message delivery receipts
- Semantic search across chat history with embeddings
- Unit and integration tests

## Resume / Portfolio Framing

Raila AI Chat is best described as:

**Realtime chat platform with Firebase Auth, Firestore messaging, persistent direct messages, online presence, unread state, typing indicators, and AI-generated room summaries via Cloud Functions.**

Strong bullet points for a resume:

- Built a realtime chat platform with Firebase Auth, Firestore subscriptions, persistent DMs, online presence, unread counts, and typing indicators using React custom hooks for clean state separation
- Implemented server-side AI features via Firebase Cloud Functions — chat assistant and one-click room summarization powered by Google Gemini, with API keys secured in Secret Manager

## License

MIT
