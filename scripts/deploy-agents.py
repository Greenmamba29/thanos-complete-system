
#!/usr/bin/env python3
"""
Deploy Agents Script
Automates deployment of all THANOS agents to Abacus AI
"""

import json
import os
import sys
import requests
from pathlib import Path

class AbacusDeployer:
    def __init__(self, api_key, project_id):
        self.api_key = api_key
        self.project_id = project_id
        self.base_url = "https://api.abacus.ai/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def deploy_all_agents(self):
        """Deploy all agents and tools to Abacus AI"""
        
        print("🚀 Starting THANOS agent deployment...")
        
        # Deploy individual tools first
        tools_to_deploy = [
            "guard-rail.py",
            "list-files.py", 
            "extract-exif.py",
            "classify-file.py",
            "suggest-folder.py"
        ]
        
        tools_dir = Path("agents/tools")
        
        for tool_file in tools_to_deploy:
            tool_path = tools_dir / tool_file
            if tool_path.exists():
                print(f"📤 Deploying {tool_file}...")
                success = self.deploy_tool(tool_path)
                if success:
                    print(f"✅ {tool_file} deployed successfully")
                else:
                    print(f"❌ Failed to deploy {tool_file}")
            else:
                print(f"⚠️  Tool file not found: {tool_path}")
        
        # Deploy main orchestrator
        orchestrator_path = Path("agents/orchestrator/snap-orchestrator.yaml")
        if orchestrator_path.exists():
            print("📤 Deploying SnapOrchestrator...")
            success = self.deploy_orchestrator(orchestrator_path)
            if success:
                print("✅ SnapOrchestrator deployed successfully")
            else:
                print("❌ Failed to deploy SnapOrchestrator")
        
        print("🎉 Deployment completed!")
    
    def deploy_tool(self, tool_path):
        """Deploy individual tool to Abacus AI"""
        
        try:
            with open(tool_path, 'r') as f:
                tool_code = f.read()
            
            # Extract function name from filename
            tool_name = tool_path.stem.replace('-', '_') + '_tool'
            
            # Create function in Abacus AI
            payload = {
                "name": tool_name,
                "description": f"THANOS {tool_name} function",
                "code": tool_code,
                "runtime": "python3.9",
                "timeout": 300
            }
            
            response = requests.post(
                f"{self.base_url}/projects/{self.project_id}/functions",
                headers=self.headers,
                json=payload
            )
            
            return response.status_code == 201
            
        except Exception as e:
            print(f"Error deploying {tool_path}: {str(e)}")
            return False
    
    def deploy_orchestrator(self, orchestrator_path):
        """Deploy main orchestrator agent"""
        
        try:
            with open(orchestrator_path, 'r') as f:
                orchestrator_config = f.read()
            
            # Create agent in Abacus AI
            payload = {
                "name": "SnapOrchestrator",
                "description": "Main THANOS file organization orchestrator",
                "configuration": orchestrator_config,
                "agent_type": "orchestration"
            }
            
            response = requests.post(
                f"{self.base_url}/projects/{self.project_id}/agents",
                headers=self.headers,
                json=payload
            )
            
            return response.status_code == 201
            
        except Exception as e:
            print(f"Error deploying orchestrator: {str(e)}")
            return False

def main():
    # Get configuration from environment or command line
    api_key = os.environ.get('ABACUS_API_KEY')
    project_id = os.environ.get('ABACUS_PROJECT_ID')
    
    if not api_key:
        api_key = input("Enter your Abacus AI API key: ")
    
    if not project_id:
        project_id = input("Enter your Abacus AI project ID: ")
    
    if not api_key or not project_id:
        print("❌ API key and project ID are required")
        sys.exit(1)
    
    deployer = AbacusDeployer(api_key, project_id)
    deployer.deploy_all_agents()

if __name__ == "__main__":
    main()
