
"""
Classify File Tool - AI-Powered File Classification
Part of the THANOS file organization system
"""

import json
import logging
import mimetypes
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import hashlib
import re

class ClassifyFileTool:
    """
    AI-powered file classification for smart organization
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Classification categories
        self.categories = {
            "photos": {
                "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".heic", ".raw"],
                "mimetypes": ["image/jpeg", "image/png", "image/gif", "image/bmp"],
                "keywords": ["photo", "image", "picture", "img", "screenshot", "selfie"]
            },
            "documents": {
                "extensions": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"],
                "mimetypes": ["application/pdf", "application/msword", "text/plain"],
                "keywords": ["document", "letter", "report", "contract", "resume", "cv"]
            },
            "spreadsheets": {
                "extensions": [".xls", ".xlsx", ".csv", ".ods"],
                "mimetypes": ["application/vnd.ms-excel", "text/csv"],
                "keywords": ["data", "budget", "expenses", "calculation", "spreadsheet"]
            },
            "presentations": {
                "extensions": [".ppt", ".pptx", ".odp"],
                "mimetypes": ["application/vnd.ms-powerpoint"],
                "keywords": ["presentation", "slides", "pitch", "meeting"]
            },
            "videos": {
                "extensions": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"],
                "mimetypes": ["video/mp4", "video/avi", "video/quicktime"],
                "keywords": ["video", "movie", "clip", "recording"]
            },
            "audio": {
                "extensions": [".mp3", ".wav", ".flac", ".aac", ".ogg"],
                "mimetypes": ["audio/mpeg", "audio/wav", "audio/flac"],
                "keywords": ["audio", "music", "song", "recording", "podcast"]
            },
            "archives": {
                "extensions": [".zip", ".rar", ".7z", ".tar", ".gz"],
                "mimetypes": ["application/zip", "application/x-rar"],
                "keywords": ["archive", "backup", "compressed"]
            }
        }
    
    async def execute(self, file_key: str, metadata: Dict[str, Any], 
                     text_content: str = "", exif_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Classify a file based on multiple signals
        
        Args:
            file_key: File identifier/path
            metadata: File metadata (size, mime type, etc.)
            text_content: Extracted text content (if any)
            exif_data: EXIF metadata (if any)
            
        Returns:
            Classification results with category, tags, and confidence
        """
        
        result = {
            "file_key": file_key,
            "primary_category": "unknown",
            "subcategory": None,
            "tags": [],
            "confidence": 0.0,
            "suggested_folder": "",
            "content_description": "",
            "people_detected": [],
            "location": None,
            "date_taken": None,
            "processing_notes": []
        }
        
        try:
            # Extract file information
            file_name = os.path.basename(file_key)
            file_ext = os.path.splitext(file_name)[1].lower()
            
            # Basic classification by extension and MIME type
            basic_category = self._classify_by_extension(file_ext, metadata.get("mime_type"))
            result["primary_category"] = basic_category
            result["confidence"] = 0.7 if basic_category != "unknown" else 0.1
            
            # Enhanced classification using multiple signals
            enhanced_result = await self._enhanced_classification(
                file_key, file_name, file_ext, metadata, text_content, exif_data
            )
            
            result.update(enhanced_result)
            
            # Generate tags based on classification
            tags = self._generate_tags(file_name, text_content, exif_data, result["primary_category"])
            result["tags"] = tags
            
            # Suggest folder structure
            folder_path = self._suggest_folder_path(result, file_name, exif_data)
            result["suggested_folder"] = folder_path
            
            # Extract additional metadata
            if exif_data:
                result["date_taken"] = exif_data.get("datetime")
                result["location"] = self._extract_location(exif_data)
            
            # Content analysis
            if text_content:
                content_info = self._analyze_content(text_content)
                result["content_description"] = content_info["description"]
                result["tags"].extend(content_info["tags"])
            
            self.logger.info(f"Classified file {file_key} as {result['primary_category']} with confidence {result['confidence']}")
            
        except Exception as e:
            self.logger.error(f"Classification failed for {file_key}: {str(e)}")
            result["processing_notes"].append(f"Classification error: {str(e)}")
        
        return result
    
    def _classify_by_extension(self, extension: str, mime_type: str = None) -> str:
        """Basic classification using file extension and MIME type"""
        
        for category, info in self.categories.items():
            if extension in info["extensions"]:
                return category
            
            if mime_type and mime_type in info["mimetypes"]:
                return category
        
        return "unknown"
    
    async def _enhanced_classification(self, file_key: str, file_name: str, 
                                     file_ext: str, metadata: Dict[str, Any],
                                     text_content: str, exif_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced classification using AI and content analysis"""
        
        enhancement = {
            "subcategory": None,
            "confidence_boost": 0.0,
            "processing_notes": []
        }
        
        # Filename pattern analysis
        filename_category = self._analyze_filename_patterns(file_name)
        if filename_category:
            enhancement["subcategory"] = filename_category
            enhancement["confidence_boost"] += 0.1
            enhancement["processing_notes"].append(f"Filename suggests: {filename_category}")
        
        # Content-based classification for documents
        if text_content and len(text_content) > 100:
            content_category = self._classify_by_content(text_content)
            if content_category:
                enhancement["subcategory"] = content_category
                enhancement["confidence_boost"] += 0.2
                enhancement["processing_notes"].append(f"Content suggests: {content_category}")
        
        # EXIF-based enhancement for images
        if exif_data and file_ext in [".jpg", ".jpeg", ".tiff", ".raw"]:
            exif_category = self._classify_by_exif(exif_data)
            if exif_category:
                enhancement["subcategory"] = exif_category
                enhancement["confidence_boost"] += 0.1
                enhancement["processing_notes"].append(f"EXIF suggests: {exif_category}")
        
        # Size-based heuristics
        file_size = metadata.get("size", 0)
        size_category = self._classify_by_size(file_size, file_ext)
        if size_category:
            enhancement["subcategory"] = size_category
            enhancement["confidence_boost"] += 0.05
        
        return enhancement
    
    def _analyze_filename_patterns(self, filename: str) -> Optional[str]:
        """Analyze filename patterns for classification hints"""
        
        filename_lower = filename.lower()
        
        patterns = {
            "screenshot": r"(screenshot|screen|capture)",
            "invoice": r"(invoice|bill|receipt)",
            "resume": r"(resume|cv|curriculum)",
            "contract": r"(contract|agreement|terms)",
            "photo": r"(img|photo|pic|image)_?\d+",
            "document": r"(doc|document|letter|report)",
            "backup": r"(backup|bak|archive)",
            "download": r"(download|temp|tmp)"
        }
        
        for category, pattern in patterns.items():
            if re.search(pattern, filename_lower):
                return category
        
        return None
    
    def _classify_by_content(self, text_content: str) -> Optional[str]:
        """Classify based on text content analysis"""
        
        content_lower = text_content.lower()
        
        # Document type indicators
        if any(word in content_lower for word in ["invoice", "bill", "payment", "due", "amount"]):
            return "invoice"
        
        if any(word in content_lower for word in ["agreement", "contract", "terms", "conditions"]):
            return "contract"
        
        if any(word in content_lower for word in ["resume", "experience", "education", "skills"]):
            return "resume"
        
        if any(word in content_lower for word in ["dear", "sincerely", "regards", "yours"]):
            return "letter"
        
        if any(word in content_lower for word in ["report", "analysis", "findings", "conclusion"]):
            return "report"
        
        return None
    
    def _classify_by_exif(self, exif_data: Dict[str, Any]) -> Optional[str]:
        """Classify based on EXIF data"""
        
        camera_make = exif_data.get("camera_make", "").lower()
        camera_model = exif_data.get("camera_model", "").lower()
        
        # Professional camera indicators
        if any(brand in camera_make for brand in ["canon", "nikon", "sony", "fujifilm"]):
            if "mark" in camera_model or "pro" in camera_model:
                return "professional_photo"
        
        # Phone camera indicators
        if any(brand in camera_make for brand in ["apple", "samsung", "google", "huawei"]):
            return "mobile_photo"
        
        # Screenshot indicators
        software = exif_data.get("software", "").lower()
        if "screenshot" in software or "screen capture" in software:
            return "screenshot"
        
        return None
    
    def _classify_by_size(self, file_size: int, file_ext: str) -> Optional[str]:
        """Classification hints based on file size"""
        
        if file_size == 0:
            return "empty_file"
        
        # Very large files
        if file_size > 100 * 1024 * 1024:  # > 100MB
            if file_ext in [".mp4", ".avi", ".mov"]:
                return "large_video"
            elif file_ext in [".zip", ".rar", ".7z"]:
                return "large_archive"
        
        # Very small images (likely icons or thumbnails)
        if file_ext in [".jpg", ".png", ".gif"] and file_size < 50 * 1024:  # < 50KB
            return "thumbnail"
        
        return None
    
    def _generate_tags(self, filename: str, text_content: str, 
                      exif_data: Dict[str, Any], category: str) -> List[str]:
        """Generate relevant tags for the file"""
        
        tags = []
        
        # Category-based tags
        tags.append(category)
        
        # Date-based tags
        if exif_data and exif_data.get("datetime"):
            date_obj = datetime.fromisoformat(exif_data["datetime"])
            tags.extend([
                f"year_{date_obj.year}",
                f"month_{date_obj.strftime('%B').lower()}",
                f"day_{date_obj.strftime('%A').lower()}"
            ])
        
        # Location-based tags
        if exif_data and exif_data.get("gps"):
            tags.append("geotagged")
            # Could add city/country tags with reverse geocoding
        
        # Content-based tags for text
        if text_content:
            content_tags = self._extract_content_tags(text_content)
            tags.extend(content_tags)
        
        # Filename-based tags
        filename_tags = self._extract_filename_tags(filename)
        tags.extend(filename_tags)
        
        # Remove duplicates and return
        return list(set(tags))
    
    def _extract_content_tags(self, text_content: str) -> List[str]:
        """Extract tags from text content"""
        
        tags = []
        content_lower = text_content.lower()
        
        # Business-related keywords
        business_keywords = ["meeting", "project", "client", "proposal", "budget", "deadline"]
        for keyword in business_keywords:
            if keyword in content_lower:
                tags.append(f"business_{keyword}")
        
        # Personal keywords
        personal_keywords = ["family", "vacation", "birthday", "anniversary", "wedding"]
        for keyword in personal_keywords:
            if keyword in content_lower:
                tags.append(f"personal_{keyword}")
        
        return tags
    
    def _extract_filename_tags(self, filename: str) -> List[str]:
        """Extract tags from filename patterns"""
        
        tags = []
        filename_lower = filename.lower()
        
        # Common naming patterns
        if re.search(r'\d{4}-\d{2}-\d{2}', filename):
            tags.append("date_formatted")
        
        if "final" in filename_lower:
            tags.append("final_version")
        
        if "draft" in filename_lower:
            tags.append("draft")
        
        if "backup" in filename_lower:
            tags.append("backup")
        
        return tags
    
    def _suggest_folder_path(self, classification: Dict[str, Any], 
                           filename: str, exif_data: Dict[str, Any]) -> str:
        """Suggest folder path based on classification"""
        
        parts = []
        
        # Primary category folder
        category = classification["primary_category"]
        parts.append(category.capitalize())
        
        # Date-based subfolder for photos
        if category == "photos" and exif_data and exif_data.get("datetime"):
            date_obj = datetime.fromisoformat(exif_data["datetime"])
            parts.extend([str(date_obj.year), f"{date_obj.month:02d}-{date_obj.strftime('%B')}"])
        
        # Subcategory folder
        if classification.get("subcategory"):
            parts.append(classification["subcategory"].replace("_", " ").title())
        
        return "/".join(parts)
    
    def _extract_location(self, exif_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract location information from EXIF data"""
        
        if not exif_data.get("gps"):
            return None
        
        gps_data = exif_data["gps"]
        
        return {
            "latitude": gps_data.get("lat"),
            "longitude": gps_data.get("lng"),
            "altitude": gps_data.get("altitude"),
            "timestamp": gps_data.get("timestamp")
        }
    
    def _analyze_content(self, text_content: str) -> Dict[str, Any]:
        """Analyze text content for insights"""
        
        # Simple content analysis
        word_count = len(text_content.split())
        
        # Extract key phrases (simple implementation)
        lines = text_content.split('\n')
        first_line = lines[0] if lines else ""
        
        # Determine content type
        content_type = "text"
        if word_count > 1000:
            content_type = "long_document"
        elif word_count < 50:
            content_type = "short_note"
        
        return {
            "description": f"{content_type} with {word_count} words",
            "tags": [content_type, f"words_{word_count//100*100}+"],
            "first_line": first_line[:100],
            "word_count": word_count
        }

# Abacus AI Function Wrapper
def classify_file_function(input_data: str) -> str:
    """
    Abacus AI function wrapper for file classification
    """
    
    try:
        data = json.loads(input_data)
        
        config = {
            "ai_model": "gpt-3.5-turbo",
            "confidence_threshold": 0.5
        }
        
        tool = ClassifyFileTool(config)
        
        # Run async function synchronously for Abacus AI
        import asyncio
        result = asyncio.run(tool.execute(
            file_key=data.get("file_key"),
            metadata=data.get("metadata", {}),
            text_content=data.get("text_content", ""),
            exif_data=data.get("exif_data", {})
        ))
        
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "file_key": data.get("file_key", "unknown"),
            "primary_category": "unknown",
            "tags": [],
            "confidence": 0.0,
            "error": str(e)
        }
        return json.dumps(error_result)
