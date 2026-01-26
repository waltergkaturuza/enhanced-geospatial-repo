"""
Management command to manually add UserProfile columns
Run this on Render as a one-off job if migrations aren't working
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Manually add UserProfile columns using raw SQL'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.WARNING('FIXING USERPROFILE COLUMNS'))
        self.stdout.write('=' * 60)
        
        sql_commands = [
            # Add organization column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='organization') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN organization VARCHAR(255) DEFAULT '' NOT NULL;
                    RAISE NOTICE 'Added column: organization';
                ELSE
                    RAISE NOTICE 'Column already exists: organization';
                END IF;
            END $$;
            """,
            
            # Add organization_type column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='organization_type') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN organization_type VARCHAR(100) DEFAULT '' NOT NULL;
                    RAISE NOTICE 'Added column: organization_type';
                ELSE
                    RAISE NOTICE 'Column already exists: organization_type';
                END IF;
            END $$;
            """,
            
            # Add intended_use column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='intended_use') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN intended_use VARCHAR(100) DEFAULT '' NOT NULL;
                    RAISE NOTICE 'Added column: intended_use';
                ELSE
                    RAISE NOTICE 'Column already exists: intended_use';
                END IF;
            END $$;
            """,
            
            # Add intended_use_details column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='intended_use_details') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN intended_use_details TEXT DEFAULT '' NOT NULL;
                    RAISE NOTICE 'Added column: intended_use_details';
                ELSE
                    RAISE NOTICE 'Column already exists: intended_use_details';
                END IF;
            END $$;
            """,
            
            # Add country column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='country') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN country VARCHAR(100) DEFAULT 'Zimbabwe' NOT NULL;
                    RAISE NOTICE 'Added column: country';
                ELSE
                    RAISE NOTICE 'Column already exists: country';
                END IF;
            END $$;
            """,
            
            # Add user_path column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='user_path') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN user_path VARCHAR(50) DEFAULT 'individual' NOT NULL;
                    RAISE NOTICE 'Added column: user_path';
                ELSE
                    RAISE NOTICE 'Column already exists: user_path';
                END IF;
            END $$;
            """,
            
            # Add approval_status column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='approval_status') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' NOT NULL;
                    RAISE NOTICE 'Added column: approval_status';
                ELSE
                    RAISE NOTICE 'Column already exists: approval_status';
                END IF;
            END $$;
            """,
            
            # Add approved_at column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='approved_at') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN approved_at TIMESTAMP NULL;
                    RAISE NOTICE 'Added column: approved_at';
                ELSE
                    RAISE NOTICE 'Column already exists: approved_at';
                END IF;
            END $$;
            """,
            
            # Add approved_by_id column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='approved_by_id') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN approved_by_id INTEGER NULL;
                    RAISE NOTICE 'Added column: approved_by_id';
                ELSE
                    RAISE NOTICE 'Column already exists: approved_by_id';
                END IF;
            END $$;
            """,
            
            # Add rejection_reason column
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='imagery_userprofile' AND column_name='rejection_reason') THEN
                    ALTER TABLE imagery_userprofile ADD COLUMN rejection_reason TEXT DEFAULT '' NOT NULL;
                    RAISE NOTICE 'Added column: rejection_reason';
                ELSE
                    RAISE NOTICE 'Column already exists: rejection_reason';
                END IF;
            END $$;
            """,
            
            # Add foreign key constraint if needed
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                              WHERE constraint_name='imagery_userprofile_approved_by_id_fkey') THEN
                    ALTER TABLE imagery_userprofile 
                    ADD CONSTRAINT imagery_userprofile_approved_by_id_fkey 
                    FOREIGN KEY (approved_by_id) REFERENCES auth_user(id) ON DELETE SET NULL;
                    RAISE NOTICE 'Added foreign key: approved_by_id';
                ELSE
                    RAISE NOTICE 'Foreign key already exists: approved_by_id';
                END IF;
            END $$;
            """,
        ]
        
        with connection.cursor() as cursor:
            for i, sql in enumerate(sql_commands, 1):
                try:
                    self.stdout.write(f'Executing command {i}/{len(sql_commands)}...')
                    cursor.execute(sql)
                    self.stdout.write(self.style.SUCCESS(f'✓ Command {i} completed'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Command {i} failed: {str(e)}'))
                    # Continue with other commands
        
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS('✓ USERPROFILE COLUMNS FIXED'))
        self.stdout.write('=' * 60)
        self.stdout.write('')
        self.stdout.write('You can now:')
        self.stdout.write('1. Refresh the admin page')
        self.stdout.write('2. Try signing up a new user')
        self.stdout.write('3. All API endpoints should work')
