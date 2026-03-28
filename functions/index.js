const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// The API key is stored in Firebase Secret Manager, never exposed to the client
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Cloud Function: generateAiResponse
 * 
 * Proxies chat messages to the Google Gemini API so the API key
 * stays server-side. Called from the frontend via Firebase callable functions.
 */
exports.generateAiResponse = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to use the AI assistant."
      );
    }

    const { message, aiModel, aiMode } = request.data;

    if (!message || typeof message !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "A valid message string is required."
      );
    }

    // Build system prompt from AI model and mode selections
    let systemPrompt = "You are RailaAI, a helpful assistant in a group chat. ";

    switch (aiModel) {
      case "Trip Planner":
        systemPrompt +=
          "You are acting as a world-class trip planner. Give detailed itineraries, budget ideas, and hidden gems.";
        break;
      case "Date Planner":
        systemPrompt +=
          "You are acting as a creative date planner. Suggest unique and fun date ideas, from simple to extravagant.";
        break;
      case "Budgeting":
        systemPrompt +=
          "You are acting as a strict but helpful budgeting assistant. Give practical financial advice.";
        break;
      case "Homework Help":
        systemPrompt +=
          "You are acting as a patient and encouraging homework helper. Explain concepts clearly and guide the user step by step.";
        break;
      default:
        systemPrompt +=
          "You are a general-purpose AI. Be helpful and concise.";
    }

    if (aiMode === "Chada") {
      systemPrompt +=
        " Your personality is 'Chada'. You are very frank, open, sassy, and can use *mild* street-smart humor or roast the user lightly. Keep it PG-13 and never be truly offensive, but do be informal and blunt.";
    } else {
      systemPrompt +=
        " Your personality is 'Sushil'. You are extremely polite, formal, kind, and helpful to everyone. You are very nice.";
    }

    const aiText = await callGemini(systemPrompt, message);
    return { text: aiText };
  }
);

/**
 * Cloud Function: summarizeRoom
 *
 * Reads the last 50 messages from a chat room and generates a
 * concise summary using Gemini. Useful for catching up on missed
 * conversations without scrolling through history.
 */
exports.summarizeRoom = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to use room summaries."
      );
    }

    const { chatId } = request.data;

    if (!chatId || typeof chatId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "A valid chatId is required."
      );
    }

    // Determine collection path
    const messagesPath =
      chatId === "public"
        ? "messages"
        : `chats/${chatId}/messages`;

    // Fetch last 50 messages
    const snapshot = await db
      .collection(messagesPath)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return { summary: "No messages in this room yet." };
    }

    // Build transcript (oldest first)
    const transcript = [];
    snapshot.docs.reverse().forEach((docSnap) => {
      const d = docSnap.data();
      const sender =
        d.uid === "RailaAI"
          ? "RailaAI"
          : d.email
          ? d.email.split("@")[0]
          : "User";
      transcript.push(`${sender}: ${d.text}`);
    });

    const systemPrompt =
      "You are a helpful assistant. Summarize the following group chat conversation in 3-5 concise bullet points. " +
      "Focus on key topics discussed, decisions made, and any action items. Be brief and clear.";

    const userMessage = transcript.join("\n");
    const summary = await callGemini(systemPrompt, userMessage);
    return { summary };
  }
);

// --- Shared helper: call Gemini API ---
async function callGemini(systemPrompt, userMessage) {
  const apiKey = geminiApiKey.value();
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: userMessage }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API error:", response.status, errorBody);
      throw new HttpsError(
        "internal",
        "AI service returned an error. Please try again."
      );
    }

    const result = await response.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new HttpsError("internal", "AI returned an empty response.");
    }

    return aiText;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error("Gemini fetch error:", error);
    throw new HttpsError("internal", "Failed to reach the AI service.");
  }
}
