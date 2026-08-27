(function () {
  "use strict";

  const T = globalThis.SRMTimetable;

  const PORTAL_THEME_STYLE_ID = "srm-timetable-companion-portal-theme";
  const PORTAL_DARK_CSS = `
html.srm-timetable-companion-dark{color-scheme:dark;background:#111315!important}
html.srm-timetable-companion-dark body,html.srm-timetable-companion-dark #layoutSidenav,html.srm-timetable-companion-dark #layoutSidenav_content{background:#111315!important;color:#e6e8eb!important}
html.srm-timetable-companion-dark .topnav,html.srm-timetable-companion-dark .navbar.bg-white,html.srm-timetable-companion-dark .navbar-light{background:#171a20!important;border-bottom:1px solid #2b3038!important;box-shadow:none!important}
html.srm-timetable-companion-dark .navbar-brand,html.srm-timetable-companion-dark .topnav .text-custom{color:#e6e8eb!important}
html.srm-timetable-companion-dark #layoutSidenav_nav,html.srm-timetable-companion-dark .sidenav,html.srm-timetable-companion-dark .sidenav-light{background:#171a20!important;color:#c4ccd6!important;border-color:#2b3038!important}
html.srm-timetable-companion-dark .sidenav .nav-link,html.srm-timetable-companion-dark .sidenav .nav-link span{color:#aeb8c4!important}
html.srm-timetable-companion-dark .sidenav .nav-link:hover,html.srm-timetable-companion-dark .sidenav .nav-link.active{color:#78b9ff!important;background:#202a36!important}
html.srm-timetable-companion-dark .sidenav .nav-link-icon{color:#74869b!important}html.srm-timetable-companion-dark .sidenav .nav-link.active .nav-link-icon{color:#78b9ff!important}
html.srm-timetable-companion-dark .sidenav-footer{background:#14171b!important;border-top:1px solid #2b3038!important;color:#9aa4b2!important}
html.srm-timetable-companion-dark .card,html.srm-timetable-companion-dark .card-body,html.srm-timetable-companion-dark .modal-content{background:#171a20!important;color:#e6e8eb!important;border-color:#2b3038!important;box-shadow:none!important}
html.srm-timetable-companion-dark .card-header.bg-custom,html.srm-timetable-companion-dark .bg-custom{background:#1e5b8e!important;color:#fff!important;border-color:#2d6b9d!important}
html.srm-timetable-companion-dark .table-responsive,html.srm-timetable-companion-dark .table{color:#e6e8eb!important;border-color:#2b3038!important}
html.srm-timetable-companion-dark .table th,html.srm-timetable-companion-dark .table td{color:#dce3eb!important;border-color:#2b3038!important}
html.srm-timetable-companion-dark .table thead th,html.srm-timetable-companion-dark .table-primary th,html.srm-timetable-companion-dark .table-primary>td{background:#24344a!important;color:#f1f5f9!important}
html.srm-timetable-companion-dark .table-striped tbody tr:nth-of-type(odd)>*,html.srm-timetable-companion-dark .table-striped tbody tr:nth-of-type(odd){background:#1c2026!important}
html.srm-timetable-companion-dark .table-striped tbody tr:nth-of-type(even)>*,html.srm-timetable-companion-dark .table-striped tbody tr:nth-of-type(even){background:#171a20!important}
html.srm-timetable-companion-dark #subjectTab table td,html.srm-timetable-companion-dark #slotTab table td{background:#1c2026!important;color:#dce3eb!important}
html.srm-timetable-companion-dark #subjectTab table th,html.srm-timetable-companion-dark #slotTab table th{background:#24344a!important;color:#f1f5f9!important}
html.srm-timetable-companion-dark input:not([type="checkbox"]):not([type="radio"]),html.srm-timetable-companion-dark select,html.srm-timetable-companion-dark textarea{background:#101317!important;color:#e6e8eb!important;border-color:#3a4654!important}
html.srm-timetable-companion-dark input::placeholder,html.srm-timetable-companion-dark textarea::placeholder{color:#7f8b9a!important}
html.srm-timetable-companion-dark .nav-tabs{border-bottom-color:#2b3038!important}html.srm-timetable-companion-dark .nav-tabs .nav-link{color:#9fb0c3!important}html.srm-timetable-companion-dark .nav-tabs .nav-link.active{background:#171a20!important;color:#78b9ff!important;border-color:#2b3038 #2b3038 #171a20!important}
html.srm-timetable-companion-dark .dropdown-menu,html.srm-timetable-companion-dark .dropdown-item{background:#171a20!important;color:#dce3eb!important;border-color:#2b3038!important}html.srm-timetable-companion-dark .dropdown-item:hover{background:#202a36!important}
html.srm-timetable-companion-dark .modal-header,html.srm-timetable-companion-dark .modal-footer{border-color:#2b3038!important}html.srm-timetable-companion-dark .close{color:#e6e8eb!important;text-shadow:none}
html.srm-timetable-companion-dark .footer-light{background:#171a20!important;color:#9aa4b2!important;border-color:#2b3038!important}html.srm-timetable-companion-dark .text-muted{color:#9aa4b2!important}html.srm-timetable-companion-dark a{color:#78b9ff}
html.srm-timetable-companion-dark .btn-transparent-dark{color:#c4ccd6!important;background:transparent!important}html.srm-timetable-companion-dark .btn-custom,html.srm-timetable-companion-dark .btn-primary{background:#1e5b8e!important;color:#fff!important;border-color:#2d6b9d!important}
html.srm-timetable-companion-dark ::-webkit-scrollbar{width:12px;height:12px}html.srm-timetable-companion-dark ::-webkit-scrollbar-track{background:#111315}html.srm-timetable-companion-dark ::-webkit-scrollbar-thumb{background:#384555;border:3px solid #111315;border-radius:10px}
`;

  function applyPortalTheme(theme) {
    const dark = theme !== "light";
    const root = document.documentElement;
    root.classList.toggle("srm-timetable-companion-dark", dark);
    let style = document.getElementById(PORTAL_THEME_STYLE_ID);
    if (dark) {
      if (!style) {
        style = document.createElement("style");
        style.id = PORTAL_THEME_STYLE_ID;
        (document.head || root).appendChild(style);
      }
      style.textContent = PORTAL_DARK_CSS;
    } else if (style) {
      style.remove();
    }
  }

  function loadPortalTheme() {
    chrome.storage.local.get("themePreference", (stored) => applyPortalTheme(stored && stored.themePreference || "dark"));
  }

  loadPortalTheme();
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.themePreference) applyPortalTheme(changes.themePreference.newValue || "dark");
  });

  function matrixForTable(table) {
    return Array.from(table.querySelectorAll("tr")).map((row) => {
      const cells = [];
      Array.from(row.children).filter((cell) => cell.tagName === "TH" || cell.tagName === "TD").forEach((cell) => {
        const value = T.cleanText(cell.textContent || cell.innerText || "");
        const span = Math.max(1, Number(cell.colSpan || cell.getAttribute("colspan") || 1));
        for (let index = 0; index < span; index += 1) cells.push(value);
      });
      return cells;
    }).filter((row) => row.length);
  }

  function isVisibleTable(table) {
    if (!table || table.hidden) return false;
    let element = table;
    while (element && element !== document.documentElement) {
      if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
      const style = globalThis.getComputedStyle ? getComputedStyle(element) : null;
      if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;
      if (element.classList && element.classList.contains("tab-pane") && !element.classList.contains("active") && !element.classList.contains("show")) return false;
      element = element.parentElement;
    }
    return typeof table.getClientRects !== "function" || table.getClientRects().length > 0;
  }

  function containsAll(row, terms) {
    const text = row.map(T.normaliseKey).join(" | ");
    return terms.every((term) => text.includes(term));
  }

  function parseCalendar() {
    const rows = [];
    let sourceTable = null;
    document.querySelectorAll("table").forEach((table) => {
      if (!isVisibleTable(table)) return;
      const matrix = matrixForTable(table);
      const headerIndex = matrix.findIndex((row) => containsAll(row, ["date", "day order"]));
      if (headerIndex < 0) return;
      sourceTable = table;
      const header = matrix[headerIndex].map(T.normaliseKey);
      const indexOf = (names) => header.findIndex((cell) => names.some((name) => cell === name || cell.includes(name)));
      const dateIndex = indexOf(["date"]);
      const dayIndex = indexOf(["day"]);
      const statusIndex = indexOf(["status"]);
      const weekIndex = indexOf(["week"]);
      const orderIndex = indexOf(["day order", "order"]);
      const remarksIndex = indexOf(["remarks", "remark"]);
      matrix.slice(headerIndex + 1).forEach((cells) => {
        const date = T.parseDateText(cells[dateIndex] || "");
        if (!date) return;
        const dayOrder = T.extractDayOrder(cells[orderIndex] || "");
        rows.push({
          date,
          day: T.cleanText(cells[dayIndex] || "") || T.weekdayName(date),
          status: T.cleanText(cells[statusIndex] || ""),
          week: T.extractWeek(cells[weekIndex] || "") || T.cleanText(cells[weekIndex] || ""),
          dayOrder,
          remarks: T.cleanText(cells[remarksIndex] || "")
        });
      });
    });

    const deduped = rows.filter((row, index, all) => all.findIndex((other) => other.date === row.date) === index).sort((a, b) => a.date.localeCompare(b.date));
    return {
      rows: deduped,
      from: deduped[0] ? deduped[0].date : "",
      to: deduped[deduped.length - 1] ? deduped[deduped.length - 1].date : "",
      source: sourceTable ? location.href : ""
    };
  }

  function findRow(matrix, predicate) {
    return matrix.find((row) => predicate(row.map(T.normaliseKey), row));
  }

  function timeTokens(value) {
    return T.cleanText(value).match(/\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\b/gi) || [];
  }

  function normaliseBoundary(value, edge) {
    const text = T.cleanText(value).replace(/\s*-\s*$/, "");
    if (["from", "to"].includes(T.normaliseKey(text))) return "";
    const matches = timeTokens(text);
    if (matches && matches.length > 1) return T.cleanText(edge === "last" ? matches[matches.length - 1] : matches[0]);
    return text;
  }

  function parseTimetable() {
    const timetables = [];
    const supplementalTimetables = [];
    const batchTimetables = [];
    let details = null;

    document.querySelectorAll("table").forEach((table) => {
      const visible = isVisibleTable(table);
      const matrix = matrixForTable(table);
      if (!matrix.length) return;
      const hasTimeRows = Boolean(
        findRow(matrix, (row) => row.some((cell) => cell === "from")) &&
        findRow(matrix, (row) => row.some((cell) => cell === "to")) &&
        findRow(matrix, (row) => row.some((cell) => cell.includes("hour/day"))) &&
        matrix.some((row) => row.some((cell) => /^day\s*\d+$/i.test(T.cleanText(cell || ""))))
      );
      if (hasTimeRows) {
        const parsed = parseTimetableTable(matrix, table);
        if (parsed.rawSlotDays.some((day) => day.slots.some((slot) => isBatchSlot(slot)))) batchTimetables.push(parsed);
        else (visible ? timetables : supplementalTimetables).push(parsed);
      }

      const headerIndex = matrix.findIndex((row) => {
        const text = row.map(T.normaliseKey).join(" | ");
        return text.includes("course code") && text.includes("building") && (text.includes("room name") || text.includes("room"));
      });
      if (headerIndex >= 0 && visible && !details) details = parseDetailsTable(matrix, headerIndex);
    });

    const primaryTimetables = timetables.length ? timetables : supplementalTimetables;
    if (!primaryTimetables.length) return { found: false, days: [], slotTimes: [], courses: [] };
    const timetable = primaryTimetables.slice().sort((a, b) => b.slotTimes.length - a.slotTimes.length)[0];
    const primaryDays = primaryTimetables.flatMap((part) => part.rawDays);
    const daysByOrder = new Map();
    primaryDays.forEach((day) => {
      const current = daysByOrder.get(day.dayOrder);
      if (!current) {
        daysByOrder.set(day.dayOrder, day);
        return;
      }
      const mergedCodes = Array.from({ length: Math.max(current.codes.length, day.codes.length) }, (_, index) => current.codes[index] || day.codes[index] || "");
      daysByOrder.set(day.dayOrder, { ...current, codes: mergedCodes });
    });
    const knownCodes = new Set((details || []).map((course) => course.code).filter(Boolean));
    supplementalTimetables.flatMap((part) => part.rawDays).forEach((day) => {
      const filteredCodes = day.codes.map((code) => knownCodes.has(code) ? code : "");
      const candidate = { ...day, codes: filteredCodes };
      const current = daysByOrder.get(day.dayOrder);
      if (!candidate.codes.some(Boolean)) return;
      if (!current) {
        daysByOrder.set(day.dayOrder, candidate);
        return;
      }
      const mergedCodes = Array.from({ length: Math.max(current.codes.length, candidate.codes.length) }, (_, index) => current.codes[index] || candidate.codes[index] || "");
      daysByOrder.set(day.dayOrder, { ...current, codes: mergedCodes });
    });
    const rawDays = Array.from(daysByOrder.values());
    const courseMap = T.buildCourseMap(details || []);
    const batchDays = mergeSlotRows(...batchTimetables.map((part) => part.rawSlotDays));
    const batchSlotsByOrder = Object.fromEntries(batchDays.map((day) => [day.dayOrder, day.slots]));
    const days = rawDays.map((day) => ({
      dayOrder: day.dayOrder,
      sessions: T.buildSessions(day.dayOrder, day.codes, timetable.slotTimes, courseMap, batchSlotsByOrder[day.dayOrder] || [])
    }));
    return {
      found: true,
      slotTimes: timetable.slotTimes,
      courses: details || [],
      days,
      personalDayOrders: rawDays.map((day) => day.dayOrder),
      batchDayOrders: batchDays.map((day) => day.dayOrder)
    };
  }

  function parseTimetableTable(matrix, table) {
    const fromRow = findRow(matrix, (row) => row.some((cell) => cell === "from"));
    const toRow = findRow(matrix, (row) => row.some((cell) => cell === "to"));
    const fromIndex = fromRow.findIndex((cell) => T.normaliseKey(cell) === "from");
    const toIndex = toRow.findIndex((cell) => T.normaliseKey(cell) === "to");
    const maxSlots = Math.max(fromRow.length - fromIndex - 1, toRow.length - toIndex - 1);
    const matrixSlotTimes = Array.from({ length: maxSlots }, (_, index) => ({
      from: normaliseBoundary(fromRow[fromIndex + 1 + index] || "", "first"),
      to: normaliseBoundary(toRow[toIndex + 1 + index] || "", "last") || normaliseBoundary(fromRow[fromIndex + 1 + index] || "", "last")
    }));
    const slotTimes = domSlotTimes(table, maxSlots) || matrixSlotTimes;
    const matrixDays = matrix.map((row) => {
      const dayIndex = row.findIndex((cell) => /^day\s*\d+$/i.test(T.cleanText(cell || "")));
      if (dayIndex < 0) return null;
      const values = row.slice(dayIndex + 1, dayIndex + maxSlots + 1);
      return {
        dayOrder: T.extractDayOrder(row[dayIndex]),
        codes: values.map((cell) => {
          const code = T.normaliseCourseCode(cell);
          return /^\d{2}[A-Z]{2,6}\d{3,5}[A-Z0-9]{0,4}$/.test(code) ? code : "";
        }),
        slots: values.map((cell) => T.cleanText(cell).toUpperCase())
      };
    }).filter(Boolean);
    const rawDays = mergeDayRows(geometryDayRows(table, maxSlots), matrixDays);
    return { slotTimes, rawDays, rawSlotDays: matrixDays.map((day) => ({ dayOrder: day.dayOrder, slots: day.slots })) };
  }

  function isBatchSlot(value) {
    const text = T.cleanText(value).toUpperCase();
    return Boolean(text && text !== "-" && /^[A-Z]{1,3}\d{0,3}$/.test(text));
  }

  function mergeSlotRows(...collections) {
    const byOrder = new Map();
    collections.flat().forEach((day) => {
      if (!day || !day.dayOrder) return;
      const current = byOrder.get(day.dayOrder);
      if (!current) {
        byOrder.set(day.dayOrder, day);
        return;
      }
      const slots = Array.from({ length: Math.max(current.slots.length, day.slots.length) }, (_, index) => current.slots[index] || day.slots[index] || "");
      byOrder.set(day.dayOrder, { ...current, slots });
    });
    return Array.from(byOrder.values());
  }

  function domSlotTimes(table, maxSlots) {
    if (!table || typeof table.querySelectorAll !== "function") return null;
    const rows = Array.from(table.querySelectorAll("tr"));
    const directCells = (row) => Array.from(row.children).filter((cell) => cell.tagName === "TH" || cell.tagName === "TD");
    const cellText = (cell) => T.cleanText(cell.textContent || cell.innerText || "");
    const fromRow = rows.find((row) => directCells(row).some((cell) => T.normaliseKey(cellText(cell)) === "from"));
    const toRow = rows.find((row) => directCells(row).some((cell) => T.normaliseKey(cellText(cell)) === "to"));
    if (!fromRow || !toRow) return null;
    const valuesAfterLabel = (row, label) => {
      const cells = directCells(row);
      const labelIndex = cells.findIndex((cell) => T.normaliseKey(cellText(cell)) === label);
      if (labelIndex < 0) return [];
      const values = [];
      cells.slice(labelIndex + 1).forEach((cell) => {
        const span = Math.max(1, Number(cell.colSpan || cell.getAttribute("colspan") || 1));
        const value = cellText(cell);
        for (let index = 0; index < span; index += 1) values.push(value);
      });
      return values.slice(0, maxSlots);
    };
    const fromValues = valuesAfterLabel(fromRow, "from");
    const toValues = valuesAfterLabel(toRow, "to");
    if (fromValues.length !== maxSlots || !fromValues.some(Boolean)) return null;
    return Array.from({ length: maxSlots }, (_, index) => ({
      from: normaliseBoundary(fromValues[index], "first"),
      to: normaliseBoundary(toValues[index] || "", "last") || normaliseBoundary(fromValues[index], "last")
    }));
  }

  function mergeDayRows(...collections) {
    const byOrder = new Map();
    collections.flat().forEach((day) => {
      if (!day || !day.dayOrder) return;
      const current = byOrder.get(day.dayOrder);
      if (!current) {
        byOrder.set(day.dayOrder, day);
        return;
      }
      const codes = Array.from({ length: Math.max(current.codes.length, day.codes.length) }, (_, index) => current.codes[index] || day.codes[index] || "");
      byOrder.set(day.dayOrder, { ...current, codes });
    });
    return Array.from(byOrder.values());
  }

  function geometryDayRows(table, maxSlots) {
    if (!table || typeof table.querySelectorAll !== "function") return [];
    const rows = Array.from(table.querySelectorAll("tr"));
    const directCells = (row) => Array.from(row.children).filter((cell) => cell.tagName === "TH" || cell.tagName === "TD");
    const cellText = (cell) => T.cleanText(cell.textContent || cell.innerText || "");
    const fromRow = rows.find((row) => directCells(row).some((cell) => T.normaliseKey(cellText(cell)) === "from"));
    if (!fromRow) return [];
    const fromCells = directCells(fromRow);
    const fromIndex = fromCells.findIndex((cell) => T.normaliseKey(cellText(cell)) === "from");
    if (fromIndex < 0) return [];
    const slotRects = [];
    fromCells.slice(fromIndex + 1).forEach((cell) => {
      const span = Math.max(1, Number(cell.colSpan || cell.getAttribute("colspan") || 1));
      const rect = typeof cell.getBoundingClientRect === "function" ? cell.getBoundingClientRect() : null;
      for (let index = 0; index < span && slotRects.length < maxSlots; index += 1) slotRects.push(rect);
    });
    if (slotRects.length !== maxSlots || slotRects.some((rect) => !rect || rect.right <= rect.left)) return [];
    return rows.map((row) => {
      const cells = directCells(row);
      const dayIndex = cells.findIndex((cell) => /^day\s*\d+$/i.test(cellText(cell)));
      if (dayIndex < 0) return null;
      const codes = Array.from({ length: maxSlots }, () => "");
      cells.slice(dayIndex + 1).forEach((cell) => {
        const code = T.normaliseCourseCode(cellText(cell));
        if (!/^\d{2}[A-Z]{2,6}\d{3,5}[A-Z0-9]{0,4}$/.test(code)) return;
        const rect = typeof cell.getBoundingClientRect === "function" ? cell.getBoundingClientRect() : null;
        if (!rect || rect.right <= rect.left) return;
        slotRects.forEach((slotRect, index) => {
          const center = (slotRect.left + slotRect.right) / 2;
          if (center >= rect.left - 2 && center <= rect.right + 2) codes[index] = code;
        });
      });
      return { dayOrder: T.extractDayOrder(cellText(cells[dayIndex])), codes };
    }).filter((day) => day && day.dayOrder);
  }

  function parseDetailsTable(matrix, headerIndex) {
    const header = matrix[headerIndex].map(T.normaliseKey);
    const findIndex = (names) => header.findIndex((cell) => names.some((name) => cell === name || cell.includes(name)));
    const indexes = {
      code: findIndex(["course code"]),
      name: findIndex(["course name"]),
      slot: findIndex(["slot"]),
      faculty: findIndex(["assigned faculty", "faculty"]),
      location: findIndex(["location"]),
      building: findIndex(["building"]),
      floor: findIndex(["floor"]),
      room: findIndex(["room name", "room"])
    };
    return matrix.slice(headerIndex + 1).map((cells) => ({
      code: T.normaliseCourseCode(cells[indexes.code] || ""),
      name: cells[indexes.name] || "",
      slot: cells[indexes.slot] || "",
      faculty: cells[indexes.faculty] || "",
      location: cells[indexes.location] || "",
      building: cells[indexes.building] || "",
      floor: cells[indexes.floor] || "",
      room: cells[indexes.room] || ""
    })).filter((course) => course.code);
  }

  function pageKind() {
    const body = T.normaliseKey(document.body ? document.body.innerText : "");
    return {
      calendar: body.includes("academic calendar details") || body.includes("day order"),
      timetable: body.includes("timetable details") || body.includes("hour/day order")
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "extractPage") return undefined;
    try {
      const kind = pageKind();
      sendResponse({
        ok: true,
        url: location.href,
        title: document.title,
        kind,
        calendar: parseCalendar(),
        timetable: parseTimetable()
      });
    } catch (error) {
      sendResponse({ ok: false, error: error && error.message ? error.message : String(error) });
    }
    return true;
  });
})();
