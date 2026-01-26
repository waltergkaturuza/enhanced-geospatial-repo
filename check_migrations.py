#!/usr/bin/env python
"""
Check database migration status
Run this to see if migrations are up to date
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')
django.setup()

from django.core.management import call_command
from django.db import connection

def check_migrations():
    """Check if there are unapplied migrations"""
    print("=" * 60)
    print("MIGRATION STATUS CHECK")
    print("=" * 60)
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            db_version = cursor.fetchone()[0]
        print(f"✅ Database connected: {db_version[:50]}...")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # Check for unapplied migrations
    print("\n" + "=" * 60)
    print("CHECKING FOR UNAPPLIED MIGRATIONS")
    print("=" * 60)
    
    try:
        call_command('showmigrations', '--plan')
        print("\n✅ Migration check complete")
        return True
    except Exception as e:
        print(f"❌ Migration check failed: {e}")
        return False

if __name__ == '__main__':
    success = check_migrations()
    sys.exit(0 if success else 1)
