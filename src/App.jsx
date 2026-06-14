import { useState, useRef, useEffect } from "react";

const CLINIC_CONTEXT = `You are the friendly AI assistant for DRBPLUS Neuropsychiatric Clinic, run by Dr. Biswadeep Borthakur in Assam, India.

CLINIC INFO:
- Doctor: Dr. Biswadeep Borthakur (Psychiatrist)
- Locations: Margherita (NH 315, Margherita 786181, Assam) and Digboi, Assam
- Hours: Margherita 9 AM to 2 PM daily except Saturday (Saturday closed), plus 5:30 PM to 7 PM by prior appointment only. Digboi Monday to Friday 2:30 PM to 5 PM.
- Phone/WhatsApp: +91 94351 66121
- Email: drbborthakur@gmail.com
- Instagram: @drb_plus
- Facebook: DRB PLUS Neuro-Psychiatric Clinic
- Booking: Chat with us on WhatsApp +91 94351 66121 (quickest way), or Practo (search DRBPLUS), or DaySchedule.

SERVICES:
- General Psychiatry consultations
- Depression & Anxiety treatment
- Bipolar Disorder management
- Schizophrenia & Psychosis treatment
- OCD treatment
- ADHD assessment and management
- Dementia & Memory disorders
- Addiction & De-addiction services
- Child & Adolescent Psychiatry
- Psychotherapy & Counselling
- Online / Teleconsultation available

APPOINTMENT BOOKING:
- WhatsApp: +91 94351 66121 (Chat with us — quickest way)
- Practo: Search "DRBPLUS"
- DaySchedule: Available online
- Walk-ins welcome during clinic hours

IMPORTANT GUIDELINES:
- Always be warm, empathetic, and non-judgmental
- Encourage users to book appointments for medical concerns
- Never diagnose or prescribe — always recommend consulting Dr. Borthakur
- For emergencies or crises, provide NIMHANS helpline: 080-46110007 and iCall: 9152987821
- Respond in the same language the user writes in (Hindi, Assamese, or English)
- Keep responses concise and helpful
- If someone seems distressed, show empathy first before giving information`;

const SUGGESTED_QUESTIONS = [
  "How do I book an appointment?",
  "What are the clinic timings?",
  "Do you offer online consultations?",
  "What conditions does Dr. Borthakur treat?",
];

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm the DRBPLUS virtual assistant. I can help you with appointment booking, clinic information, and general queries about our services.\n\nHow can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    setError(null);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: CLINIC_CONTEXT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.content?.[0]?.text || "Sorry, I couldn't get a response.";

      setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>DR</div>
          <div>
            <div style={styles.headerTitle}>DRBPLUS Assistant</div>
            <div style={styles.headerSubtitle}>Dr. Biswadeep Borthakur's Clinic</div>
          </div>
        </div>
        <div style={styles.onlineBadge}>
          <span style={styles.onlineDot}></span>
          Online
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && <div style={styles.botAvatar}>DR</div>}
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
              }}
            >
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.botAvatar}>DR</div>
            <div style={{ ...styles.bubble, ...styles.botBubble }}>
              <div style={styles.typingDots}>
                <span style={{ ...styles.dot, animationDelay: "0ms" }}></span>
                <span style={{ ...styles.dot, animationDelay: "150ms" }}></span>
                <span style={{ ...styles.dot, animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions — show only at the start */}
      {messages.length === 1 && (
        <div style={styles.suggestionsContainer}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button key={i} style={styles.suggestionBtn} onClick={() => sendMessage(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message… (Enter to send)"
          style={styles.textarea}
          rows={1}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            ...styles.sendBtn,
            opacity: !input.trim() || loading ? 0.5 : 1,
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>

      {/* WhatsApp CTA */}
      <a
        href="https://wa.me/919435166121?text=Hi%2C%20I'd%20like%20to%20book%20an%20appointment%20at%20DRB%20PLUS%20Clinic"
        target="_blank"
        rel="noopener noreferrer"
        style={styles.whatsappCta}
      >
        💬 Chat with us on WhatsApp – DRB PLUS Clinic
      </a>

      {/* Footer */}
      <div style={styles.footer}>
        📍 Margherita & Digboi, Assam &nbsp;|&nbsp; 📞 +91 94351 66121
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        textarea:focus { outline: none; }
        button:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: "720px",
    margin: "0 auto",
    backgroundColor: "#f8f9fa",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    backgroundColor: "#0a5c44",
    color: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    color: "white",
    border: "2px solid rgba(255,255,255,0.4)",
  },
  headerTitle: {
    fontWeight: "600",
    fontSize: "16px",
  },
  headerSubtitle: {
    fontSize: "12px",
    opacity: 0.85,
    marginTop: "2px",
  },
  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#4ade80",
    display: "inline-block",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  botAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#0a5c44",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "18px",
    fontSize: "14px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },
  botBubble: {
    backgroundColor: "white",
    color: "#1a1a1a",
    borderBottomLeftRadius: "4px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  userBubble: {
    backgroundColor: "#0a5c44",
    color: "white",
    borderBottomRightRadius: "4px",
  },
  typingDots: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
    padding: "4px 2px",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#aaa",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  errorBox: {
    backgroundColor: "#fff3f3",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    margin: "0 4px",
  },
  suggestionsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "4px 16px 12px",
  },
  suggestionBtn: {
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "20px",
    padding: "7px 14px",
    fontSize: "13px",
    color: "#0a5c44",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "12px 16px",
    backgroundColor: "white",
    borderTop: "1px solid #e5e7eb",
  },
  textarea: {
    flex: 1,
    border: "1px solid #d1d5db",
    borderRadius: "22px",
    padding: "10px 16px",
    fontSize: "14px",
    resize: "none",
    fontFamily: "inherit",
    backgroundColor: "#f9fafb",
    color: "#1a1a1a",
    lineHeight: "1.4",
    maxHeight: "120px",
    overflowY: "auto",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#0a5c44",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  whatsappCta: {
    display: "block",
    textAlign: "center",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#25D366",
    textDecoration: "none",
  },
  footer: {
    textAlign: "center",
    padding: "8px 16px",
    fontSize: "11px",
    color: "#6b7280",
    backgroundColor: "white",
    borderTop: "1px solid #f3f4f6",
  },
};
