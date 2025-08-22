
"""
Suggest Folder Tool - Generate Smart Folder Paths
Part of the THANOS file organization system
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
import re

class SuggestFolderTool:
    """
    Generate smart folder paths based on file classification and metadata
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Default folder structure templates
        self.templates = {
            "photos": [
                "Photos/{year}/{month}-{month_name}",
                "Photos/{year}/{event_type}",
                "Photos/{person_name}",
                "Photos/Screenshots",
                "Photos/Camera Roll"
            ],
            "documents": [
                "Documents/{category}",
                "Documents/{year}",
                "Documents/Personal",
                "Documents/Work",
                "Documents/Legal"
            ],
            "videos": [
                "Videos/{year}",
                "Videos/{category}",
                "Videos/Personal",
                "Videos/Recordings"
            ],
            "audio": [
                "Music/{genre}",
                "Music/{artist}",
                "Audio/Recordings",
                "Audio/Podcasts"
            ]
        }
    
    async def execute(self, classification: Dict[str, Any], exif_data: Dict[str, Any] = None, 
                     journal_context: Dict[str, Any] = None) -> Dict[str, str]:
        """
        Generate folder path suggestions based on file classification
        
        Args:
            classification: File classification results
            exif_data: EXIF metadata (optional)
            journal_context: Journal/context information (optional)
            
        Returns:
            Dict with primary and alternative folder path suggestions
        """
        
        result = {
            "primary_path": "",
            "alternatives": [],
            "reasoning": [],
            "confidence": 0.0
        }
        
        try:
            file_category = classification.get("primary_category", "unknown")
            subcategory = classification.get("subcategory")
            tags = classification.get("tags", [])
            
            # Generate primary path suggestion
            primary_path = await self._generate_primary_path(
                file_category, subcategory, tags, exif_data, journal_context
            )
            result["primary_path"] = primary_path
            result["confidence"] = 0.8
            
            # Generate alternative paths
            alternatives = await self._generate_alternatives(
                file_category, subcategory, tags, exif_data, journal_context
            )
            result["alternatives"] = alternatives
            
            # Add reasoning
            reasoning = self._generate_reasoning(
                file_category, subcategory, tags, exif_data, primary_path
            )
            result["reasoning"] = reasoning
            
            self.logger.info(f"Generated folder suggestion: {primary_path}")
            
        except Exception as e:
            self.logger.error(f"Folder suggestion failed: {str(e)}")
            result["primary_path"] = f"Unsorted/{file_category.capitalize()}"
            result["reasoning"] = [f"Error in path generation: {str(e)}"]
        
        return result
    
    async def _generate_primary_path(self, category: str, subcategory: str, 
                                   tags: List[str], exif_data: Dict[str, Any],
                                   journal_context: Dict[str, Any]) -> str:
        """Generate the primary folder path suggestion"""
        
        # Handle photos with date/location information
        if category == "photos":
            return await self._suggest_photo_path(tags, exif_data, subcategory)
        
        # Handle documents by type
        elif category == "documents":
            return await self._suggest_document_path(tags, subcategory, journal_context)
        
        # Handle videos
        elif category == "videos":
            return await self._suggest_video_path(tags, exif_data, subcategory)
        
        # Handle audio files
        elif category == "audio":
            return await self._suggest_audio_path(tags, subcategory)
        
        # Handle other categories
        else:
            return await self._suggest_generic_path(category, subcategory, tags)
    
    async def _suggest_photo_path(self, tags: List[str], exif_data: Dict[str, Any], 
                                subcategory: str) -> str:
        """Generate photo folder path based on date, location, and content"""
        
        # Screenshots get special treatment
        if subcategory == "screenshot" or any("screenshot" in tag for tag in tags):
            return "Photos/Screenshots"
        
        # Professional photos
        if subcategory == "professional_photo":
            return "Photos/Professional"
        
        # Date-based organization (preferred for photos)
        if exif_data and exif_data.get("datetime"):
            try:
                date_obj = datetime.fromisoformat(exif_data["datetime"])
                year = date_obj.year
                month = date_obj.month
                month_name = date_obj.strftime("%B")
                
                return f"Photos/{year}/{month:02d}-{month_name}"
            except ValueError:
                pass
        
        # Location-based if GPS available
        if exif_data and exif_data.get("gps"):
            # This would typically involve reverse geocoding
            return "Photos/Travel"
        
        # People-based organization
        if any("person" in tag or "family" in tag for tag in tags):
            return "Photos/People"
        
        # Event-based
        if any(event in " ".join(tags) for event in ["wedding", "birthday", "vacation", "party"]):
            event_type = next((event for event in ["wedding", "birthday", "vacation", "party"] 
                             if event in " ".join(tags)), "events")
            return f"Photos/Events/{event_type.title()}"
        
        # Default to Camera Roll with year if possible
        current_year = datetime.now().year
        return f"Photos/Camera Roll/{current_year}"
    
    async def _suggest_document_path(self, tags: List[str], subcategory: str, 
                                   journal_context: Dict[str, Any]) -> str:
        """Generate document folder path based on type and context"""
        
        # Handle specific document types
        if subcategory:
            type_folders = {
                "invoice": "Documents/Financial/Invoices",
                "receipt": "Documents/Financial/Receipts", 
                "contract": "Documents/Legal/Contracts",
                "resume": "Documents/Personal/Resume",
                "letter": "Documents/Correspondence",
                "report": "Documents/Reports",
                "manual": "Documents/Manuals"
            }
            
            if subcategory in type_folders:
                return type_folders[subcategory]
        
        # Business vs Personal classification
        business_keywords = ["work", "business", "client", "project", "meeting"]
        personal_keywords = ["personal", "family", "home", "private"]
        
        if any(keyword in " ".join(tags) for keyword in business_keywords):
            return "Documents/Work"
        elif any(keyword in " ".join(tags) for keyword in personal_keywords):
            return "Documents/Personal"
        
        # Date-based organization for documents
        current_year = datetime.now().year
        return f"Documents/{current_year}"
    
    async def _suggest_video_path(self, tags: List[str], exif_data: Dict[str, Any], 
                                subcategory: str) -> str:
        """Generate video folder path"""
        
        # Handle specific video types
        if "recording" in " ".join(tags) or subcategory == "recording":
            return "Videos/Recordings"
        
        if any(keyword in " ".join(tags) for keyword in ["family", "personal", "home"]):
            return "Videos/Personal"
        
        if any(keyword in " ".join(tags) for keyword in ["work", "business", "presentation"]):
            return "Videos/Work"
        
        # Date-based organization
        if exif_data and exif_data.get("datetime"):
            try:
                date_obj = datetime.fromisoformat(exif_data["datetime"])
                return f"Videos/{date_obj.year}"
            except ValueError:
                pass
        
        # Default
        current_year = datetime.now().year
        return f"Videos/{current_year}"
    
    async def _suggest_audio_path(self, tags: List[str], subcategory: str) -> str:
        """Generate audio folder path"""
        
        # Music organization
        if any(keyword in " ".join(tags) for keyword in ["music", "song", "album"]):
            return "Music/Library"
        
        # Podcasts
        if "podcast" in " ".join(tags):
            return "Audio/Podcasts"
        
        # Voice recordings
        if any(keyword in " ".join(tags) for keyword in ["recording", "voice", "memo"]):
            return "Audio/Recordings"
        
        # Default
        return "Audio/Files"
    
    async def _suggest_generic_path(self, category: str, subcategory: str, 
                                  tags: List[str]) -> str:
        """Generate path for other file categories"""
        
        base_path = category.capitalize()
        
        if subcategory:
            return f"{base_path}/{subcategory.replace('_', ' ').title()}"
        
        # Try to use the first meaningful tag
        meaningful_tags = [tag for tag in tags if not tag.startswith(("year_", "month_", "day_"))]
        if meaningful_tags:
            return f"{base_path}/{meaningful_tags[0].replace('_', ' ').title()}"
        
        return base_path
    
    async def _generate_alternatives(self, category: str, subcategory: str,
                                   tags: List[str], exif_data: Dict[str, Any],
                                   journal_context: Dict[str, Any]) -> List[str]:
        """Generate alternative folder path suggestions"""
        
        alternatives = []
        
        # Category-based alternatives
        if category == "photos":
            alternatives.extend([
                "Photos/All Photos",
                "Photos/Unsorted",
                f"Photos/{datetime.now().year}"
            ])
            
            if exif_data and exif_data.get("camera"):
                camera_make = exif_data["camera"].get("make", "").replace(" ", "")
                if camera_make:
                    alternatives.append(f"Photos/By Camera/{camera_make}")
        
        elif category == "documents":
            alternatives.extend([
                "Documents/All Documents",
                "Documents/Unsorted",
                "Documents/Inbox"
            ])
        
        # Tag-based alternatives
        if tags:
            for tag in tags[:3]:  # Top 3 tags
                clean_tag = tag.replace("_", " ").title()
                alternatives.append(f"{category.capitalize()}/By Tag/{clean_tag}")
        
        # Date-based alternatives
        current_year = datetime.now().year
        current_month = datetime.now().strftime("%m-%B")
        alternatives.append(f"{category.capitalize()}/{current_year}")
        alternatives.append(f"{category.capitalize()}/{current_year}/{current_month}")
        
        # Remove duplicates and limit to 5 alternatives
        unique_alternatives = list(dict.fromkeys(alternatives))[:5]
        
        return unique_alternatives
    
    def _generate_reasoning(self, category: str, subcategory: str, tags: List[str],
                          exif_data: Dict[str, Any], chosen_path: str) -> List[str]:
        """Generate human-readable reasoning for the chosen path"""
        
        reasoning = []
        
        # Explain category choice
        reasoning.append(f"File classified as '{category}' - using {category} folder structure")
        
        # Explain subcategory influence
        if subcategory:
            reasoning.append(f"Subcategory '{subcategory}' suggests specialized organization")
        
        # Explain date influence
        if exif_data and exif_data.get("datetime") and any(part.isdigit() for part in chosen_path.split("/")):
            reasoning.append("Date from metadata used for chronological organization")
        
        # Explain tag influence
        meaningful_tags = [tag for tag in tags if not tag.startswith(("year_", "month_", "day_"))]
        if meaningful_tags and any(tag.replace("_", " ").lower() in chosen_path.lower() for tag in meaningful_tags):
            reasoning.append(f"Content tags influenced folder choice: {', '.join(meaningful_tags[:3])}")
        
        # Explain GPS influence
        if exif_data and exif_data.get("gps") and "travel" in chosen_path.lower():
            reasoning.append("GPS metadata suggests travel/location-based organization")
        
        # Default reasoning if none of the above apply
        if not reasoning:
            reasoning.append("Standard organization pattern applied based on file type")
        
        return reasoning

# Abacus AI Function Wrapper
def suggest_folder_function(input_data: str) -> str:
    """
    Abacus AI function wrapper for folder path suggestion
    """
    
    try:
        data = json.loads(input_data)
        
        config = {
            "prefer_date_organization": True,
            "max_depth": 4,
            "use_smart_names": True
        }
        
        tool = SuggestFolderTool(config)
        
        # Run async function synchronously for Abacus AI
        import asyncio
        result = asyncio.run(tool.execute(
            classification=data.get("classification", {}),
            exif_data=data.get("exif_data", {}),
            journal_context=data.get("journal_context", {})
        ))
        
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "primary_path": "Unsorted",
            "alternatives": ["Files/Unsorted"],
            "reasoning": [f"Error in path generation: {str(e)}"],
            "confidence": 0.1
        }
        return json.dumps(error_result)
