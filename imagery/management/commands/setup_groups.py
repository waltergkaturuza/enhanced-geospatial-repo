"""
Management command to create default user groups with appropriate permissions.
Run: python manage.py setup_groups
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates default user groups (Admin, User, Viewer) with appropriate permissions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset groups (delete existing and recreate)',
        )

    def handle(self, *args, **options):
        reset = options['reset']
        
        # Define groups and their permissions
        groups_config = {
            'Admin': {
                'description': 'Full administrative access',
                'permissions': 'all',  # All permissions
            },
            'User': {
                'description': 'Standard user with upload and download permissions',
                'permissions': [
                    # Imagery app permissions
                    'add_aoi', 'change_aoi', 'view_aoi', 'delete_aoi',
                    'add_satelliteimage', 'view_satelliteimage',
                    'add_download', 'view_download',
                    'add_indexresult', 'view_indexresult',
                    'add_processingjob', 'view_processingjob',
                    'view_administrativeboundary', 'view_administrativeboundaryset',
                ],
            },
            'Viewer': {
                'description': 'Read-only access for viewing data',
                'permissions': [
                    'view_aoi', 'view_satelliteimage',
                    'view_download', 'view_indexresult',
                    'view_processingjob',
                    'view_administrativeboundary', 'view_administrativeboundaryset',
                ],
            },
        }

        if reset:
            self.stdout.write(self.style.WARNING('Resetting groups...'))
            Group.objects.filter(name__in=groups_config.keys()).delete()

        created_count = 0
        updated_count = 0

        for group_name, config in groups_config.items():
            group, created = Group.objects.get_or_create(name=group_name)
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created group: {group_name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'→ Updating existing group: {group_name}')
                )

            # Set permissions
            if config['permissions'] == 'all':
                # Grant all permissions
                all_permissions = Permission.objects.all()
                group.permissions.set(all_permissions)
                self.stdout.write(
                    f'  Granted all permissions ({all_permissions.count()} permissions)'
                )
            else:
                # Grant specific permissions
                permissions = []
                for perm_codename in config['permissions']:
                    # Try to find permission in imagery app
                    try:
                        perm = Permission.objects.get(
                            codename=perm_codename,
                            content_type__app_label='imagery'
                        )
                        permissions.append(perm)
                    except Permission.DoesNotExist:
                        # Try without app filter (for auth permissions)
                        try:
                            perm = Permission.objects.get(codename=perm_codename)
                            permissions.append(perm)
                        except Permission.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'  ⚠ Permission not found: {perm_codename}'
                                )
                            )

                group.permissions.set(permissions)
                self.stdout.write(
                    f'  Granted {len(permissions)} permissions'
                )

        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('GROUP SETUP COMPLETE'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Created: {created_count} groups')
        self.stdout.write(f'Updated: {updated_count} groups')
        self.stdout.write('\nGroups are now ready for use.')
        self.stdout.write('You can assign users to groups via Django admin or programmatically.')
