
"""
Extract EXIF Tool - GPS, Timestamp, and Camera Metadata Extraction
Part of the THANOS file organization system
"""

import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import re
from pathlib import Path

class ExtractExifTool:
    """
    Extract EXIF metadata including GPS coordinates, timestamps, and camera information
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
    
    async def execute(self, file_key: str) -> Dict[str, Any]:
        """
        Extract EXIF metadata from image file
        
        Args:
            file_key: File identifier/path
            
        Returns:
            Dict with EXIF metadata including GPS, timestamps, and camera info
        """
        
        result = {
            "file_key": file_key,
            "has_exif": False,
            "datetime": None,
            "gps": None,
            "camera": {},
            "image_info": {},
            "orientation": None,
            "processing_notes": []
        }
        
        try:
            # Check if file type supports EXIF
            if not self._supports_exif(file_key):
                result["processing_notes"].append("File type does not support EXIF metadata")
                return result
            
            # Extract EXIF data (mock implementation)
            exif_data = await self._extract_exif_data(file_key)
            
            if exif_data:
                result["has_exif"] = True
                
                # Extract datetime information
                datetime_info = self._extract_datetime(exif_data)
                if datetime_info:
                    result["datetime"] = datetime_info["original"]
                    result["datetime_digitized"] = datetime_info.get("digitized")
                    result["datetime_modified"] = datetime_info.get("modified")
                
                # Extract GPS information
                gps_info = self._extract_gps(exif_data)
                if gps_info:
                    result["gps"] = gps_info
                
                # Extract camera information
                camera_info = self._extract_camera_info(exif_data)
                result["camera"] = camera_info
                
                # Extract image technical information
                image_info = self._extract_image_info(exif_data)
                result["image_info"] = image_info
                
                # Extract orientation
                result["orientation"] = exif_data.get("orientation", 1)
                
                self.logger.info(f"Extracted EXIF from {file_key}: GPS={bool(gps_info)}, DateTime={bool(datetime_info)}")
            else:
                result["processing_notes"].append("No EXIF data found in file")
            
        except Exception as e:
            self.logger.error(f"EXIF extraction failed for {file_key}: {str(e)}")
            result["processing_notes"].append(f"EXIF extraction error: {str(e)}")
        
        return result
    
    def _supports_exif(self, file_key: str) -> bool:
        """Check if file type supports EXIF metadata"""
        
        exif_extensions = {'.jpg', '.jpeg', '.tiff', '.tif', '.raw', '.cr2', '.nef', '.arw', '.dng'}
        file_ext = Path(file_key).suffix.lower()
        
        return file_ext in exif_extensions
    
    async def _extract_exif_data(self, file_key: str) -> Optional[Dict[str, Any]]:
        """
        Extract raw EXIF data from file
        This is a mock implementation - in production would use exifread, PIL.ExifTags, or exiftool
        """
        
        # Mock EXIF data for demonstration
        # In production, this would use a library like:
        # - PIL/Pillow with ExifTags
        # - exifread library  
        # - pyexiv2
        # - subprocess call to exiftool
        
        mock_exif = {
            "make": "Apple",
            "model": "iPhone 13 Pro",
            "datetime_original": "2023:08:15 14:30:25",
            "datetime_digitized": "2023:08:15 14:30:25",
            "datetime_modified": "2023:08:15 14:30:25",
            "gps_latitude": 37.7749,
            "gps_latitude_ref": "N",
            "gps_longitude": -122.4194,
            "gps_longitude_ref": "W",
            "gps_altitude": 10.5,
            "gps_altitude_ref": 0,
            "gps_timestamp": "21:30:25",
            "gps_datestamp": "2023:08:15",
            "orientation": 1,
            "x_resolution": 72.0,
            "y_resolution": 72.0,
            "resolution_unit": 2,
            "software": "iOS 16.6",
            "artist": None,
            "copyright": None,
            "image_width": 4032,
            "image_height": 3024,
            "bits_per_sample": [8, 8, 8],
            "color_space": 1,
            "flash": 16,
            "focal_length": 6.0,
            "focal_length_35mm": 26,
            "iso_speed": 125,
            "exposure_time": "1/120",
            "f_number": 1.5,
            "exposure_program": 2,
            "metering_mode": 5,
            "scene_type": 1,
            "white_balance": 0
        }
        
        # Simulate some files not having EXIF
        if "no_exif" in file_key.lower():
            return None
        
        return mock_exif
    
    def _extract_datetime(self, exif_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract and normalize datetime information from EXIF"""
        
        datetime_fields = {
            "original": "datetime_original",
            "digitized": "datetime_digitized", 
            "modified": "datetime_modified"
        }
        
        datetime_info = {}
        
        for key, exif_key in datetime_fields.items():
            if exif_key in exif_data:
                datetime_str = exif_data[exif_key]
                normalized_datetime = self._normalize_datetime(datetime_str)
                if normalized_datetime:
                    datetime_info[key] = normalized_datetime
        
        return datetime_info if datetime_info else None
    
    def _normalize_datetime(self, datetime_str: str) -> Optional[str]:
        """Normalize EXIF datetime string to ISO format"""
        
        try:
            # EXIF datetime format: "YYYY:MM:DD HH:MM:SS"
            if ':' in datetime_str and len(datetime_str) >= 19:
                # Replace first two colons with dashes for ISO format
                iso_str = datetime_str[:4] + '-' + datetime_str[5:7] + '-' + datetime_str[8:]
                
                # Parse to validate and reformat
                dt = datetime.fromisoformat(iso_str)
                return dt.isoformat()
            
        except (ValueError, IndexError):
            self.logger.warning(f"Could not parse datetime: {datetime_str}")
        
        return None
    
    def _extract_gps(self, exif_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract GPS coordinates and related information"""
        
        # Check for required GPS fields
        required_fields = ["gps_latitude", "gps_longitude"]
        if not all(field in exif_data for field in required_fields):
            return None
        
        try:
            lat = exif_data["gps_latitude"]
            lon = exif_data["gps_longitude"]
            lat_ref = exif_data.get("gps_latitude_ref", "N")
            lon_ref = exif_data.get("gps_longitude_ref", "W")
            
            # Convert to decimal degrees
            decimal_lat = lat if lat_ref in ["N", "n"] else -lat
            decimal_lon = lon if lon_ref in ["E", "e"] else -lon
            
            gps_info = {
                "lat": decimal_lat,
                "lng": decimal_lon,
                "lat_ref": lat_ref,
                "lng_ref": lon_ref
            }
            
            # Add altitude if available
            if "gps_altitude" in exif_data:
                altitude = exif_data["gps_altitude"]
                altitude_ref = exif_data.get("gps_altitude_ref", 0)
                
                # Altitude reference: 0 = above sea level, 1 = below sea level
                gps_info["altitude"] = altitude if altitude_ref == 0 else -altitude
                gps_info["altitude_ref"] = altitude_ref
            
            # Add GPS timestamp if available
            if "gps_timestamp" in exif_data and "gps_datestamp" in exif_data:
                gps_date = exif_data["gps_datestamp"]
                gps_time = exif_data["gps_timestamp"]
                
                try:
                    # Convert GPS date/time to ISO format
                    gps_datetime_str = f"{gps_date.replace(':', '-')} {gps_time}"
                    gps_dt = datetime.fromisoformat(gps_datetime_str)
                    gps_info["timestamp"] = gps_dt.isoformat()
                except ValueError:
                    pass
            
            return gps_info
            
        except (TypeError, ValueError) as e:
            self.logger.warning(f"Could not parse GPS data: {str(e)}")
            return None
    
    def _extract_camera_info(self, exif_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract camera and shooting information"""
        
        camera_info = {}
        
        # Basic camera identification
        if "make" in exif_data:
            camera_info["make"] = exif_data["make"]
        
        if "model" in exif_data:
            camera_info["model"] = exif_data["model"]
        
        if "software" in exif_data:
            camera_info["software"] = exif_data["software"]
        
        # Shooting settings
        if "iso_speed" in exif_data:
            camera_info["iso"] = exif_data["iso_speed"]
        
        if "exposure_time" in exif_data:
            camera_info["exposure_time"] = exif_data["exposure_time"]
        
        if "f_number" in exif_data:
            camera_info["aperture"] = f"f/{exif_data['f_number']}"
        
        if "focal_length" in exif_data:
            camera_info["focal_length"] = f"{exif_data['focal_length']}mm"
        
        if "focal_length_35mm" in exif_data:
            camera_info["focal_length_35mm"] = f"{exif_data['focal_length_35mm']}mm"
        
        # Flash information
        if "flash" in exif_data:
            flash_value = exif_data["flash"]
            camera_info["flash"] = self._decode_flash(flash_value)
        
        # Exposure and metering modes
        if "exposure_program" in exif_data:
            camera_info["exposure_program"] = self._decode_exposure_program(exif_data["exposure_program"])
        
        if "metering_mode" in exif_data:
            camera_info["metering_mode"] = self._decode_metering_mode(exif_data["metering_mode"])
        
        if "white_balance" in exif_data:
            camera_info["white_balance"] = "Auto" if exif_data["white_balance"] == 0 else "Manual"
        
        return camera_info
    
    def _extract_image_info(self, exif_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract technical image information"""
        
        image_info = {}
        
        # Image dimensions
        if "image_width" in exif_data:
            image_info["width"] = exif_data["image_width"]
        
        if "image_height" in exif_data:
            image_info["height"] = exif_data["image_height"]
        
        # Calculate megapixels
        if "image_width" in exif_data and "image_height" in exif_data:
            megapixels = (exif_data["image_width"] * exif_data["image_height"]) / 1000000
            image_info["megapixels"] = round(megapixels, 1)
        
        # Resolution information
        if "x_resolution" in exif_data:
            image_info["x_resolution"] = exif_data["x_resolution"]
        
        if "y_resolution" in exif_data:
            image_info["y_resolution"] = exif_data["y_resolution"]
        
        if "resolution_unit" in exif_data:
            unit = "inches" if exif_data["resolution_unit"] == 2 else "cm"
            image_info["resolution_unit"] = unit
        
        # Color information
        if "color_space" in exif_data:
            color_space = "sRGB" if exif_data["color_space"] == 1 else "Adobe RGB"
            image_info["color_space"] = color_space
        
        if "bits_per_sample" in exif_data:
            image_info["bit_depth"] = exif_data["bits_per_sample"][0]
        
        return image_info
    
    def _decode_flash(self, flash_value: int) -> str:
        """Decode flash EXIF value to human readable string"""
        
        flash_modes = {
            0: "No Flash",
            1: "Flash fired",
            5: "Strobe return light not detected",
            7: "Strobe return light detected",
            9: "Flash fired, compulsory flash mode",
            13: "Flash fired, compulsory flash mode, return light not detected",
            15: "Flash fired, compulsory flash mode, return light detected",
            16: "Flash did not fire, compulsory flash mode",
            24: "Flash did not fire, auto mode",
            25: "Flash fired, auto mode",
            29: "Flash fired, auto mode, return light not detected",
            31: "Flash fired, auto mode, return light detected"
        }
        
        return flash_modes.get(flash_value, f"Flash mode {flash_value}")
    
    def _decode_exposure_program(self, program_value: int) -> str:
        """Decode exposure program EXIF value"""
        
        programs = {
            0: "Not defined",
            1: "Manual",
            2: "Normal program",
            3: "Aperture priority",
            4: "Shutter priority", 
            5: "Creative program",
            6: "Action program",
            7: "Portrait mode",
            8: "Landscape mode"
        }
        
        return programs.get(program_value, f"Program mode {program_value}")
    
    def _decode_metering_mode(self, metering_value: int) -> str:
        """Decode metering mode EXIF value"""
        
        modes = {
            0: "Unknown",
            1: "Average",
            2: "Center-weighted average",
            3: "Spot",
            4: "Multi-spot",
            5: "Pattern",
            6: "Partial"
        }
        
        return modes.get(metering_value, f"Metering mode {metering_value}")

# Abacus AI Function Wrapper
def extract_exif_function(input_data: str) -> str:
    """
    Abacus AI function wrapper for EXIF extraction
    """
    
    try:
        data = json.loads(input_data)
        
        config = {
            "extract_thumbnails": False,
            "include_maker_notes": False
        }
        
        tool = ExtractExifTool(config)
        
        # Run async function synchronously for Abacus AI
        import asyncio
        result = asyncio.run(tool.execute(
            file_key=data.get("file_key")
        ))
        
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "file_key": data.get("file_key", "unknown"),
            "has_exif": False,
            "error": str(e)
        }
        return json.dumps(error_result)
