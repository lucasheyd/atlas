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
import { Bot, Send, Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
  if (messagesEndRef.current) {
    // Scroll apenas o contêiner da mensagem, não a página inteira
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  // Return focus to input after bot responds
  if (!loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    inputRef.current?.focus();
  }
}, [messages, loading]);

  // Initial greeting from the agent
  useEffect(() => {
    setMessages([
      { 
        role: 'CEO/Artist', 
        content: 'Hello! I\'m the Synthesis. I can help with your NFT projects, marketing strategies, and blockchain development. How can I assist you today?' 
      }
    ]);
  }, []);

  // Send message to the agent
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // API call to agent proxy
      const response = await fetch('/api/agent-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: data.message || 'I didn\'t understand your request.'
          }
        ]);
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
      // Focus back on input after sending
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
              <h3 className="font-bold text-xl">Nebula Flow Synthesis Agent</h3>
              <p className="text-sm opacity-75">Powered by Llama 3</p>
            </div>
          </div>
          <button 
            onClick={toggleExpand} 
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? "Minimize chat" : "Maximize chat"}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
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
              disabled={loading}
              placeholder="Type your message..."
              className="flex-1 border-indigo-200 dark:border-indigo-800/30 focus-visible:ring-indigo-500"
            />
            <Button 
              type="submit"
              disabled={loading}
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