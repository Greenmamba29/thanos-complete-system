
"""
Rosa Chatbot API Integration for THANOS System
FastAPI endpoint for integrating Rosa with the web application
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import logging
from datetime import datetime

from rosa import RosaChatbot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rosa Chatbot API", version="1.0.0")

# Global Rosa instance
rosa_instance = RosaChatbot()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime
    conversation_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0"
    )

@app.post("/chat", response_model=ChatResponse)
async def chat_with_rosa(request: ChatRequest):
    """
    Chat with Rosa chatbot
    """
    try:
        response = await rosa_instance.chat(
            user_message=request.message,
            context=request.context
        )
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now(),
            conversation_id=request.conversation_id
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/conversation/history")
async def get_conversation_history():
    """Get conversation history"""
    try:
        return {
            "history": rosa_instance.get_conversation_history(),
            "count": len(rosa_instance.conversation_history)
        }
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/conversation/clear")
async def clear_conversation():
    """Clear conversation history"""
    try:
        rosa_instance.clear_history()
        return {"message": "Conversation history cleared"}
    except Exception as e:
        logger.error(f"Error clearing conversation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Rosa Chatbot API for THANOS System",
        "version": "1.0.0",
        "endpoints": [
            "/chat - Chat with Rosa",
            "/conversation/history - Get conversation history",
            "/conversation/clear - Clear conversation",
            "/health - Health check"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
