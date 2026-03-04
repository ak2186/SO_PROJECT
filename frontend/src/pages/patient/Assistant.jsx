import { useState, useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import "./assistant.css";
import { chatAPI } from "../../utils/api";

export const Assistant = () => {
  const [messages, setMessages] = useState([
    { text: "Hey \ud83d\udc4b How can I help you today?", user: false },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef(null);

  // Load chat history from backend on mount
  useEffect(() => {
    chatAPI.getHistory()
      .then((data) => {
        if (data && data.messages && data.messages.length > 0) {
          const history = data.messages.map((m) => ({
            text: m.content || m.message || m.text,
            user: m.role === "user",
          }));
          setMessages([
            { text: "Hey \ud83d\udc4b How can I help you today?", user: false },
            ...history,
          ]);
        }
      })
      .catch(() => { });
  }, []);

  // Auto Scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isTyping]);

  // Send message via backend API
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, user: true }]);
    setInput("");
    setIsTyping(true);

    try {
      const data = await chatAPI.send(userMessage);
      const reply = data.response || data.message || data.reply || "I received your message.";
      setMessages((prev) => [...prev, { text: reply, user: false }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I couldn't reach the server. Please try again.", user: false },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="assistant-dashboard page-enter">
      <div className="assistant-dashboard-inner tab-animate">
        <div className="page-header">
          <p className="page-label purple">SUPPORT</p>
          <h1>Health Assistant</h1>
          <p className="page-subtext">
            Chat with your AI health assistant here
          </p>
        </div>
        <div className="assistant-wrapper">
          <div className="assistant-card">
            {/* Header */}
            <div className="assistant-header">
              <div className="assistant-icon">
                <Bot size={22} />
              </div>
              <h2 style={{ fontWeight: 20 }}>HEALIX Bot</h2>
            </div>

            {/* Chat Area */}
            <div className="assistant-messages" ref={messagesContainerRef}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={msg.user ? "message user" : "message bot"}
                >
                  {msg.text}
                </div>
              ))}
              {isTyping && (
                <div className="message bot typing">Assistant is typing...</div>
              )}
            </div>

            {/* Input */}
            <div className="assistant-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={input.trim() ? "active" : ""}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
