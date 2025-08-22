
"""
Guard Rail Tool - Pre-flight Safety & Quota Checks
Part of the THANOS file organization system
"""

import json
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

class GuardRailTool:
    """
    Pre-flight safety checks and quota validation for THANOS system
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)
    
    async def execute(self, user_id: str, org_id: str, scope: str, tier: str) -> Dict[str, Any]:
        """
        Perform comprehensive safety checks before processing
        
        Args:
            user_id: User identifier
            org_id: Organization identifier  
            scope: File scope to process
            tier: User tier (Standard/Pro/Veteran)
            
        Returns:
            Dict with validation results and warnings
        """
        
        result = {
            "ok": True,
            "warnings": [],
            "quotas": {},
            "permissions": {},
            "estimated_time": 0,
            "estimated_cost": 0.0
        }
        
        try:
            # Check user permissions
            permissions = await self._check_permissions(user_id, org_id, scope)
            result["permissions"] = permissions
            
            if not permissions.get("read_access"):
                result["ok"] = False
                result["warnings"].append("No read access to specified scope")
                return result
            
            # Check tier quotas
            quotas = await self._check_quotas(user_id, tier)
            result["quotas"] = quotas
            
            if quotas.get("files_remaining", 0) <= 0:
                result["ok"] = False
                result["warnings"].append("File processing quota exceeded")
                return result
            
            # Estimate scope size
            scope_info = await self._analyze_scope(scope)
            
            if scope_info["file_count"] > quotas.get("max_files_per_job", 1000):
                result["ok"] = False
                result["warnings"].append(f"Scope contains {scope_info['file_count']} files, exceeding limit of {quotas['max_files_per_job']}")
                return result
            
            # Check system resources
            system_status = await self._check_system_resources()
            
            if system_status["cpu_usage"] > 80:
                result["warnings"].append("High system load may cause slower processing")
            
            if system_status["memory_available"] < 2000:  # MB
                result["warnings"].append("Low memory available, consider smaller batch sizes")
            
            # Estimate processing time and cost
            result["estimated_time"] = self._estimate_processing_time(
                scope_info["file_count"], 
                scope_info["total_size"],
                tier
            )
            
            result["estimated_cost"] = self._estimate_cost(
                scope_info["file_count"],
                tier
            )
            
            # Check for potential issues
            issues = await self._detect_potential_issues(scope, scope_info)
            result["warnings"].extend(issues)
            
            self.logger.info(f"Guard rail check completed for user {user_id}, scope: {scope}")
            
        except Exception as e:
            self.logger.error(f"Guard rail check failed: {str(e)}")
            result["ok"] = False
            result["warnings"].append(f"Safety check failed: {str(e)}")
        
        return result
    
    async def _check_permissions(self, user_id: str, org_id: str, scope: str) -> Dict[str, bool]:
        """Check user permissions for the given scope"""
        
        # Mock implementation - replace with actual permission system
        return {
            "read_access": True,
            "write_access": True,
            "delete_access": True,
            "admin_access": user_id in self.config.get("admin_users", [])
        }
    
    async def _check_quotas(self, user_id: str, tier: str) -> Dict[str, int]:
        """Check current quota usage and limits"""
        
        tier_limits = {
            "Standard": {
                "max_files_per_job": 100,
                "max_jobs_per_day": 5,
                "max_storage_gb": 1
            },
            "Pro": {
                "max_files_per_job": 1000,
                "max_jobs_per_day": 20,
                "max_storage_gb": 10
            },
            "Veteran": {
                "max_files_per_job": 10000,
                "max_jobs_per_day": 100,
                "max_storage_gb": 100
            }
        }
        
        limits = tier_limits.get(tier, tier_limits["Standard"])
        
        # Mock current usage - replace with actual quota tracking
        current_usage = {
            "files_processed_today": 25,
            "jobs_run_today": 2,
            "storage_used_gb": 0.5
        }
        
        return {
            **limits,
            "files_remaining": limits["max_files_per_job"],
            "jobs_remaining": limits["max_jobs_per_day"] - current_usage["jobs_run_today"],
            "storage_remaining_gb": limits["max_storage_gb"] - current_usage["storage_used_gb"]
        }
    
    async def _analyze_scope(self, scope: str) -> Dict[str, Any]:
        """Analyze the file scope to understand size and complexity"""
        
        # Mock implementation - replace with actual scope analysis
        return {
            "file_count": 150,
            "total_size": 1024 * 1024 * 500,  # 500 MB
            "file_types": ["jpg", "png", "pdf", "docx", "txt"],
            "has_media_files": True,
            "has_documents": True,
            "average_file_size": 1024 * 1024 * 3.3  # 3.3 MB
        }
    
    async def _check_system_resources(self) -> Dict[str, float]:
        """Check current system resource utilization"""
        
        # Mock implementation - replace with actual system monitoring
        return {
            "cpu_usage": 45.5,
            "memory_usage": 60.2,
            "memory_available": 4096,  # MB
            "disk_usage": 75.0,
            "network_latency": 50  # ms
        }
    
    def _estimate_processing_time(self, file_count: int, total_size: int, tier: str) -> int:
        """Estimate processing time based on file count, size, and tier"""
        
        base_time_per_file = {
            "Standard": 2.0,  # seconds per file
            "Pro": 1.5,
            "Veteran": 1.0
        }
        
        time_per_file = base_time_per_file.get(tier, 2.0)
        
        # Additional time for large files
        avg_file_size = total_size / file_count if file_count > 0 else 0
        size_multiplier = 1.0
        
        if avg_file_size > 10 * 1024 * 1024:  # 10MB
            size_multiplier = 1.5
        elif avg_file_size > 50 * 1024 * 1024:  # 50MB
            size_multiplier = 2.0
        
        estimated_seconds = int(file_count * time_per_file * size_multiplier)
        return estimated_seconds
    
    def _estimate_cost(self, file_count: int, tier: str) -> float:
        """Estimate processing cost based on file count and tier"""
        
        cost_per_file = {
            "Standard": 0.001,  # $0.001 per file
            "Pro": 0.002,
            "Veteran": 0.005
        }
        
        return file_count * cost_per_file.get(tier, 0.001)
    
    async def _detect_potential_issues(self, scope: str, scope_info: Dict[str, Any]) -> List[str]:
        """Detect potential issues that might affect processing"""
        
        issues = []
        
        # Check for very large files
        if scope_info["average_file_size"] > 100 * 1024 * 1024:  # 100MB
            issues.append("Large files detected - processing may be slower")
        
        # Check for unusual file types
        common_types = {"jpg", "jpeg", "png", "pdf", "docx", "txt", "mp4", "mov"}
        unusual_types = set(scope_info["file_types"]) - common_types
        
        if unusual_types:
            issues.append(f"Unusual file types detected: {', '.join(unusual_types)}")
        
        # Check for very large scope
        if scope_info["file_count"] > 5000:
            issues.append("Large scope detected - consider processing in batches")
        
        return issues

# Abacus AI Function Wrapper
def guard_rail_function(input_data: str) -> str:
    """
    Abacus AI function wrapper for guard rail checks
    """
    
    try:
        data = json.loads(input_data)
        
        config = {
            "admin_users": ["admin123", "superuser456"]
        }
        
        tool = GuardRailTool(config)
        
        # Run async function synchronously for Abacus AI
        import asyncio
        result = asyncio.run(tool.execute(
            user_id=data.get("user_id"),
            org_id=data.get("org_id"), 
            scope=data.get("scope"),
            tier=data.get("tier", "Standard")
        ))
        
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "ok": False,
            "warnings": [f"Guard rail execution failed: {str(e)}"],
            "quotas": {},
            "permissions": {}
        }
        return json.dumps(error_result)
