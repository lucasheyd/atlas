"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader,
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Bot, Send, Loader2, Maximize2, Minimize2, RefreshCw, Lock, Unlock } from 'lucide-react';
import { useWallet } from '@/components/WalletConnect';
import { 
  Message, 
  loadConversation, 
  saveConversation, 
  clearConversation 
} from '@/services/conversationStorage';

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m Synthesis. I can help with your NFT projects, marketing strategies, and blockchain development. Connect your wallet to start chatting.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get wallet state
  const { address, isConnected } = useWallet();

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesContainerRef.current;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    
    // Refocus input after bot responds
    if (!loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      inputRef.current?.focus();
    }
  }, [messages, loading]);

  // Load conversation when wallet is connected
  useEffect(() => {
    const loadUserConversation = async () => {
      if (isConnected && address) {
        try {
          const savedMessages = await loadConversation(address);
          
          if (savedMessages && savedMessages.length > 0) {
            console.log(`Loaded ${savedMessages.length} messages for ${address}`);
            setMessages(savedMessages);
          } else {
            // If no saved messages, add initial greeting
            setMessages([
              { 
                role: 'assistant', 
                content: 'Hello! I\'m Synthesis. I can help with your NFT projects, marketing strategies, and blockchain development. How can I assist you today?',
                timestamp: Date.now()
              }
            ]);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          // Fallback to initial message
          setMessages([
            { 
              role: 'assistant', 
              content: 'Hello! I\'m Synthesis. I can help with your NFT projects, marketing strategies, and blockchain development. How can I assist you today?',
              timestamp: Date.now()
            }
          ]);
        }
      } else if (!isConnected) {
        // When disconnected, show message asking to connect wallet
        setMessages([
          { 
            role: 'assistant', 
            content: 'Please connect your wallet to start or continue a conversation with me. Your chat history will be saved and associated with your wallet address.',
            timestamp: Date.now()
          }
        ]);
      }
    };

    loadUserConversation();
  }, [isConnected, address]);

  // Auto-save conversation when messages change
  useEffect(() => {
    const saveUserConversation = async () => {
      if (isConnected && address && messages.length > 0) {
        setIsSaving(true);
        try {
          await saveConversation(address, messages);
        } catch (error) {
          console.error('Error auto-saving conversation:', error);
        } finally {
          setIsSaving(false);
        }
      }
    };

    // Only save if there's more than the initial greeting
    if (messages.length > 1) {
      saveUserConversation();
    }
  }, [messages, isConnected, address]);

  // Function to clear the conversation
  const clearUserConversation = async () => {
    if (isConnected && address) {
      try {
        await clearConversation(address);
        setMessages([
          { 
            role: 'assistant', 
            content: 'I\'ve cleared our conversation history. How can I help you today?',
            timestamp: Date.now()
          }
        ]);
      } catch (error) {
        console.error('Error clearing conversation:', error);
        setDialogMessage('Failed to clear conversation. Please try again.');
        setOpenDialog(true);
      }
    } else {
      setDialogMessage('Please connect your wallet first.');
      setOpenDialog(true);
    }
  };

  // Send message to agent
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Check if wallet is connected
    if (!isConnected || !address) {
      setDialogMessage('Please connect your wallet to chat with the agent.');
      setOpenDialog(true);
      return;
    }

    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    const updatedMessages = [
      ...messages, 
      { role: 'user', content: userMessage, timestamp: Date.now() }
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // API call to agent proxy
      const response = await fetch('/api/agent-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address,
        },
        body: JSON.stringify({ 
          message: userMessage,
          walletAddress: address,
          history: updatedMessages.slice(-8) // Send last 8 messages for context
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Add agent response to chat
        const agentResponse = {
          role: 'assistant', 
          content: data.message || 'I didn\'t understand your request.',
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, agentResponse]);
      } else {
        setDialogMessage(`Error: ${data.error || 'Something went wrong'}`);
        setOpenDialog(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setDialogMessage('The agent is offline or inaccessible at the moment. Please try again later.');
      setOpenDialog(true);
    } finally {
      setLoading(false);
      // Refocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate chat height based on expanded state
  const chatHeight = isExpanded ? 'h-[85vh]' : 'h-[70vh]';

  return (
    <>
      <Card 
        className={`flex flex-col ${chatHeight} dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800/30 shadow-md transition-all duration-300`}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Synthesis Agent</h3>
              <div className="text-xs opacity-75 flex items-center gap-1">
                {isSaving ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Saving conversation...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Lock size={12} />
                    <span>Chat linked to {address?.substring(0, 6)}...{address?.substring(address.length - 4)}</span>
                  </>
                ) : (
                  <>
                    <Unlock size={12} />
                    <span>Connect wallet to save conversation</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearUserConversation}
              className="text-white hover:bg-white/10"
              title="Clear conversation"
            >
              <RefreshCw size={14} />
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={toggleExpand} 
              className="text-white hover:bg-white/10"
              title={isExpanded ? "Minimize chat" : "Maximize chat"}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
          </div>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-6"
          ref={messagesContainerRef}
        >
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-lg whitespace-pre-wrap break-words ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none'
                }`}
              >
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg rounded-bl-none">
                <Loader2 size={20} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form 
          onSubmit={sendMessage} 
          className="border-t border-indigo-100 dark:border-indigo-800/30 p-4"
        >
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !isConnected}
              placeholder={isConnected ? "Type your message..." : "Connect wallet to chat..."}
              className="flex-1 border-indigo-200 dark:border-indigo-800/30 focus-visible:ring-indigo-500"
            />
            <Button 
              type="submit"
              disabled={loading || !isConnected}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A problem occurred</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end">
            <AlertDialogAction>OK</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}