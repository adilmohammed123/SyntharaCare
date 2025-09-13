import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import MedicalChatbot from "./MedicalChatbot";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        title="Ask Medical AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />

        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20"></div>

        {/* Tooltip */}
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
          Ask Medical AI Assistant
          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </button>

      {/* Chatbot Modal */}
      <MedicalChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FloatingChatbot;

