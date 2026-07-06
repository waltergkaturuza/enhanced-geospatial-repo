from django.core.management.base import BaseCommand

from imagery.local_imagery import scan_and_ingest


class Command(BaseCommand):
    help = 'Scan data/ for .tar.gz archives and ingest into the local imagery catalog'

    def handle(self, *args, **options):
        count = scan_and_ingest()
        self.stdout.write(self.style.SUCCESS(f'Ingested {count} new archive(s).'))
