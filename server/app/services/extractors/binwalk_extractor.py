import subprocess
import os
import json
import logging
from pathlib import Path
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class BinwalkExtractor:
    """Firmware extraction using binwalk"""
    
    def __init__(self):
        self.work_dir = Path(settings.work_dir)
        
    def extract(self, firmware_path: str, project_id: str) -> Dict[str, Any]:
        """Extract firmware using binwalk"""
        try:
            # Create project work directory
            project_work_dir = self.work_dir / project_id
            project_work_dir.mkdir(parents=True, exist_ok=True)
            
            # Run binwalk signature analysis first
            signature_result = self._run_signature_analysis(firmware_path)
            
            # Run binwalk extraction
            extract_result = self._run_extraction(firmware_path, str(project_work_dir))
            
            # Find extracted filesystem
            extracted_dirs = self._find_extracted_filesystems(str(project_work_dir))
            
            result = {
                "success": True,
                "project_id": project_id,
                "firmware_path": firmware_path,
                "extract_path": str(project_work_dir),
                "signature_analysis": signature_result,
                "extraction_log": extract_result,
                "extracted_filesystems": extracted_dirs,
                "main_filesystem": extracted_dirs[0] if extracted_dirs else None
            }
            
            logger.info(f"Extraction completed for {project_id}")
            return result
            
        except Exception as e:
            logger.error(f"Extraction failed for {project_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "project_id": project_id
            }
    
    def _run_signature_analysis(self, firmware_path: str) -> Dict[str, Any]:
        """Run binwalk signature analysis"""
        try:
            cmd = ["binwalk", "-B", firmware_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            signatures = []
            if result.stdout:
                for line in result.stdout.split('\n'):
                    if line.strip() and not line.startswith('DECIMAL'):
                        parts = line.split(None, 2)
                        if len(parts) >= 3:
                            signatures.append({
                                "offset": parts[0],
                                "hex_offset": parts[1],
                                "description": parts[2]
                            })
            
            return {
                "signatures": signatures,
                "raw_output": result.stdout,
                "stderr": result.stderr
            }
            
        except subprocess.TimeoutExpired:
            return {"error": "Signature analysis timed out"}
        except Exception as e:
            return {"error": str(e)}
    
    def _run_extraction(self, firmware_path: str, output_dir: str) -> Dict[str, Any]:
        """Run binwalk extraction"""
        try:
            # Change to output directory
            original_cwd = os.getcwd()
            os.chdir(output_dir)
            
            try:
                # Run binwalk with extraction
                cmd = ["binwalk", "-eM", firmware_path]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
                
                return {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode,
                    "success": result.returncode == 0
                }
                
            finally:
                os.chdir(original_cwd)
                
        except subprocess.TimeoutExpired:
            return {"error": "Extraction timed out", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _find_extracted_filesystems(self, work_dir: str) -> list:
        """Find extracted filesystem directories"""
        extracted_dirs = []
        work_path = Path(work_dir)
        
        # Look for common extraction patterns
        for item in work_path.iterdir():
            if item.is_dir():
                # Check if it looks like an extracted filesystem
                if self._is_filesystem_dir(item):
                    extracted_dirs.append(str(item))
        
        # Sort by size (largest first)
        extracted_dirs.sort(key=lambda x: self._get_dir_size(x), reverse=True)
        
        return extracted_dirs
    
    def _is_filesystem_dir(self, dir_path: Path) -> bool:
        """Check if directory looks like an extracted filesystem"""
        # Look for common filesystem indicators
        common_dirs = ['bin', 'etc', 'usr', 'var', 'lib', 'sbin', 'tmp']
        common_files = ['busybox', 'init', 'passwd', 'shadow']
        
        found_dirs = 0
        found_files = 0
        
        try:
            for item in dir_path.iterdir():
                if item.is_dir() and item.name in common_dirs:
                    found_dirs += 1
                elif item.is_file() and item.name in common_files:
                    found_files += 1
                    
                # Also check in subdirectories
                if item.name == 'etc' and item.is_dir():
                    for subitem in item.iterdir():
                        if subitem.name in common_files:
                            found_files += 1
        except PermissionError:
            pass
        
        # Consider it a filesystem if we found multiple indicators
        return (found_dirs >= 2) or (found_files >= 1)
    
    def _get_dir_size(self, dir_path: str) -> int:
        """Get total size of directory"""
        try:
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(dir_path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    try:
                        total_size += os.path.getsize(filepath)
                    except (OSError, IOError):
                        pass
            return total_size
        except:
            return 0
