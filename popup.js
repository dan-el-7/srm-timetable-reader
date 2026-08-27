(function () {
  "use strict";

  const T = globalThis.SRMTimetable;
  const $ = (selector) => document.querySelector(selector);
  let lastPayload = null;

  function storageGet(key) {
    return new Promise((resolve) => chrome.storage.local.get(key, resolve));
  }

  function storageSet(value) {
    return new Promise((resolve) => chrome.storage.local.set(value, resolve));
  }

  function storageRemove(key) {
    return new Promise((resolve) => chrome.storage.local.remove(key, resolve));
  }

  function activeTab() {
    return new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0])));
  }

  function extractFromTab(tabId) {
    return new Promise((resolve, reject) => chrome.tabs.sendMessage(tabId, { type: "extractPage" }, (response) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(response);
    }));
  }

  function localDateValue() {
    return T.localISODate();
  }

  function extensionVersion() {
    return chrome.runtime.getManifest().version;
  }

  function normaliseTheme(value) {
    return value === "light" ? "light" : "dark";
  }

  function currentTheme() {
    return normaliseTheme(document.documentElement.dataset.theme || $("#themeMode").value);
  }

  function applyTheme(value) {
    const theme = normaliseTheme(value);
    document.documentElement.dataset.theme = theme;
    if ($("#themeMode")) $("#themeMode").value = theme;
    return theme;
  }

  function setStatus(text, type) {
    const node = $("#status");
    node.textContent = text || "";
    node.className = `status${type ? ` ${type}` : ""}`;
  }

  function renderCache(cache) {
    const badge = $("#cacheBadge");
    const summary = $("#cacheSummary");
    if (!cache || !cache.rows || !cache.rows.length) {
      badge.textContent = "Not cached";
      badge.className = "badge muted";
      summary.textContent = "Open Academic Calendar/Planner on the SRMIST portal and read it once. It will stay in this browser.";
      return;
    }
    badge.textContent = `${cache.rows.length} dates`;
    badge.className = "badge";
    summary.textContent = `Cached ${T.formatDate(cache.from)} → ${T.formatDate(cache.to)} · saved ${new Date(cache.savedAt).toLocaleDateString()}.`;
  }

  function setModeVisibility() {
    $("#manualOrderWrap").classList.toggle("hidden", $("#dayOrderMode").value !== "manual");
  }

  function mergeCalendar(existing, scanned) {
    if (!scanned || !scanned.rows || !scanned.rows.length) return existing || null;
    return {
      rows: normaliseCalendarRows(scanned.rows),
      from: scanned.from,
      to: scanned.to,
      savedAt: Date.now(),
      source: scanned.source || "SRMIST Academic Calendar/Planner"
    };
  }

  function normaliseCalendarRows(rows) {
    return (rows || []).map((row) => ({
      ...row,
      date: T.parseDateText(row.date) || row.date,
      dayOrder: T.extractDayOrder(row.dayOrder) || row.dayOrder || "",
      week: T.extractWeek(row.week) || row.week || ""
    })).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)).sort((a, b) => a.date.localeCompare(b.date));
  }

  function normaliseCalendarCache(cache) {
    if (!cache || !Array.isArray(cache.rows)) return cache;
    const rows = normaliseCalendarRows(cache.rows);
    return {
      ...cache,
      rows,
      from: rows[0] ? rows[0].date : cache.from || "",
      to: rows[rows.length - 1] ? rows[rows.length - 1].date : cache.to || ""
    };
  }

  function buildDays(timetable, calendarRows, resolution, selectedDate) {
    const byOrder = {};
    (timetable.days || []).forEach((day) => { byOrder[day.dayOrder] = day.sessions || []; });
    const personalOrders = new Set(timetable.personalDayOrders || (timetable.days || []).map((day) => day.dayOrder));
    const anchorDate = resolution.anchorDate || selectedDate;
    const range = T.academicWeekRange(anchorDate);
    const weekRows = range ? calendarRows.filter((row) => row.date >= range.start && row.date <= range.end).sort((a, b) => a.date.localeCompare(b.date)) : [];
    if (weekRows.length) {
      return weekRows.map((row) => {
        const working = T.isWorkingDay(row);
        return {
          dayOrder: working ? row.dayOrder : "",
          date: row.date,
          weekday: row.day || T.weekdayName(row.date),
          status: row.status || "",
          remarks: row.remarks || "",
          isWorkingDay: working,
          hasPersonalRow: working ? personalOrders.has(row.dayOrder) : false,
          sessions: working ? (byOrder[row.dayOrder] || []) : []
        };
      });
    }
    return (timetable.days || []).slice().sort((a, b) => a.dayOrder.localeCompare(b.dayOrder, undefined, { numeric: true })).map((day) => ({
      dayOrder: day.dayOrder,
      date: day.dayOrder === resolution.dayOrder ? selectedDate : "",
      weekday: day.dayOrder === resolution.dayOrder ? T.weekdayName(selectedDate) : "",
      status: "Working day",
      remarks: "",
      isWorkingDay: true,
      hasPersonalRow: true,
      sessions: day.sessions || []
    }));
  }

  function renderPreview(days, selectedDate) {
    const preview = $("#schedulePreview");
    if (!days || !days.length) {
      preview.innerHTML = '<p class="muted-text">No timetable rows were found yet. Read the Timetable page to load the full week.</p>';
      return;
    }
    preview.innerHTML = days.map((day) => {
      const sessions = day.sessions || [];
      const holiday = day.isWorkingDay === false;
      const sessionMarkup = sessions.length ? sessions.map((session) => {
        const timeRange = `${T.cleanTimeLabel(session.from)} - ${T.cleanTimeLabel(session.to)}`.replace(/\s-\s$/, "");
        if (session.isBreak) return `<div class="preview-row break"><div class="preview-time">${timeRange}</div><div class="preview-main"><strong>Break</strong><span>Transition time</span></div></div>`;
        const course = session.course || {};
        const place = [course.building, course.room, course.floor].filter((value) => value && value !== "—").join(" · ") || course.location || "Location not found";
        return `<div class="preview-row"><div class="preview-time">${timeRange}</div><div class="preview-main"><strong>${session.code}</strong><span>${course.name || "Course"}</span><span>${place}</span></div></div>`;
      }).join("") : `<p class="muted-text empty-day">${holiday ? `${day.remarks || day.status || "Holiday"} — no classes.` : day.hasPersonalRow === false ? `No personal timetable row for ${day.dayOrder || "this day order"}. Batch slot labels are not personal classes.` : "No classes for this day order."}</p>`;
      const title = day.weekday || (day.date ? T.weekdayName(day.date) : "Academic day");
      const badge = holiday ? "Holiday" : (day.dayOrder || "Day order unavailable");
      return `<div class="week-day${day.date === selectedDate ? " selected" : ""}${holiday ? " holiday" : ""}"><div class="week-day-heading"><div><strong>${title}</strong><span>${day.date ? T.formatDate(day.date) : ""}</span></div><b>${badge}</b></div>${sessionMarkup}</div>`;
    }).join("");
  }

  function showResult(payload) {
    payload.theme = normaliseTheme(payload.theme || currentTheme());
    lastPayload = payload;
    const resolution = payload.resolution;
    const days = payload.days || [];
    const weekStart = days.find((day) => day.date);
    const highlightDate = resolution.anchorDate || payload.selectedDate;
    $("#resolutionCard").classList.remove("hidden");
    $("#resolutionTitle").textContent = weekStart ? `${resolution.week || "Academic"} · full week` : `${resolution.weekday || T.weekdayName(payload.selectedDate)} · ${T.formatDate(payload.selectedDate)}`;
    $("#resolutionBadge").textContent = `${resolution.week || "No week"}${resolution.dayOrder ? ` · ${resolution.dayOrder}` : ""}`;
    $("#resolutionText").textContent = `${resolution.source}. ${resolution.message}${days.length ? ` Full calendar week loaded: ${days.length} day${days.length === 1 ? "" : "s"}.` : ""}`;
    renderPreview(days, highlightDate);
    $("#exportButton").disabled = !resolution.ok || !payload.timetable || !payload.timetable.found;
  }

  async function readPortal() {
    setStatus("Reading the visible SRMIST page…");
    $("#exportButton").disabled = true;
    const tab = await activeTab();
    if (!tab || !tab.url || !tab.url.startsWith("https://sp.srmist.edu.in/")) {
      setStatus("Open the SRMIST student portal first.", "error");
      return;
    }
    try {
      let stored = normaliseCalendarCache((await storageGet("calendarCache")).calendarCache || null);
      if ($("#resetBeforeRead").checked) {
        await storageRemove("calendarCache");
        stored = null;
        $("#resetBeforeRead").checked = false;
      }
      const scan = await extractFromTab(tab.id);
      if (!scan || !scan.ok) throw new Error(scan && scan.error ? scan.error : "The portal did not return readable page content.");
      stored = mergeCalendar(stored, scan.calendar);
      stored = normaliseCalendarCache(stored);
      if (scan.calendar && scan.calendar.rows && scan.calendar.rows.length) {
        await storageSet({ calendarCache: stored });
        renderCache(stored);
      }
      if (!stored || !stored.rows || !stored.rows.length) {
        setStatus("No cached calendar found. Open Academic Calendar/Planner and press Read there.", "error");
        return;
      }
      const selectedDate = $("#targetDate").value || localDateValue();
      const mode = $("#dayOrderMode").value;
      const resolution = T.resolveDayOrder(stored.rows, selectedDate, mode, $("#manualOrder").value);
      if (!resolution.ok) {
        showResult({ selectedDate, resolution, timetable: { days: [] }, calendarRows: stored.rows, title: "SRM Timetable" });
        const outside = !stored.rows.some((row) => row.date === selectedDate);
        setStatus(outside ? `Calendar cache ends at ${T.formatDate(stored.to)}. Open the next academic calendar and read it to refresh. The current cache was kept.` : resolution.message, "error");
        return;
      }
      if (!scan.timetable || !scan.timetable.found) {
        setStatus("Calendar read successfully. Now open Timetable and press Read this portal page again.", "success");
        showResult({ selectedDate, resolution, timetable: { days: [] }, calendarRows: stored.rows, title: "SRM Timetable" });
        return;
      }
      const days = buildDays(scan.timetable, stored.rows, resolution, selectedDate);
      const payload = {
        title: "SRM weekly timetable",
        generatedAt: new Date().toLocaleString(),
        selectedDate,
        resolution,
        calendarRows: stored.rows,
        timetable: scan.timetable,
        days
      };
      showResult(payload);
      const personalOrders = (scan.timetable.personalDayOrders || scan.timetable.days.map((day) => day.dayOrder)).join(", ");
      const batchOrders = (scan.timetable.batchDayOrders || []).join(", ");
      setStatus(`Read ${scan.timetable.days.length} personal day rows (${personalOrders || "none"}), ${scan.timetable.courses.length} course-location rows${batchOrders ? `, and batch slot rows (${batchOrders}) for location matching` : ""} · parser v${extensionVersion()}.`, "success");
    } catch (error) {
      setStatus(`${error.message || error}. If you just installed the extension, reload the portal tab once.`, "error");
    }
  }

  function exportHtml() {
    if (!lastPayload || !lastPayload.resolution || !lastPayload.resolution.ok) return;
    lastPayload.theme = currentTheme();
    const html = T.buildExportHtml(lastPayload);
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `srm-timetable-${lastPayload.selectedDate}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("HTML timetable exported.", "success");
  }

  async function resetCache() {
    await storageRemove("calendarCache");
    renderCache(null);
    setStatus("Calendar cache reset. Read Academic Calendar/Planner to build it again.", "success");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("#targetDate").value = localDateValue();
    $("#dayOrderMode").addEventListener("change", setModeVisibility);
    $("#themeMode").addEventListener("change", async () => {
      const theme = applyTheme($("#themeMode").value);
      await storageSet({ themePreference: theme });
    });
    $("#readPortal").addEventListener("click", readPortal);
    $("#exportButton").addEventListener("click", exportHtml);
    $("#resetCache").addEventListener("click", resetCache);
    const stored = await storageGet(["calendarCache", "themePreference"]);
    applyTheme(stored.themePreference || "dark");
    renderCache(stored.calendarCache || null);
    setModeVisibility();
  });
})();
