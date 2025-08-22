
"""
ROSA (Responsive Organization & Support Assistant) - THANOS System Chatbot

A smart chatbot that helps users navigate the THANOS file organization system,
provides assistance with file management, and answers questions about the system.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import openai
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ChatMessage:
    """Represents a chat message"""
    role: str  # 'user', 'assistant', or 'system'
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class RosaChatbot:
    """
    ROSA - The THANOS system's intelligent assistant
    Helps users with file organization, system navigation, and general support
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ABACUSAI_API_KEY")
        if not self.api_key:
            logger.warning("No API key provided. Rosa will work in offline mode.")
        
        self.conversation_history: List[ChatMessage] = []
        self.system_context = self._build_system_context()
        self.knowledge_base = self._load_knowledge_base()
        
    def _build_system_context(self) -> str:
        """Build the system context for Rosa"""
        return """
        You are ROSA (Responsive Organization & Support Assistant), the intelligent chatbot for the THANOS file organization system.
        
        THANOS is a comprehensive file organization system that:
        - Organizes thousands of files with a single click
        - Uses AI to classify and categorize files intelligently
        - Creates smart folder structures based on content, date, and metadata
        - Supports multiple organization strategies (by date, type, content, GPS location)
        - Provides real-time progress tracking and analytics
        
        Your role is to:
        1. Help users understand how to use the THANOS system
        2. Answer questions about file organization best practices
        3. Provide troubleshooting support
        4. Guide users through the interface and features
        5. Suggest optimization strategies for their file management
        
        Always be helpful, friendly, and concise. If you don't know something specific about the system, 
        suggest they check the documentation or contact support.
        
        Key features to highlight:
        - One-click organization with the THANOS button
        - Drag-and-drop file upload
        - Smart AI classification
        - Multiple organization modes
        - Real-time progress tracking
        - Undo functionality
        - Analytics and insights
        """
    
    def _load_knowledge_base(self) -> Dict[str, str]:
        """Load the knowledge base for common questions"""
        return {
            "how_to_organize": """
            To organize files with THANOS:
            1. Upload files using the drag-and-drop zone
            2. Choose your organization strategy (Date, Type, Content, or Smart)
            3. Click the THANOS button to start organization
            4. Watch the real-time progress
            5. Review the organized structure
            """,
            
            "organization_modes": """
            THANOS offers 4 organization modes:
            - DATE: Organizes by creation/modification date
            - TYPE: Groups by file extension and type
            - CONTENT: Uses AI to analyze content and create semantic folders
            - SMART: Combines all methods for optimal organization
            """,
            
            "supported_files": """
            THANOS supports all common file types:
            - Images: JPG, PNG, GIF, TIFF, etc.
            - Documents: PDF, DOC, TXT, etc.
            - Media: MP4, MP3, AVI, etc.
            - Archives: ZIP, RAR, 7Z, etc.
            - And many more!
            """,
            
            "troubleshooting": """
            Common troubleshooting tips:
            - Ensure files are properly uploaded before organizing
            - Check that you have sufficient storage space
            - Try refreshing the page if the interface seems unresponsive
            - Use the Undo feature if you're not happy with the organization
            - Contact support for persistent issues
            """,
            
            "analytics": """
            THANOS provides detailed analytics:
            - Files processed and organized
            - Storage space saved through deduplication
            - Organization efficiency metrics
            - Time saved compared to manual organization
            - Popular file types and patterns
            """
        }
    
    async def chat(self, user_message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Process a user message and return Rosa's response
        """
        # Add user message to history
        self.conversation_history.append(
            ChatMessage(
                role="user",
                content=user_message,
                timestamp=datetime.now(),
                metadata=context
            )
        )
        
        # Check for common questions first
        response = self._check_knowledge_base(user_message)
        
        if not response and self.api_key:
            # Use AI for more complex queries
            response = await self._generate_ai_response(user_message, context)
        elif not response:
            # Fallback response
            response = self._generate_fallback_response(user_message)
        
        # Add assistant response to history
        self.conversation_history.append(
            ChatMessage(
                role="assistant",
                content=response,
                timestamp=datetime.now()
            )
        )
        
        return response
    
    def _check_knowledge_base(self, message: str) -> Optional[str]:
        """Check if the message matches any knowledge base entries"""
        message_lower = message.lower()
        
        # Check for keywords and return appropriate responses
        if any(word in message_lower for word in ["organize", "how to", "start"]):
            return self.knowledge_base["how_to_organize"]
        
        elif any(word in message_lower for word in ["mode", "strategy", "method"]):
            return self.knowledge_base["organization_modes"]
        
        elif any(word in message_lower for word in ["support", "file type", "format"]):
            return self.knowledge_base["supported_files"]
        
        elif any(word in message_lower for word in ["problem", "error", "issue", "help"]):
            return self.knowledge_base["troubleshooting"]
        
        elif any(word in message_lower for word in ["stats", "analytics", "metrics"]):
            return self.knowledge_base["analytics"]
        
        return None
    
    async def _generate_ai_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate response using AI"""
        try:
            client = openai.OpenAI(
                base_url="https://api.abacus.ai/v1",
                api_key=self.api_key
            )
            
            messages = [
                {"role": "system", "content": self.system_context}
            ]
            
            # Add recent conversation history
            for msg in self.conversation_history[-5:]:  # Last 5 messages
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            messages.append({"role": "user", "content": message})
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return self._generate_fallback_response(message)
    
    def _generate_fallback_response(self, message: str) -> str:
        """Generate a fallback response when AI is not available"""
        return """
        Hi! I'm Rosa, your THANOS assistant. I'm here to help you with file organization!
        
        Here are some things I can help you with:
        - How to use the THANOS system
        - Understanding organization modes
        - Troubleshooting issues
        - File management best practices
        
        For specific technical questions, please check our documentation or contact support.
        """
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get the conversation history as a JSON-serializable list"""
        return [
            {
                **asdict(msg),
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in self.conversation_history
        ]
    
    def clear_history(self):
        """Clear the conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def save_conversation(self, filepath: str):
        """Save conversation to a file"""
        try:
            with open(filepath, 'w') as f:
                json.dump(self.get_conversation_history(), f, indent=2)
            logger.info(f"Conversation saved to {filepath}")
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")

# Example usage
async def main():
    """Example usage of Rosa chatbot"""
    rosa = RosaChatbot()
    
    # Test conversations
    test_messages = [
        "How do I organize my files?",
        "What organization modes are available?",
        "I'm having trouble uploading files",
        "Can you show me the analytics?"
    ]
    
    for message in test_messages:
        print(f"\nUser: {message}")
        response = await rosa.chat(message)
        print(f"Rosa: {response}")

if __name__ == "__main__":
    asyncio.run(main())
