# Generated manually to fix column not found errors
from django.db import migrations


def add_columns_if_not_exist(apps, schema_editor):
    """Add UserProfile columns using raw SQL if they don't exist"""
    
    # SQL to add columns only if they don't exist
    sql_commands = [
        # Add organization column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='imagery_userprofile' AND column_name='organization') THEN
                ALTER TABLE imagery_userprofile ADD COLUMN organization VARCHAR(255) DEFAULT '' NOT NULL;
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
            END IF;
        END $$;
        """,
    ]
    
    for sql in sql_commands:
        schema_editor.execute(sql)


class Migration(migrations.Migration):

    dependencies = [
        ('imagery', '0002_userprofile_approval_status_userprofile_approved_at_and_more'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_not_exist, migrations.RunPython.noop),
    ]
