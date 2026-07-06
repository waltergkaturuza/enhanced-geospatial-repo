import signal
import time
from datetime import datetime, timezone

from django.core.management.base import BaseCommand

from imagery.local_imagery import POLL_INTERVAL, scan_and_ingest, write_watcher_status


class Command(BaseCommand):
    help = 'Poll data/ every 30s and auto-ingest new .tar.gz archives (like server/watcher.py)'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._shutdown = False
        self._processed_count = 0
        self._last_error = None

    def handle(self, *args, **options):
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

        started_at = datetime.now(timezone.utc).isoformat()
        self.stdout.write(self.style.SUCCESS(
            f'Local imagery watcher started (poll every {POLL_INTERVAL}s). Press Ctrl+C to stop.'
        ))

        while not self._shutdown:
            last_scan = datetime.now(timezone.utc).isoformat()
            try:
                ingested = scan_and_ingest()
                self._processed_count += ingested
                self._last_error = None
                if ingested:
                    self.stdout.write(f'Ingested {ingested} new archive(s).')
            except Exception as e:
                self._last_error = str(e)
                self.stderr.write(self.style.ERROR(f'Scan failed: {e}'))

            write_watcher_status(
                running=True,
                last_scan=last_scan,
                processed_count=self._processed_count,
                last_error=self._last_error,
                started_at=started_at,
            )

            for _ in range(POLL_INTERVAL):
                if self._shutdown:
                    break
                time.sleep(1)

        write_watcher_status(running=False, last_scan=last_scan, processed_count=self._processed_count)
        self.stdout.write('Watcher stopped.')

    def _handle_signal(self, signum, frame):
        self._shutdown = True
