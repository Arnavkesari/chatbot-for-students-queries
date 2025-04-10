import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SpotlightCard from "./ui/SpotlightCard";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { IoSend, IoClose } from "react-icons/io5";
import { Label } from "./ui/label";
import GradientText from "./ui/GradientText";
import { IoMdSettings, IoMdLogOut } from "react-icons/io";
import { SkeletonDemo } from "./ui/SkeletonDemo";
import { IoMdLogIn } from "react-icons/io";
import { FaHistory } from "react-icons/fa";
import axios from "axios";
import { format } from "date-fns";

function ChatBox({ onClose }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userChatHistory, setUserChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const conversationRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const userToken = localStorage.getItem("userToken");
    setIsLoggedIn(!!userToken);
  }, []);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [chatHistory, showConversation]);

  const handleSettingsClick = () => {
    navigate("/admin");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    setIsLoggedIn(false);
    setShowHistory(false);
  };

  const handleHistoryClick = async () => {
    const newState = !showHistory;
    setShowHistory(newState);
    
    // Only fetch history if we're showing history and we haven't loaded it yet
    if (newState && isLoggedIn && userChatHistory.length === 0) {
      setHistoryLoading(true);
      try {
        const token = localStorage.getItem("userToken");
        const response = await axios.get("/api/chat-history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserChatHistory(response.data.history || []);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.post("/api/query", 
        {
          question: message,
        },
        {
          headers: { 
            Authorization: token ? `Bearer ${token}` : undefined
          }
        }
      );

      setChatHistory((prev) => [
        ...prev,
        { query: message, response: response.data.answer || "No answer found" },
      ]);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setChatHistory((prev) => [
          ...prev,
          { query: message, response: "No answer found. Your query has been logged." },
        ]);
      } else {
        console.error("Error sending message:", error);
      }
    }
    setShowConversation(true)
    setMessage("");
  };

  return (
    <div className="fixed bottom-24 right-8 h-[80%] w-[40%]">
      <SpotlightCard
        className="custom-spotlight-card h-full flex flex-col"
        spotlightColor="rgba(0, 229, 255, 0.2)"
      >
        <div className="p-2 border-b border-neutral-800 flex justify-between items-center">
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHistoryClick}
              className="text-blue-500 text-3xl hover:bg-blue-800 hover:text-white"
            >
              <FaHistory />
            </Button>
          )}
          <GradientText
            colors={["#b185db", "#5a8dee", "#59c3e3", "#ff85a1", "#d25ca8"]}
            animationSpeed={3}
            showBorder={false}
            className="custom-class text-3xl mb-3"
          >
            Welcome to Sahayak
          </GradientText>

          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-pink-500 text-3xl hover:bg-pink-800 hover:text-white"
            >
              <IoMdLogOut />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLoginClick}
              className="text-pink-500 text-3xl hover:bg-pink-800 hover:text-white"
            >
              <IoMdLogIn />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsClick}
            className="text-blue-500 text-3xl hover:bg-blue-800 hover:text-white"
          >
            <IoMdSettings />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-red-500 hover:bg-red-800 hover:text-white"
          >
            <IoClose className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showHistory ? (
            isLoggedIn ? (
              historyLoading ? (
                <div className="flex justify-center items-center h-full">
                  <SkeletonDemo />
                </div>
              ) : userChatHistory.length > 0 ? (
                <div className="space-y-4">
                  {userChatHistory.map((chat) => (
                    <div key={chat._id} className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-sm mb-2">
                        {format(new Date(chat.timestamp), 'MMM d, yyyy h:mm a')}
                      </div>
                      <p className="text-blue-400 font-medium">Question: {chat.question}</p>
                      <p className="text-white mt-2">Answer: {chat.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white py-4">
                  No chat history found
                </div>
              )
            ) : (
              <div className="text-center text-white py-4">
                Please login to see chat history
                <Button
                  variant="ghost"
                  onClick={handleLoginClick}
                  className="ml-2 text-pink-500 hover:bg-pink-800 hover:text-white"
                >
                  Login
                </Button>
              </div>
            )
          ) : showConversation ? (
            <div
              ref={conversationRef}
              className="space-y-4"
            >
              {chatHistory.map((chat, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-blue-400 font-medium">Query: {chat.query}</p>
                  <p className="text-white mt-2">Response: {chat.response}</p>
                </div>  
              ))}
            </div>
          ) : (
            <>
              <div className="mt-3">
                <SkeletonDemo className="mt-3" />
              </div>
              <div className="mt-3">
                <SkeletonDemo className="mt-3" />
              </div>
            </>
          )}
        </div>
        
        <div className="mt-auto p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="message" className="text-white sr-only">
                Your Query
              </Label>
              <Textarea
                placeholder="Type your message here."
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[50px] max-h-[100px] text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <Button className="h-[50px] px-4" onClick={handleSendMessage}>
              <IoSend className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
}

export default ChatBox;
