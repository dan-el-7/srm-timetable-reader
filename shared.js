(function () {
  "use strict";

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function cleanText(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function normaliseKey(value) {
    return cleanText(value).toLowerCase().replace(/\s+/g, " ");
  }

  function parseDateText(value, referenceYear) {
    const text = cleanText(value);
    let match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      return makeISODate(year, month, day);
    }

    match = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?=\b|T)/i);
    if (match) {
      return makeISODate(Number(match[1]), Number(match[2]), Number(match[3]));
    }

    match = text.match(/\b(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})\b/);
    if (match) {
      const month = monthNumber(match[2]);
      if (month) return makeISODate(Number(match[3]), month, Number(match[1]));
    }

    match = text.match(/\b(\d{1,2})[- ]([A-Za-z]{3,9})\b/);
    if (match && referenceYear) {
      const month = monthNumber(match[2]);
      if (month) return makeISODate(Number(referenceYear), month, Number(match[1]));
    }

    return "";
  }

  function monthNumber(value) {
    const key = cleanText(value).slice(0, 3).toLowerCase();
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const index = months.indexOf(key);
    return index < 0 ? 0 : index + 1;
  }

  function makeISODate(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function localISODate(date) {
    const value = date || new Date();
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  function dateFromISO(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : null;
  }

  function academicWeekRange(isoDate) {
    const date = dateFromISO(isoDate);
    if (!date) return null;
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const days = Array.from({ length: 6 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return localISODate(day);
    });
    return { start: days[0], end: days[days.length - 1], days };
  }

  function weekdayName(isoDate) {
    const date = dateFromISO(isoDate);
    return date ? DAY_NAMES[date.getDay()] : "";
  }

  function formatDate(isoDate, options) {
    const date = dateFromISO(isoDate);
    return date ? date.toLocaleDateString(undefined, options || { day: "2-digit", month: "short", year: "numeric" }) : isoDate || "";
  }

  function parseClock(value) {
    const text = cleanTimeLabel(value).toUpperCase().replace(/\./g, ":");
    const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2] || "0");
    const meridiem = match[3];
    if (minutes > 59) return null;
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (hours > 23) return null;
    return hours * 60 + minutes;
  }

  function cleanTimeLabel(value) {
    const text = cleanText(value).replace(/\s*[-–—]\s*$/, "");
    return /^(from|to)$/i.test(text) ? "" : text;
  }

  function extractDayOrder(value) {
    const match = cleanText(value).match(/\bday\s*[- ]?(\d+)\b/i);
    return match ? `Day ${Number(match[1])}` : "";
  }

  function extractWeek(value) {
    const match = cleanText(value).match(/\b(?:wk|week)\s*[- ]?(\d+)\b/i);
    return match ? `Wk ${Number(match[1])}` : "";
  }

  function normaliseCourseCode(value) {
    const text = cleanText(value).toUpperCase();
    const match = text.match(/\b\d{2}[A-Z]{2,6}\d{3,5}[A-Z0-9]{0,4}\b/);
    return match ? match[0] : text === "-" ? "" : text;
  }

  function splitSlotLabels(value) {
    return cleanText(value).toUpperCase().split(/[\s,;/|]+/).map(cleanText).filter(Boolean);
  }

  function isWorkingDay(row) {
    const status = normaliseKey(row && row.status);
    return Boolean(row && row.date && (!status || status.includes("working")) && !status.includes("holiday"));
  }

  function unique(values) {
    return Array.from(new Set(values.map(cleanText).filter(Boolean)));
  }

  function resolveDayOrder(calendarRows, selectedDate, mode, manualOrder) {
    const rows = (calendarRows || []).filter((row) => row && row.date).slice().sort((a, b) => a.date.localeCompare(b.date));
    const selected = rows.find((row) => row.date === selectedDate);
    const currentDate = localISODate();
    const currentRow = rows.find((row) => row.date === currentDate && isWorkingDay(row)) || rows.filter((row) => row.date < currentDate && isWorkingDay(row)).pop() || rows.find(isWorkingDay);

    if (mode === "manual") {
      return {
        ok: Boolean(manualOrder),
        date: selectedDate,
        anchorDate: selectedDate,
        dayOrder: manualOrder || "",
        weekday: weekdayName(selectedDate),
        week: selected ? selected.week : "",
        weekKey: selected ? selected.week : "",
        source: "Manual override",
        message: manualOrder ? "Manual day-order override is active." : "Choose a manual day order."
      };
    }

    if (mode === "date" || !mode) {
      if (!selected) {
        return {
          ok: false,
          date: selectedDate,
          weekday: weekdayName(selectedDate),
          source: "Automatic date lookup",
          message: `The cached academic calendar has no entry for ${formatDate(selectedDate)}.`
        };
      }
      const selectedWeekday = dateFromISO(selectedDate).getDay();
      if (selectedWeekday === 6 || (!selected.dayOrder && selectedWeekday === 0)) {
        const nextWorking = rows.find((row) => row.date > selectedDate && isWorkingDay(row) && row.dayOrder);
        if (nextWorking) {
          return {
            ok: true,
            date: selectedDate,
            anchorDate: nextWorking.date,
            dayOrder: nextWorking.dayOrder,
            weekday: selected.day || weekdayName(selectedDate),
            week: nextWorking.week,
            weekKey: nextWorking.week,
            source: "Automatic weekend anchor",
            status: selected.status,
            message: `Weekend anchor: using the next academic week beginning with ${nextWorking.day || weekdayName(nextWorking.date)} ${formatDate(nextWorking.date)}.`
          };
        }
      }
      return {
        ok: Boolean(selected.dayOrder),
        date: selectedDate,
        anchorDate: selectedDate,
        dayOrder: selected.dayOrder,
        weekday: selected.day || weekdayName(selectedDate),
        week: selected.week,
        weekKey: selected.week,
        source: "Exact selected date",
        status: selected.status,
        message: selected.dayOrder ? "Date matched directly in the cached calendar." : "This date has no day order (probably a holiday)."
      };
    }

    const currentWeek = currentRow && currentRow.week;
    const workingRows = rows.filter(isWorkingDay);
    let chosenWeek = currentWeek;
    if (mode === "next-week") {
      const weekKeys = unique(workingRows.map((row) => row.week));
      const currentIndex = weekKeys.indexOf(currentWeek);
      chosenWeek = currentIndex >= 0 ? weekKeys[currentIndex + 1] || "" : "";
    }
    if (!chosenWeek) {
      return {
        ok: false,
        date: selectedDate,
        weekday: weekdayName(selectedDate),
        source: mode === "next-week" ? "Next academic week" : "Current academic week",
        message: `Could not identify the ${mode === "next-week" ? "next" : "current"} academic week in the cached calendar.`
      };
    }

    const desiredWeekday = weekdayName(selectedDate);
    const candidate = workingRows.find((row) => row.week === chosenWeek && (row.day || weekdayName(row.date)) === desiredWeekday) || ([0, 6].includes(dateFromISO(selectedDate).getDay()) ? workingRows.find((row) => row.week === chosenWeek) : null);
    return {
      ok: Boolean(candidate && candidate.dayOrder),
      date: selectedDate,
      anchorDate: candidate ? candidate.date : "",
      dayOrder: candidate ? candidate.dayOrder : "",
      weekday: desiredWeekday,
      week: chosenWeek,
      weekKey: chosenWeek,
      source: mode === "next-week" ? "Next academic week" : "Current academic week",
      status: candidate ? candidate.status : "",
      message: candidate && candidate.dayOrder ? (candidate.day === desiredWeekday ? `Matched ${desiredWeekday} in ${chosenWeek}.` : `Weekend anchor: using the next academic week beginning with ${candidate.day || weekdayName(candidate.date)} ${formatDate(candidate.date)}.`) : `No working ${desiredWeekday} exists in ${chosenWeek}.`
    };
  }

  function buildCourseMap(courseRows) {
    const map = {};
    (courseRows || []).forEach((course) => {
      const code = normaliseCourseCode(course.code);
      if (!code) return;
      if (!map[code]) map[code] = [];
      map[code].push({
        code,
        name: cleanText(course.name),
        slot: cleanText(course.slot),
        location: cleanText(course.location),
        building: cleanText(course.building),
        floor: cleanText(course.floor),
        room: cleanText(course.room),
        faculty: cleanText(course.faculty)
      });
    });
    Object.keys(map).forEach((code) => {
      map[code] = map[code].filter((item, index, all) => all.findIndex((other) => JSON.stringify(other) === JSON.stringify(item)) === index);
    });
    return map;
  }

  function courseSummary(courseMap, code, slotLabel) {
    const details = (courseMap && courseMap[code]) || [];
    const matching = slotLabel ? details.filter((item) => splitSlotLabels(item.slot).includes(cleanText(slotLabel).toUpperCase())) : [];
    const selected = matching.length ? matching : details;
    const first = selected[0] || details[0] || {};
    const locations = unique(selected.map((item) => [item.location, item.building, item.floor, item.room].filter(Boolean).join(" · ")));
    return {
      ...first,
      code,
      name: unique(selected.map((item) => item.name)).join(" / ") || "Course location not found",
      location: locations.join(" / ") || "Location not found",
      building: unique(selected.map((item) => item.building)).join(" / ") || "—",
      floor: unique(selected.map((item) => item.floor)).join(" / ") || "—",
      room: unique(selected.map((item) => item.room)).join(" / ") || "—",
      faculty: unique(selected.map((item) => item.faculty)).join(" / ") || "—",
      slot: unique(selected.map((item) => item.slot)).join(" / ") || "—",
      detailCount: selected.length
    };
  }

  function buildSessions(dayOrder, codes, slotTimes, courseMap, slotLabels) {
    const slots = (codes || []).map((rawCode, index) => {
      const code = normaliseCourseCode(rawCode);
      const time = (slotTimes || [])[index] || {};
      return {
        code,
        slotLabel: cleanText((slotLabels || [])[index] || "").toUpperCase(),
        from: cleanTimeLabel(time.from) || `Period ${index + 1}`,
        to: cleanTimeLabel(time.to),
        startMinutes: parseClock(time.from),
        endMinutes: parseClock(time.to),
        index
      };
    });
    const groups = [];
    slots.forEach((slot) => {
      const type = slot.code ? "class" : "break";
      const last = groups[groups.length - 1];
      if (last && last.type === type && (type === "break" || last.code === slot.code)) {
        last.to = slot.to || last.to;
        last.end = slot.to || last.end;
        last.endMinutes = slot.endMinutes;
        if (!last.slotLabel) last.slotLabel = slot.slotLabel;
        last.lastIndex = slot.index;
      } else {
        groups.push({
          type,
          code: slot.code,
          slotLabel: slot.slotLabel,
          from: slot.from,
          to: slot.to,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          firstIndex: slot.index,
          lastIndex: slot.index,
          end: slot.to
        });
      }
    });

    const firstClass = groups.findIndex((group) => group.type === "class");
    const lastClass = groups.map((group) => group.type).lastIndexOf("class");
    return groups
      .filter((group, index) => group.type === "class" || (index > firstClass && index < lastClass))
      .map((group) => {
        if (group.type === "break") {
          return { dayOrder, isBreak: true, from: group.from, to: group.to, label: "Break" };
        }
        return {
          dayOrder,
          isBreak: false,
          from: group.from,
          to: group.to,
          course: courseSummary(courseMap, group.code, group.slotLabel),
          code: group.code
        };
      });
  }

  function htmlEscape(value) {
    return cleanText(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  }

  function buildExportHtml(payload) {
    const title = htmlEscape(payload.title || "SRM Timetable");
    const generatedAt = htmlEscape(payload.generatedAt || new Date().toLocaleString());
    const selectedDate = htmlEscape(formatDate(payload.selectedDate));
    const resolution = payload.resolution || {};
    const days = payload.days || [];
    const theme = payload.theme === "light" ? "light" : "dark";
    const themeLabel = theme === "light" ? "Light theme" : "Dark theme";
    const timeRange = (from, to) => {
      const start = cleanTimeLabel(from);
      const end = cleanTimeLabel(to);
      return `<span class="clock">${htmlEscape(start)}${end ? ` <span class="dash">-</span> ${htmlEscape(end)}` : ""}</span>`;
    };
    const dayMarkup = days.map((day) => {
      const sessions = day.sessions || [];
      const holiday = day.isWorkingDay === false;
      const rows = sessions.length ? sessions.map((session) => {
        if (session.isBreak) {
          return `<div class="session break"><div class="time">${timeRange(session.from, session.to)}</div><div><strong>Break</strong><small>Recharge / transition time</small></div></div>`;
        }
        const course = session.course || {};
        return `<div class="session"><div class="time">${timeRange(session.from, session.to)}</div><div class="course"><strong>${htmlEscape(session.code)}</strong><span>${htmlEscape(course.name || "Course")}</span></div><div class="place"><strong>${htmlEscape(course.building || "Location not found")}</strong><span>${htmlEscape(course.room && course.floor ? `${course.room} · ${course.floor}` : course.room || course.location || "Check portal details")}</span></div></div>`;
      }).join("") : `<div class="empty">${htmlEscape(holiday ? `${day.remarks || day.status || "Holiday"} · no classes` : day.hasPersonalRow === false ? `No personal timetable row for ${day.dayOrder || "this day order"}. Batch slot labels are not personal classes.` : "No scheduled classes were parsed for this day order.")}</div>`;
      const dateLabel = day.date ? `${htmlEscape(day.weekday || weekdayName(day.date))} · ${htmlEscape(formatDate(day.date))}` : htmlEscape(day.weekday || "Academic day");
      const classCount = sessions.filter((item) => !item.isBreak).length;
      const countLabel = holiday ? "Holiday" : `${classCount} class${classCount === 1 ? "" : "es"}`;
      return `<section class="day-card${holiday ? " holiday" : ""}"><div class="day-heading"><div><span class="eyebrow">${htmlEscape(day.dayOrder || (holiday ? "Holiday" : "Day"))}</span><h2>${dateLabel}</h2></div><span class="count">${countLabel}</span></div>${rows}</section>`;
    }).join("");

    const themeStyles = `
:root{color-scheme:dark}body{background:radial-gradient(circle at 8% -8%,#17477e 0,transparent 34%),radial-gradient(circle at 110% 8%,#164d58 0,transparent 30%),linear-gradient(160deg,#080d1b 0%,#0c1528 56%,#0a1020 100%);color:#e9f3ff}.hero{background:linear-gradient(135deg,#123c72 0%,#126795 54%,#138c8b 100%);border:1px solid #72d8ff3d;box-shadow:0 18px 38px #00000045,inset 0 1px #ffffff26}.day-card{background:#101a2c;border-color:#2b4261;box-shadow:0 12px 30px #0000002e,inset 0 1px #ffffff0a}.day-heading{background:#142034;border-bottom-color:#2e4260}.day-heading h2{color:#f1f7ff}.count{color:#98ffe3;background:#124c4a}.day-card.holiday .count{color:#ffb0b7;background:#542a3a}.session{border-bottom-color:#293b54}.time{color:#6ce5ff}.course strong{color:#edf7ff}.course span,.place span{color:#9cafc4}.place strong{color:#77e9cf}.break{background:#2a2115}.break .time,.break strong{color:#ffc06b}.empty{color:#aebdd0}.footnote{color:#8195af}
body[data-theme="light"]{color-scheme:light;background:#f4f7fb;color:#17243a}.hero{border-radius:24px}body[data-theme="light"] .hero{background:linear-gradient(135deg,#0d4f94,#267bb8);border-color:#ffffff45;box-shadow:0 20px 55px #154b7226}body[data-theme="light"] .day-card{background:#fff;border-color:#dfe7f1;box-shadow:0 8px 30px #1b4a7110}body[data-theme="light"] .day-heading{background:#fbfcfe;border-bottom-color:#e5ebf2}body[data-theme="light"] .day-heading h2{color:#17243a}body[data-theme="light"] .count{color:#0a7a50;background:#e3f4ed}body[data-theme="light"] .day-card.holiday .count{color:#b33a44;background:#fde7e8}body[data-theme="light"] .session{border-bottom-color:#edf1f5}body[data-theme="light"] .time{color:#0d5b9d}body[data-theme="light"] .course strong{color:#162b47}body[data-theme="light"] .course span,body[data-theme="light"] .place span{color:#647389}body[data-theme="light"] .place strong{color:#27735e}body[data-theme="light"] .break{background:#fffaf0}body[data-theme="light"] .break .time,body[data-theme="light"] .break strong{color:#b26d0a}body[data-theme="light"] .empty,body[data-theme="light"] .footnote{color:#718096}
body[data-theme="dark"]{background:#101216;color:#e6e8eb}body[data-theme="dark"] .hero{background:#1b2a3d;border:1px solid #33465d;box-shadow:none;border-radius:14px}body[data-theme="dark"] .day-card{background:#171a20;border-color:#2b3038;box-shadow:none}body[data-theme="dark"] .day-heading{background:#1b1f26;border-bottom-color:#2b3038}body[data-theme="dark"] .day-heading h2{color:#f0f2f4}body[data-theme="dark"] .count{color:#a9e3d3;background:#183c37}body[data-theme="dark"] .day-card.holiday .count{color:#f0a4ab;background:#42242a}body[data-theme="dark"] .session{border-bottom-color:#282d35}body[data-theme="dark"] .time{color:#78b9ff}body[data-theme="dark"] .course strong{color:#f0f2f4}body[data-theme="dark"] .course span,body[data-theme="dark"] .place span{color:#a4acb7}body[data-theme="dark"] .place strong{color:#8bd2bf}body[data-theme="dark"] .break{background:#29231a}body[data-theme="dark"] .break .time,body[data-theme="dark"] .break strong{color:#e8b96d}body[data-theme="dark"] .empty,body[data-theme="dark"] .footnote{color:#9aa4b2}
:root{font-family:"Segoe UI Variable Text","Segoe UI Variable","Inter",system-ui,sans-serif}body{padding:32px;font-size:14px}.hero{padding:28px 32px;border-radius:16px;box-shadow:none}.hero h1{font-family:"Segoe UI Variable Display","Segoe UI Variable","Inter",system-ui,sans-serif;font-size:clamp(28px,4.5vw,42px);line-height:1.1;font-weight:700;letter-spacing:-.02em}.hero p{font-size:14px}.meta{gap:8px;margin-top:22px}.pill{padding:6px 10px;font-size:12px}.day-heading{padding:20px 22px 16px}.day-heading h2{font-size:19px;line-height:1.2}.count{padding:5px 9px;font-size:11px}.session{grid-template-columns:104px minmax(0,1fr) minmax(0,1fr);gap:18px;padding:16px 22px}.time{font-size:13px}.course strong{font-size:14px}.course span,.place span{font-size:12px}.place strong{font-size:12px}.empty{padding:22px;font-size:13px}.footnote{font-size:11px;margin:20px 4px}
body[data-theme="dark"]{background:#111315;color:#e6e8eb}body[data-theme="dark"] .hero{background:#1d2a3a;border-color:#334354}body[data-theme="dark"] .pill{background:transparent;border-color:#ffffff2b}body[data-theme="dark"] .day-card{background:#171a20;border-color:#2b3038}body[data-theme="dark"] .day-heading{background:#1b1f26;border-bottom-color:#2b3038}body[data-theme="dark"] .session{border-bottom-color:#282d35}body[data-theme="dark"] .break{background:#29231a}
body[data-theme="light"]{background:#f4f6f8;color:#17243a}body[data-theme="light"] .hero{background:#1e5b8e;border-color:#2d6b9d}body[data-theme="light"] .day-card{box-shadow:0 2px 10px #1d385c0d}body[data-theme="light"] .session{border-bottom-color:#edf1f5}
@media(max-width:650px){body{padding:16px}.hero{padding:24px}.session{grid-template-columns:96px 1fr;gap:14px;padding:15px 18px}.place{grid-column:2}}
`;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#17243a;background:#f4f7fb;line-height:1.45}*{box-sizing:border-box}body{margin:0;padding:36px;color:#17243a}.sheet{max-width:1000px;margin:0 auto}.hero{background:linear-gradient(135deg,#0d4f94,#267bb8);color:#fff;border-radius:24px;padding:32px 36px;box-shadow:0 20px 55px #154b7226}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:800;opacity:.72}.hero h1{font-size:clamp(28px,5vw,48px);line-height:1.06;margin:10px 0 12px}.hero p{margin:0;color:#dcefff}.meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.pill{border:1px solid #ffffff45;background:#ffffff18;border-radius:99px;padding:7px 12px;font-size:13px}.days{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:18px;margin-top:22px}.day-card{background:#fff;border:1px solid #dfe7f1;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px #1b4a7110}.day-heading{display:flex;justify-content:space-between;align-items:flex-start;padding:22px 24px 18px;background:#fbfcfe;border-bottom:1px solid #e5ebf2}.day-heading h2{margin:5px 0 0;font-size:20px}.count{background:#e3f4ed;color:#0a7a50;border-radius:99px;padding:6px 10px;font-size:12px;font-weight:750}.session{display:grid;grid-template-columns:92px 1fr 1fr;gap:16px;padding:17px 24px;border-bottom:1px solid #edf1f5;align-items:center}.session:last-child{border-bottom:0}.time{font-variant-numeric:tabular-nums;font-weight:750;color:#0d5b9d;display:flex;flex-direction:column;line-height:1.15}.time .clock{display:block}.time .connector{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#91a0b2;font-weight:700;margin:3px 0}.course,.place{display:flex;flex-direction:column;min-width:0}.course strong{color:#162b47}.course span,.place span{font-size:13px;color:#647389;margin-top:3px}.place strong{color:#27735e;font-size:13px;overflow-wrap:anywhere}.break{background:#fffaf0}.break .time{color:#b26d0a}.break strong{color:#9a6007}.empty{padding:24px;color:#718096;font-size:14px}.footnote{color:#718096;font-size:12px;margin:22px 4px;text-align:center}@media(max-width:650px){body{padding:16px}.hero{padding:24px}.days{grid-template-columns:1fr}.session{grid-template-columns:82px 1fr}.place{grid-column:2}.hero h1{font-size:32px}}
@media print{body{background:#fff;padding:0}.hero{box-shadow:none;border-radius:0}.day-card{break-inside:avoid;box-shadow:none}.days{display:block}.day-card{margin:16px 0}.footnote{display:none}}.time .connector{display:none}.time .clock{white-space:nowrap}.session{grid-template-columns:110px minmax(0,1fr) minmax(0,1fr);gap:20px;padding:18px 30px}.time{min-width:0}.day-card.holiday .count{background:#fde7e8;color:#b33a44}@media(max-width:650px){.session{grid-template-columns:100px 1fr;gap:14px;padding:16px 18px}}
${themeStyles}</style></head><body data-theme="${theme}"><main class="sheet"><header class="hero"><span class="eyebrow">SRMIST · timetable companion</span><h1>${title}</h1><p>Readable schedule with date-aware day orders and course locations.</p><div class="meta"><span class="pill">Target date: ${selectedDate}</span><span class="pill">${htmlEscape(resolution.dayOrder || "Day order not set")}</span><span class="pill">${htmlEscape(resolution.week || "Academic calendar")}</span><span class="pill">${htmlEscape(themeLabel)}</span><span class="pill">Generated ${generatedAt}</span></div></header><div class="days">${dayMarkup || `<section class="day-card"><div class="empty">No timetable days were available. Re-open the portal timetable and read it again.</div></section>`}</div><p class="footnote">Calendar source is the SRMIST Academic Calendar/Planner. Verify last-minute room changes on the portal.</p></main></body></html>`;
  }

  globalThis.SRMTimetable = {
    DAY_NAMES,
    cleanText,
    normaliseKey,
    parseDateText,
    localISODate,
    dateFromISO,
    academicWeekRange,
    weekdayName,
    formatDate,
    parseClock,
    cleanTimeLabel,
    extractDayOrder,
    extractWeek,
    normaliseCourseCode,
    isWorkingDay,
    unique,
    resolveDayOrder,
    buildCourseMap,
    splitSlotLabels,
    courseSummary,
    buildSessions,
    buildExportHtml
  };
})();
