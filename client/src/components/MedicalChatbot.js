import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Search,
  Pill,
  Stethoscope,
  FileText,
  X,
  Heart,
  Calendar,
  Info
} from "lucide-react";
import { chatbotAPI } from "../utils/api";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const MedicalChatbot = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        user?.role === "doctor"
          ? "Hello Doctor! I'm your medical AI assistant. I can help you with:\n\n• Latest treatments and medications\n• Drug interactions\n• Diagnostic test suggestions\n• Treatment protocols\n• Medical research and guidelines\n\nHow can I assist you today?"
          : "Hello! I'm your medical AI assistant. I can help you with:\n\n• General health information\n• Medication questions\n• Symptom explanations\n• Health tips and advice\n• Understanding medical terms\n\nHow can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchType, setSearchType] = useState("general");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (data) => chatbotAPI.chat(data),
    onSuccess: (response) => {
      setIsTyping(false);
      const newMessage = {
        id: Date.now(),
        type: "bot",
        content: response.response,
        timestamp: response.timestamp
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    onError: (error) => {
      setIsTyping(false);
      toast.error("Failed to get AI response");
      console.error("Chat error:", error);
    }
  });

  const searchMutation = useMutation({
    mutationFn: (data) => chatbotAPI.search(data),
    onSuccess: (response) => {
      setIsTyping(false);
      const newMessage = {
        id: Date.now(),
        type: "bot",
        content: response.response,
        timestamp: response.timestamp,
        searchType: response.searchType
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    onError: (error) => {
      setIsTyping(false);
      toast.error("Failed to search medical information");
      console.error("Search error:", error);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    if (searchType === "general") {
      chatMutation.mutate({ message: inputMessage });
    } else {
      searchMutation.mutate({ query: inputMessage, searchType });
    }

    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions =
    user?.role === "doctor"
      ? [
          {
            icon: Search,
            label: "Search Treatments",
            searchType: "treatments",
            query: "latest treatments for"
          },
          {
            icon: Pill,
            label: "Drug Information",
            searchType: "medications",
            query: "information about medication"
          },
          {
            icon: Stethoscope,
            label: "Diagnostic Tests",
            searchType: "diagnosis",
            query: "diagnostic tests for"
          },
          {
            icon: FileText,
            label: "Treatment Protocol",
            searchType: "procedures",
            query: "treatment protocol for"
          }
        ]
      : [
          {
            icon: Heart,
            label: "Health Information",
            searchType: "general",
            query: "tell me about"
          },
          {
            icon: Pill,
            label: "Medication Help",
            searchType: "medications",
            query: "what is this medication"
          },
          {
            icon: Info,
            label: "Symptom Check",
            searchType: "general",
            query: "what could cause"
          },
          {
            icon: Calendar,
            label: "Health Tips",
            searchType: "general",
            query: "health tips for"
          }
        ];

  const handleQuickAction = (action) => {
    setSearchType(action.searchType);
    setInputMessage(action.query + " ");
  };

  const formatMessage = (content) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-primary-50">
          <div className="flex items-center">
            <Bot className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.role === "doctor"
                  ? "Medical AI Assistant"
                  : "Health AI Assistant"}
              </h2>
              <p className="text-sm text-gray-600">
                Powered by Google Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search Type Selector */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === action.searchType
                    ? "bg-primary-100 text-primary-700 border border-primary-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-start">
                  {message.type === "bot" && (
                    <Bot className="h-5 w-5 mr-2 mt-0.5 text-primary-600 flex-shrink-0" />
                  )}
                  {message.type === "user" && (
                    <User className="h-5 w-5 mr-2 mt-0.5 text-white flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm whitespace-pre-wrap">
                      {formatMessage(message.content)}
                    </div>
                    {message.searchType && (
                      <div className="text-xs opacity-75 mt-2">
                        Search Type: {message.searchType}
                      </div>
                    )}
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-primary-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                user?.role === "doctor"
                  ? "Ask about treatments, medications, diagnoses..."
                  : "Ask about health, medications, symptoms..."
              }
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Current search mode:{" "}
            <span className="font-medium">{searchType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalChatbot;
