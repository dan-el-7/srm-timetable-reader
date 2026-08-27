# SRM Timetable Companion

Apparently things for you couldn't be annoying enough for you as a first year so they decided they should kill off Academia, shift stuff to the Student Portal, while keeping it just as awful to read but ensuring any tools that existed wouldn't work :)
<small>(A small Chrome Manifest V3 extension for the SRMIST student portal. It reads the visible Academic Calendar/Planner and Timetable pages, caches the calendar locally, resolves day order by the exact selected date, matches course codes to their locations, and exports a printable HTML timetable. So technically, you never need to enter your login info anywhere except SRM's portal)</small>
<p align="center"><img src="/screenshots/finalexport.png" alt="Generated timetable" width="800"></p>
<p align="center"><img src="/screenshots/extension.png" alt="SRM Timetable Companion extension" width="350"></p>
<!-- white spaces to save storage, the comment to waste it -->

## Install

1. Click the shiny green code button and download this as a zip or just go to releases. 
2. Unzip this folder, or use it directly as an unpacked extension directory.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select this folder.
6. Open the SRMIST portal and reload the page once after installation or after every extension update. This refreshes the portal-side reader too.

(If you're using some other browser just search up an equivalent for it, and if you're on mobile, Kiwi was killed off and the remaining options based on Chromium don't inspire confidence, just use your laptop tbh.)

## Use

1. Open **Academic Calendar/Planner**, choose the correct template/year, open the calendar table, and click **Read this portal page** in the extension popup.
2. Open **Timetable** and click **Read this portal page** again.
3. Choose the schedule date. The automatic mode treats Sunday–Friday as the current academic week and a Saturday/weekend anchor as the next academic week.
4. The preview and export include the complete Sunday–Friday working week in normal calendar-day order. Academic Day 1/Day 5 labels are shown beside each day but do not reorder Monday behind Friday. Use **Force this week**, **Force next week**, or **Manual override** only when you deliberately need an edge-case override.
5. Sometimes the website can be weird asf so use the override that works and matches up to what you've got.
6. Click **Export pretty HTML**. The exported file can be opened in Chrome or printed to PDF.

If the selected date is outside the cached range, the extension stops and tells you to open the next academic calendar and read it. Use **Reset cache on the next read** or **Reset cached calendar now** if the portal has switched templates or returned stale rows. (So yes, this won't break on a newer year unless they decide to change how the website works or have an Academia-esque Eureka moment and decide to kill this website off for something new just as convoluted)

## Notes

- Data stays in Chrome local extension storage; the extension does not send portal content anywhere. (C'mon, you don't even have to login anywhere anyway)
- It does manage if you have multiple venues for the same course code!
- Netanyahuinely. Cross-check the time-table a lil if you're paranoid, this thing worked fine for me over 2 weeks but perhaps you're cursed to fall before 75%. (Should work fine lwk)
- Labs and Language classes tend to differ between people, don't rely on other people's generated time tables just follow your own. ✌️ Holds up fine for your own though (tldr: don't trust someone else's time table over your own, this would apply to the student portal anyway, you can't attend Spanish classes after taking Russian can you now?) 
- Portal markup can change. If the portal’s table headers change, the parser may need a small selector update.

## Designed in N Block, Manufactured in San Francisco
