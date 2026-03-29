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

    const { message, aiModel, aiMode, history } = request.data;

    if (!message || typeof message !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "A valid message string is required."
      );
    }

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

    const conversationHistory = Array.isArray(history) ? history.slice(-10) : [];
    const aiText = await callGemini(systemPrompt, message, conversationHistory);
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

/**
 * Cloud Function: createInviteCode
 *
 * Generates a unique invite code. Only approved users can create invites.
 */
exports.createInviteCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const userDoc = await db.collection("users").doc(request.auth.uid).get();
  const userData = userDoc.data();
  if (!userData?.approved) {
    throw new HttpsError("permission-denied", "Only approved members can create invite codes.");
  }

  const { maxUses = 1, expiresInDays = 7 } = request.data || {};

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Math.min(expiresInDays, 30));

  await db.collection("invites").doc(code).set({
    code,
    createdBy: request.auth.uid,
    createdByName: request.auth.token.name || request.auth.token.email,
    createdAt: new Date(),
    expiresAt,
    maxUses: Math.min(maxUses, 50),
    usedBy: [],
    usedCount: 0,
    active: true,
  });

  return { code, expiresAt: expiresAt.toISOString() };
});

/**
 * Cloud Function: redeemInviteCode
 *
 * Validates an invite code and marks the user as approved.
 */
exports.redeemInviteCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { code } = request.data;
  if (!code || typeof code !== "string") {
    throw new HttpsError("invalid-argument", "A valid invite code is required.");
  }

  const inviteRef = db.collection("invites").doc(code.toUpperCase().trim());
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists()) {
    throw new HttpsError("not-found", "Invalid invite code.");
  }

  const invite = inviteDoc.data();

  if (!invite.active) {
    throw new HttpsError("failed-precondition", "This invite code has been deactivated.");
  }

  if (invite.expiresAt && invite.expiresAt.toDate() < new Date()) {
    throw new HttpsError("failed-precondition", "This invite code has expired.");
  }

  if (invite.usedCount >= invite.maxUses) {
    throw new HttpsError("failed-precondition", "This invite code has reached its usage limit.");
  }

  if (invite.usedBy && invite.usedBy.includes(request.auth.uid)) {
    throw new HttpsError("already-exists", "You have already used this invite code.");
  }

  const batch = db.batch();

  batch.update(inviteRef, {
    usedBy: [...(invite.usedBy || []), request.auth.uid],
    usedCount: (invite.usedCount || 0) + 1,
  });

  const userRef = db.collection("users").doc(request.auth.uid);
  batch.set(userRef, {
    approved: true,
    approvedAt: new Date(),
    inviteCode: code.toUpperCase().trim(),
  }, { merge: true });

  await batch.commit();
  return { success: true };
});

/**
 * Cloud Function: getInviteCodes
 *
 * Admin function to list all invite codes.
 */
exports.getInviteCodes = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const userDoc = await db.collection("users").doc(request.auth.uid).get();
  const userData = userDoc.data();
  if (userData?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const snapshot = await db.collection("invites").orderBy("createdAt", "desc").limit(50).get();
  const codes = [];
  snapshot.forEach((doc) => codes.push({ id: doc.id, ...doc.data() }));

  return { codes };
});

/**
 * Cloud Function: toggleInviteCode
 *
 * Admin function to activate/deactivate an invite code.
 */
exports.toggleInviteCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const userDoc = await db.collection("users").doc(request.auth.uid).get();
  if (userDoc.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const { code, active } = request.data;
  if (!code) throw new HttpsError("invalid-argument", "Code is required.");

  await db.collection("invites").doc(code).update({ active: !!active });
  return { success: true };
});

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function callGemini(systemPrompt, userMessage, history = []) {
  const apiKey = geminiApiKey.value();
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const contents = [];
  for (const msg of history) {
    const role = msg.role === "model" ? "model" : "user";
    const prefix = role === "user" ? `[${msg.sender}]: ` : "";
    contents.push({ role, parts: [{ text: prefix + msg.text }] });
  }
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const payload = {
    contents,
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
