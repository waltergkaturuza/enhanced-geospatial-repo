"""
Script to create compressed archives from shapefile components for upload.
Supports multiple compression formats: ZIP, TAR, TAR.GZ, TAR.BZ2, RAR, 7Z
Place this script in the same directory as your shapefile components.
"""
import zipfile
import tarfile
import os
import glob

def create_shapefile_archive(shapefile_name, format='zip', output_name=None):
    """
    Create a compressed archive containing all components of a shapefile.
    
    Args:
        shapefile_name: Base name of the shapefile (without extension)
        format: Compression format ('zip', 'tar', 'tar.gz', 'tar.bz2', 'rar', '7z')
        output_name: Name for the output file (optional)
    """
    if output_name is None:
        extension_map = {
            'zip': '.zip',
            'tar': '.tar',
            'tar.gz': '.tar.gz',
            'tar.bz2': '.tar.bz2',
            'rar': '.rar',
            '7z': '.7z'
        }
        output_name = f"{shapefile_name}{extension_map.get(format, '.zip')}"
    
    # Find all files with the shapefile base name
    pattern = f"{shapefile_name}.*"
    files = glob.glob(pattern)
    
    if not files:
        print(f"No files found with pattern: {pattern}")
        return
    
    print(f"Creating {format.upper()} archive: {output_name}")
    
    # Create archive based on format
    if format == 'zip':
        create_zip_archive(files, output_name)
    elif format == 'tar':
        create_tar_archive(files, output_name, compression=None)
    elif format == 'tar.gz':
        create_tar_archive(files, output_name, compression='gz')
    elif format == 'tar.bz2':
        create_tar_archive(files, output_name, compression='bz2')
    elif format == 'rar':
        create_rar_archive(files, output_name)
    elif format == '7z':
        create_7z_archive(files, output_name)
    else:
        print(f"Unsupported format: {format}")
        return
    
    print(f"Created archive: {output_name}")
    print("You can now upload this archive to the AOI upload interface.")

def create_zip_archive(files, output_name):
    """Create ZIP archive."""
    with zipfile.ZipFile(output_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files:
            print(f"Adding: {file}")
            zipf.write(file, os.path.basename(file))

def create_tar_archive(files, output_name, compression=None):
    """Create TAR archive with optional compression."""
    mode_map = {
        None: 'w',
        'gz': 'w:gz',
        'bz2': 'w:bz2'
    }
    
    with tarfile.open(output_name, mode_map[compression]) as tarf:
        for file in files:
            print(f"Adding: {file}")
            tarf.add(file, arcname=os.path.basename(file))

def create_rar_archive(files, output_name):
    """Create RAR archive (requires WinRAR or rar command)."""
    try:
        import subprocess
        
        # Try to use rar command
        cmd = ['rar', 'a', output_name] + files
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Error creating RAR archive: {result.stderr}")
            print("Make sure 'rar' command is available in your PATH")
            print("Fallback: Creating ZIP archive instead")
            create_zip_archive(files, output_name.replace('.rar', '.zip'))
        else:
            for file in files:
                print(f"Added: {file}")
                
    except FileNotFoundError:
        print("RAR command not found. Please install WinRAR or rar command-line tool")
        print("Fallback: Creating ZIP archive instead")
        create_zip_archive(files, output_name.replace('.rar', '.zip'))

def create_7z_archive(files, output_name):
    """Create 7Z archive (requires py7zr or 7z command)."""
    try:
        # Try using py7zr library first
        import py7zr
        
        with py7zr.SevenZipFile(output_name, 'w') as sevenzf:
            for file in files:
                print(f"Adding: {file}")
                sevenzf.write(file, os.path.basename(file))
                
    except ImportError:
        try:
            # Fallback to 7z command
            import subprocess
            
            cmd = ['7z', 'a', output_name] + files
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"Error creating 7Z archive: {result.stderr}")
                print("Make sure '7z' command is available in your PATH")
                print("Fallback: Creating ZIP archive instead")
                create_zip_archive(files, output_name.replace('.7z', '.zip'))
            else:
                for file in files:
                    print(f"Added: {file}")
                    
        except FileNotFoundError:
            print("py7zr library and 7z command not found.")
            print("Install: pip install py7zr")
            print("Or install 7-Zip and add to PATH")
            print("Fallback: Creating ZIP archive instead")
            create_zip_archive(files, output_name.replace('.7z', '.zip'))

if __name__ == "__main__":
    # Example usage for Buhera District with different formats
    shapefile_base = "Buhera_District"
    
    print("Available compression formats:")
    print("1. ZIP (recommended, universally supported)")
    print("2. TAR")
    print("3. TAR.GZ (compressed tar)")
    print("4. TAR.BZ2 (compressed tar)")
    print("5. RAR (requires rar command)")
    print("6. 7Z (requires py7zr or 7z command)")
    
    # Create default ZIP archive
    create_shapefile_archive(shapefile_base, format='zip')
    
    # Uncomment to create other formats:
    # create_shapefile_archive(shapefile_base, format='tar.gz')
    # create_shapefile_archive(shapefile_base, format='rar')
    # create_shapefile_archive(shapefile_base, format='7z')
