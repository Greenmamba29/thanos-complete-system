
"""
List Files Tool - File Enumeration and Discovery
Part of the THANOS file organization system
"""

import json
import logging
import os
from typing import Dict, Any, List, Optional, Generator
from pathlib import Path
import asyncio
import aiofiles
from datetime import datetime

class ListFilesTool:
    """
    Enumerate and discover files within a scope with pagination support
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.supported_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.heic', '.raw',  # Images
            '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv',  # Videos
            '.mp3', '.wav', '.flac', '.aac', '.ogg',  # Audio
            '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',  # Documents
            '.xls', '.xlsx', '.csv', '.ods',  # Spreadsheets
            '.ppt', '.pptx', '.odp',  # Presentations
            '.zip', '.rar', '.7z', '.tar', '.gz'  # Archives
        }
    
    async def execute(self, scope: str, cursor: str = None, 
                     limit: int = 1000, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        List files within the specified scope
        
        Args:
            scope: File path or S3 prefix to enumerate
            cursor: Pagination cursor for continuing from previous call
            limit: Maximum number of files to return
            filters: Optional filters for file selection
            
        Returns:
            Dict with files list, metadata, and next cursor
        """
        
        result = {
            "files": [],
            "total_found": 0,
            "total_size": 0,
            "next_cursor": None,
            "has_more": False,
            "scan_stats": {
                "directories_scanned": 0,
                "files_filtered": 0,
                "errors_encountered": 0
            },
            "scope_info": {
                "scope": scope,
                "scan_time": datetime.utcnow().isoformat(),
                "file_types": {},
                "size_distribution": {}
            }
        }
        
        try:
            # Parse cursor to determine starting position
            start_position = self._parse_cursor(cursor)
            
            # Apply filters
            filters = filters or {}
            
            # Enumerate files based on scope type
            if scope.startswith('s3://'):
                files_generator = self._list_s3_files(scope, start_position, limit, filters)
            else:
                files_generator = self._list_local_files(scope, start_position, limit, filters)
            
            # Collect files with metadata
            files_collected = 0
            current_position = start_position
            
            async for file_info in files_generator:
                if files_collected >= limit:
                    result["has_more"] = True
                    result["next_cursor"] = self._generate_cursor(current_position + files_collected)
                    break
                
                result["files"].append(file_info)
                result["total_size"] += file_info.get("size", 0)
                
                # Update file type stats
                ext = os.path.splitext(file_info["name"])[1].lower()
                result["scope_info"]["file_types"][ext] = result["scope_info"]["file_types"].get(ext, 0) + 1
                
                files_collected += 1
                current_position += 1
            
            result["total_found"] = files_collected
            
            # Generate size distribution stats
            result["scope_info"]["size_distribution"] = self._generate_size_stats(result["files"])
            
            self.logger.info(f"Listed {files_collected} files from scope: {scope}")
            
        except Exception as e:
            self.logger.error(f"File listing failed for scope {scope}: {str(e)}")
            result["scan_stats"]["errors_encountered"] = 1
            result["error"] = str(e)
        
        return result
    
    def _parse_cursor(self, cursor: str) -> int:
        """Parse pagination cursor to determine starting position"""
        if not cursor:
            return 0
        
        try:
            # Simple integer cursor implementation
            return int(cursor)
        except (ValueError, TypeError):
            return 0
    
    def _generate_cursor(self, position: int) -> str:
        """Generate cursor for pagination"""
        return str(position)
    
    async def _list_local_files(self, base_path: str, start_position: int, 
                               limit: int, filters: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """List files from local filesystem"""
        
        base_path = Path(base_path)
        if not base_path.exists():
            raise ValueError(f"Path does not exist: {base_path}")
        
        position = 0
        
        # Walk through directory structure
        for root, dirs, files in os.walk(base_path):
            # Skip hidden directories unless specifically requested
            if not filters.get("include_hidden", False):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file_name in files:
                # Skip hidden files unless specifically requested
                if not filters.get("include_hidden", False) and file_name.startswith('.'):
                    continue
                
                file_path = Path(root) / file_name
                
                # Apply extension filter
                if not self._matches_extension_filter(file_name, filters):
                    continue
                
                # Apply size filter
                try:
                    file_size = file_path.stat().st_size
                    if not self._matches_size_filter(file_size, filters):
                        continue
                except OSError:
                    continue
                
                # Skip to start position
                if position < start_position:
                    position += 1
                    continue
                
                # Generate file info
                file_info = await self._get_file_info(file_path, root)
                
                yield file_info
                position += 1
    
    async def _list_s3_files(self, s3_uri: str, start_position: int, 
                            limit: int, filters: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """List files from S3 bucket"""
        
        # Parse S3 URI
        parts = s3_uri.replace('s3://', '').split('/', 1)
        bucket_name = parts[0]
        prefix = parts[1] if len(parts) > 1 else ''
        
        # Mock S3 implementation - replace with actual AWS SDK calls
        # This would typically use boto3 to list S3 objects
        
        mock_s3_files = [
            {
                "key": f"{prefix}/photo_{i}.jpg",
                "size": 1024 * (i + 1),
                "last_modified": datetime.utcnow().isoformat()
            }
            for i in range(start_position, start_position + limit)
        ]
        
        position = start_position
        
        for s3_obj in mock_s3_files:
            if not self._matches_extension_filter(s3_obj["key"], filters):
                continue
            
            if not self._matches_size_filter(s3_obj["size"], filters):
                continue
            
            file_info = {
                "path": f"s3://{bucket_name}/{s3_obj['key']}",
                "name": os.path.basename(s3_obj["key"]),
                "size": s3_obj["size"],
                "modified": s3_obj["last_modified"],
                "type": "file",
                "extension": os.path.splitext(s3_obj["key"])[1].lower(),
                "is_supported": os.path.splitext(s3_obj["key"])[1].lower() in self.supported_extensions
            }
            
            yield file_info
            position += 1
    
    async def _get_file_info(self, file_path: Path, base_dir: str) -> Dict[str, Any]:
        """Get detailed information about a file"""
        
        try:
            stat = file_path.stat()
            
            file_info = {
                "path": str(file_path),
                "name": file_path.name,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "type": "file",
                "extension": file_path.suffix.lower(),
                "relative_path": str(file_path.relative_to(base_dir)),
                "is_supported": file_path.suffix.lower() in self.supported_extensions,
                "mime_type": self._guess_mime_type(file_path.name),
                "permissions": oct(stat.st_mode)[-3:]
            }
            
            # Add quick content preview for small text files
            if (file_path.suffix.lower() in ['.txt', '.md', '.csv'] and 
                stat.st_size < 10240):  # 10KB limit
                try:
                    async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                        content = await f.read(500)  # First 500 chars
                        file_info["preview"] = content
                except (UnicodeDecodeError, IOError):
                    # Skip preview for binary or unreadable files
                    pass
            
            return file_info
            
        except (OSError, ValueError) as e:
            self.logger.warning(f"Could not get info for {file_path}: {str(e)}")
            return {
                "path": str(file_path),
                "name": file_path.name,
                "error": str(e),
                "type": "error"
            }
    
    def _matches_extension_filter(self, filename: str, filters: Dict[str, Any]) -> bool:
        """Check if file matches extension filter"""
        
        if not filters.get("extensions"):
            return True
        
        file_ext = os.path.splitext(filename)[1].lower()
        allowed_extensions = [ext.lower() for ext in filters["extensions"]]
        
        return file_ext in allowed_extensions
    
    def _matches_size_filter(self, file_size: int, filters: Dict[str, Any]) -> bool:
        """Check if file matches size filter"""
        
        min_size = filters.get("min_size", 0)
        max_size = filters.get("max_size", float('inf'))
        
        return min_size <= file_size <= max_size
    
    def _guess_mime_type(self, filename: str) -> str:
        """Guess MIME type from filename"""
        
        import mimetypes
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or "application/octet-stream"
    
    def _generate_size_stats(self, files: List[Dict[str, Any]]) -> Dict[str, int]:
        """Generate file size distribution statistics"""
        
        size_buckets = {
            "tiny": 0,      # < 10KB
            "small": 0,     # 10KB - 100KB  
            "medium": 0,    # 100KB - 1MB
            "large": 0,     # 1MB - 10MB
            "huge": 0       # > 10MB
        }
        
        for file_info in files:
            size = file_info.get("size", 0)
            
            if size < 10240:  # 10KB
                size_buckets["tiny"] += 1
            elif size < 102400:  # 100KB
                size_buckets["small"] += 1
            elif size < 1048576:  # 1MB
                size_buckets["medium"] += 1
            elif size < 10485760:  # 10MB
                size_buckets["large"] += 1
            else:
                size_buckets["huge"] += 1
        
        return size_buckets

# Abacus AI Function Wrapper
def list_files_function(input_data: str) -> str:
    """
    Abacus AI function wrapper for file listing
    """
    
    try:
        data = json.loads(input_data)
        
        config = {
            "max_files_per_call": 1000,
            "include_hidden": False
        }
        
        tool = ListFilesTool(config)
        
        # Run async function synchronously for Abacus AI
        import asyncio
        result = asyncio.run(tool.execute(
            scope=data.get("scope"),
            cursor=data.get("cursor"),
            limit=data.get("limit", 1000),
            filters=data.get("filters", {})
        ))
        
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "files": [],
            "total_found": 0,
            "error": str(e),
            "scope": data.get("scope", "unknown")
        }
        return json.dumps(error_result)
