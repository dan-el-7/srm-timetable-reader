(function () {
  "use strict";

  const T = globalThis.SRMTimetable;

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
