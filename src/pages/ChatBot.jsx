import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! 🌸 I’m your AI StreakBuddy. How are you feeling today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5003/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const cleanReply = data.reply.replace(/\*/g, ""); // remove any markdown stars
      setMessages((prev) => [...prev, { role: "assistant", content: cleanReply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => e.key === "Enter" && sendMessage();

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.25 }}
            className="w-80 sm:w-96 h-[500px] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3">
              <span className="font-semibold">🌸 StreakBuddy</span>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 p-1 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 p-4 overflow-y-auto flex flex-col gap-3 bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`max-w-[75%] px-3 py-2 text-sm rounded-2xl shadow-md ${
                      msg.role === "user"
                        ? "self-end bg-gradient-to-tr from-purple-500 to-indigo-500 text-white"
                        : "self-start bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="self-start flex items-center gap-2 text-gray-500"
                  >
                    <span>StreakBuddy is typing</span>
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 flex gap-2 border-t border-gray-200 bg-white/80 backdrop-blur-md">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 rounded-full px-4 py-2 bg-white border border-gray-300 outline-none placeholder-gray-500 focus:ring-2 focus:ring-purple-400 transition text-sm"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-full bg-purple-600 text-white font-medium shadow-md hover:bg-purple-700 transition text-sm"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button with Tooltip */}
      {!open && (
        <div className="relative group">
          <button
            onClick={() => setOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg flex items-center gap-2 transition"
          >
            <MessageCircle size={26} />
          </button>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            Hey, your StreakBuddy is here 💜
          </span>
        </div>
      )}

      {/* Styles */}
      <style>
        {`
          @keyframes bounce {0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); }}
          .animate-bounce { animation: bounce 0.6s infinite; }
          .delay-150 { animation-delay: 0.15s; }
          .delay-300 { animation-delay: 0.3s; }
        `}
      </style>
    </div>
  );
}

export default Chatbot;
