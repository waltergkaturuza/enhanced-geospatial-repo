#!/usr/bin/env python3
"""
Data Management Utility for Geospatial Repository
Helps organize, validate, and manage uploaded satellite imagery and UAV data
"""

import os
import sys
import json
import shutil
from pathlib import Path
from datetime import datetime
import argparse

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')
import django
django.setup()

from imagery.upload_handler import SATELLITE_PROVIDERS, detect_satellite_provider, extract_metadata

class DataManager:
    def __init__(self, data_root=None):
        self.data_root = Path(data_root) if data_root else Path(__file__).parent / 'data'
        self.setup_directories()
    
    def setup_directories(self):
        """Ensure all necessary directories exist"""
        directories = [
            'uploads',
            'raw', 
            'processed',
            'cache',
            'exports',
            'temp',
            'metadata',
            'imagery/landsat',
            'imagery/sentinel',
            'imagery/gaofen',
            'imagery/spot',
            'imagery/worldview',
            'imagery/quickbird',
            'imagery/ikonos',
            'imagery/uav',
            'imagery/modis',
            'imagery/viirs',
            'imagery/unknown',
            'administrative_boundaries',
            'hpc_jobs'
        ]
        
        for directory in directories:
            dir_path = self.data_root / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✓ Created/verified directory: {dir_path}")
    
    def scan_uploads(self):
        """Scan the uploads directory and organize files by provider"""
        uploads_dir = self.data_root / 'uploads'
        if not uploads_dir.exists():
            print("No uploads directory found")
            return
        
        print(f"Scanning uploads directory: {uploads_dir}")
        files_found = list(uploads_dir.rglob('*'))
        
        organized_count = 0
        
        for file_path in files_found:
            if file_path.is_file():
                try:
                    # Detect provider
                    provider_key, provider_info = detect_satellite_provider(file_path.name)
                    
                    # Create destination directory
                    dest_dir = self.data_root / provider_info['storage_path']
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    
                    # Move file to appropriate directory
                    dest_path = dest_dir / file_path.name
                    
                    # Avoid overwriting existing files
                    counter = 1
                    original_dest = dest_path
                    while dest_path.exists():
                        stem = original_dest.stem
                        suffix = original_dest.suffix
                        dest_path = dest_dir / f"{stem}_{counter}{suffix}"
                        counter += 1
                    
                    shutil.move(str(file_path), str(dest_path))
                    print(f"Moved {file_path.name} -> {provider_info['name']} ({dest_path})")
                    organized_count += 1
                    
                except Exception as e:
                    print(f"Error processing {file_path.name}: {e}")
        
        print(f"Organized {organized_count} files")
    
    def generate_inventory(self):
        """Generate an inventory of all data files"""
        inventory = {
            'generated_at': datetime.now().isoformat(),
            'total_files': 0,
            'total_size_bytes': 0,
            'providers': {}
        }
        
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            provider_path = self.data_root / provider_info['storage_path']
            
            if provider_path.exists():
                files = []
                total_size = 0
                
                for file_path in provider_path.rglob('*'):
                    if file_path.is_file():
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        
                        # Extract metadata
                        try:
                            metadata = extract_metadata(str(file_path), provider_key)
                        except:
                            metadata = {'error': 'Failed to extract metadata'}
                        
                        files.append({
                            'filename': file_path.name,
                            'size_bytes': file_size,
                            'size_mb': round(file_size / (1024 * 1024), 2),
                            'modified_date': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                            'metadata': metadata
                        })
                
                inventory['providers'][provider_key] = {
                    'name': provider_info['name'],
                    'file_count': len(files),
                    'total_size_bytes': total_size,
                    'total_size_mb': round(total_size / (1024 * 1024), 2),
                    'files': files
                }
                
                inventory['total_files'] += len(files)
                inventory['total_size_bytes'] += total_size
        
        # Save inventory
        inventory_file = self.data_root / 'inventory.json'
        with open(inventory_file, 'w') as f:
            json.dump(inventory, f, indent=2)
        
        print(f"Generated inventory: {inventory_file}")
        print(f"Total files: {inventory['total_files']}")
        print(f"Total size: {inventory['total_size_bytes'] / (1024**3):.2f} GB")
        
        return inventory
    
    def cleanup_temp_files(self):
        """Clean up temporary files older than 24 hours"""
        temp_dir = self.data_root / 'temp'
        cache_dir = self.data_root / 'cache'
        
        cleaned_count = 0
        cleaned_size = 0
        
        for temp_path in [temp_dir, cache_dir]:
            if temp_path.exists():
                for file_path in temp_path.rglob('*'):
                    if file_path.is_file():
                        # Check if file is older than 24 hours
                        file_age = datetime.now().timestamp() - file_path.stat().st_mtime
                        if file_age > 24 * 3600:  # 24 hours in seconds
                            file_size = file_path.stat().st_size
                            file_path.unlink()
                            cleaned_count += 1
                            cleaned_size += file_size
                            print(f"Cleaned: {file_path}")
        
        print(f"Cleaned {cleaned_count} temporary files ({cleaned_size / (1024**2):.1f} MB)")
    
    def validate_data_integrity(self):
        """Validate data integrity and check for corrupted files"""
        print("Validating data integrity...")
        
        issues = []
        checked_files = 0
        
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            provider_path = self.data_root / provider_info['storage_path']
            
            if provider_path.exists():
                for file_path in provider_path.rglob('*'):
                    if file_path.is_file():
                        checked_files += 1
                        
                        # Check if file is empty
                        if file_path.stat().st_size == 0:
                            issues.append(f"Empty file: {file_path}")
                        
                        # Check file extension matches provider
                        file_ext = file_path.suffix.lower()
                        expected_formats = provider_info.get('formats', [])
                        if expected_formats and file_ext not in expected_formats:
                            issues.append(f"Unexpected format {file_ext} for {provider_key}: {file_path}")
        
        print(f"Checked {checked_files} files")
        if issues:
            print(f"Found {len(issues)} issues:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("✓ No data integrity issues found")
        
        return issues
    
    def show_stats(self):
        """Show current data statistics"""
        print("\n" + "="*60)
        print("GEOSPATIAL DATA REPOSITORY STATISTICS")
        print("="*60)
        
        total_files = 0
        total_size = 0
        
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            provider_path = self.data_root / provider_info['storage_path']
            
            if provider_path.exists():
                files = list(provider_path.rglob('*'))
                file_count = len([f for f in files if f.is_file()])
                provider_size = sum(f.stat().st_size for f in files if f.is_file())
                
                if file_count > 0:
                    print(f"{provider_info['name']:<20}: {file_count:>6} files, {provider_size/(1024**2):>8.1f} MB")
                    total_files += file_count
                    total_size += provider_size
        
        print("-" * 60)
        print(f"{'TOTAL':<20}: {total_files:>6} files, {total_size/(1024**3):>8.2f} GB")
        print("="*60)

def main():
    parser = argparse.ArgumentParser(description='Geospatial Data Manager')
    parser.add_argument('--data-root', help='Root directory for data storage')
    parser.add_argument('--organize', action='store_true', help='Organize files from uploads directory')
    parser.add_argument('--inventory', action='store_true', help='Generate data inventory')
    parser.add_argument('--cleanup', action='store_true', help='Clean up temporary files')
    parser.add_argument('--validate', action='store_true', help='Validate data integrity')
    parser.add_argument('--stats', action='store_true', help='Show data statistics')
    parser.add_argument('--setup', action='store_true', help='Setup directory structure')
    
    args = parser.parse_args()
    
    manager = DataManager(args.data_root)
    
    if args.setup:
        print("Setting up directory structure...")
        manager.setup_directories()
    
    if args.organize:
        print("Organizing uploaded files...")
        manager.scan_uploads()
    
    if args.inventory:
        print("Generating data inventory...")
        manager.generate_inventory()
    
    if args.cleanup:
        print("Cleaning up temporary files...")
        manager.cleanup_temp_files()
    
    if args.validate:
        print("Validating data integrity...")
        manager.validate_data_integrity()
    
    if args.stats or not any([args.organize, args.inventory, args.cleanup, args.validate, args.setup]):
        manager.show_stats()

if __name__ == '__main__':
    main()