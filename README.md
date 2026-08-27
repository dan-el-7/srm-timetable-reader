# SRM Timetable Companion

A small Chrome Manifest V3 extension for the SRMIST student portal. It reads the visible Academic Calendar/Planner and Timetable pages, caches the calendar locally, resolves day order by the exact selected date, matches course codes to their locations, and exports a printable HTML timetable.

## Install

1. Unzip this folder, or use it directly as an unpacked extension directory.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select this folder.
5. Open the SRMIST portal and reload the page once after installation or after every extension update. This refreshes the portal-side reader too.

## Use

1. Open **Academic Calendar/Planner**, choose the correct template/year, open the calendar table, and click **Read this portal page** in the extension popup.
2. Open **Timetable** and click **Read this portal page** again.
3. Choose the schedule date. The automatic mode treats Sunday–Friday as the current academic week and a Saturday/weekend anchor as the next academic week.
4. The preview and export include the complete Sunday–Friday working week in normal calendar-day order. Academic Day 1/Day 5 labels are shown beside each day but do not reorder Monday behind Friday. Use **Force this week**, **Force next week**, or **Manual override** only when you deliberately need an edge-case override.
5. Click **Export pretty HTML**. The exported file can be opened in Chrome or printed to PDF.

If the selected date is outside the cached range, the extension stops and tells you to open the next academic calendar and read it. Use **Reset cache on the next read** or **Reset cached calendar now** if the portal has switched templates or returned stale rows.

## Notes

- Data stays in Chrome local extension storage; the extension does not send portal content anywhere.
- If the same course code appears in multiple portal detail rows, the export keeps the distinct locations together instead of silently picking one.
- Portal markup can change. If the portal’s table headers change, the parser may need a small selector update.
