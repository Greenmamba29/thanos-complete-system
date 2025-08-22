
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, X, Bot, User } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface RosaChatProps {
  className?: string
}

export function RosaChat({ className }: RosaChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Rosa, your THANOS assistant. I'm here to help you organize your files efficiently. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // In a real implementation, this would call your Rosa API
      // For now, we'll simulate Rosa's responses
      const response = await simulateRosaResponse(inputValue)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Chat Toggle Button
  const ChatToggle = () => (
    <Button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      size="icon"
    >
      <MessageCircle className="h-6 w-6 text-white" />
    </Button>
  )

  // Main Chat Interface
  const ChatInterface = () => (
    <Card className="fixed bottom-6 right-6 w-96 h-[32rem] shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/rosa-avatar.png" alt="Rosa" />
              <AvatarFallback className="bg-white/20 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">Rosa</CardTitle>
              <p className="text-sm text-white/90">THANOS Assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8">
                  {message.role === 'user' ? (
                    <AvatarFallback className="bg-blue-500 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Rosa about file organization..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={className}>
      {isOpen ? <ChatInterface /> : <ChatToggle />}
    </div>
  )
}

// Simulate Rosa's responses - replace with actual API call
async function simulateRosaResponse(userMessage: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  const message = userMessage.toLowerCase()
  
  if (message.includes('organize') || message.includes('how to')) {
    return `To organize files with THANOS:
1. Upload files using the drag-and-drop zone
2. Choose your organization strategy (Date, Type, Content, or Smart)
3. Click the THANOS button to start organization
4. Watch the real-time progress
5. Review the organized structure

Would you like me to explain any of these steps in more detail?`
  }
  
  if (message.includes('mode') || message.includes('strategy')) {
    return `THANOS offers 4 organization modes:

📅 **DATE**: Organizes by creation/modification date
📁 **TYPE**: Groups by file extension and type  
🧠 **CONTENT**: Uses AI to analyze content and create semantic folders
⚡ **SMART**: Combines all methods for optimal organization

Which mode would you like to know more about?`
  }
  
  if (message.includes('problem') || message.includes('error') || message.includes('help')) {
    return `I'm here to help! Here are some common solutions:

• **Files not uploading**: Try refreshing the page and ensure your files aren't too large
• **Organization stuck**: Check your internet connection and try again
• **Unhappy with results**: Use the Undo feature to revert changes
• **Missing files**: Check the organized folders - they might be categorized differently than expected

What specific issue are you experiencing?`
  }
  
  if (message.includes('thank')) {
    return `You're welcome! I'm always here to help you master the art of file organization. Feel free to ask if you have any other questions about THANOS! 😊`
  }
  
  // Default response
  return `I'm Rosa, your THANOS assistant! I can help you with:

• **File organization** strategies and best practices
• **System features** and how to use them
• **Troubleshooting** any issues you encounter
• **Tips and tricks** for efficient file management

What would you like to know about?`
}

export default RosaChat
