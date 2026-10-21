const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });
}

const farmStandStatusElements = document.querySelectorAll("[data-farm-stand-status]");

if (farmStandStatusElements.length > 0) {
  const calendarTimeZone = "America/Phoenix";
  const finalFallStand = "2026-12-12";
  const thanksgivingClosure = "2026-11-28";
  const springOpening = "2027-04-10";
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  function getPhoenixDateAndTime(date) {
    const parts = new Map(
      new Intl.DateTimeFormat("en-US", {
        timeZone: calendarTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(date).map((part) => [part.type, part.value])
    );
    const year = Number(parts.get("year"));
    const month = Number(parts.get("month"));
    const day = Number(parts.get("day"));

    return {
      dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      minutes: Number(parts.get("hour")) * 60 + Number(parts.get("minute"))
    };
  }

  function formatFarmStandDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
  }

  function getEventStatus(dateKey, todayKey, minutes, eventName = "Farm stand") {
    const date = formatFarmStandDate(dateKey);
    const eventLabel = eventName === "Farm stand" ? date : `${eventName} · ${date}`;

    if (minutes >= 8 * 60 && minutes < 12 * 60 && todayKey === dateKey) {
      return `Open now · ${eventLabel} · 8:00 AM–12:00 PM.`;
    }
    if (todayKey === dateKey) {
      return `Today: ${eventLabel} · 8:00 AM–12:00 PM.`;
    }
    return `Next farm stand: ${eventLabel} · 8:00 AM–12:00 PM.`;
  }

  function getNextFarmStandStatus(now) {
    const { dateKey, minutes } = getPhoenixDateAndTime(now);

    if (dateKey === thanksgivingClosure) {
      return `Closed for Thanksgiving weekend. Next farm stand: Saturday, December 5, 2026 · 8:00 AM–12:00 PM.`;
    }

    if (dateKey >= springOpening) {
      const today = new Date(Date.UTC(
        Number(dateKey.slice(0, 4)),
        Number(dateKey.slice(5, 7)) - 1,
        Number(dateKey.slice(8, 10))
      ));
      const todayIsSaturday = today.getUTCDay() === 6;
      const todayHasPassed = minutes >= 12 * 60;
      const eventDate = new Date(today);

      if (!todayIsSaturday || todayHasPassed) {
        eventDate.setUTCDate(eventDate.getUTCDate() + ((6 - eventDate.getUTCDay() + 7) % 7 || 7));
      }

      const eventDateKey = eventDate.toISOString().slice(0, 10);
      const eventName = eventDateKey === springOpening ? "Spring Opening Day!" : "Farm stand";
      return getEventStatus(eventDateKey, dateKey, minutes, eventName);
    }

    if (dateKey > finalFallStand || (dateKey === finalFallStand && minutes >= 12 * 60)) {
      return `Closed for winter · Reopening in April. Next farm stand: Saturday, April 10, 2027 · 8:00 AM–12:00 PM.`;
    }

    const today = new Date(Date.UTC(
      Number(dateKey.slice(0, 4)),
      Number(dateKey.slice(5, 7)) - 1,
      Number(dateKey.slice(8, 10))
    ));
    const lastFallStandDate = new Date(Date.UTC(2026, 11, 12));

    for (const eventDate = new Date(today); eventDate <= lastFallStandDate; eventDate.setUTCDate(eventDate.getUTCDate() + 1)) {
      const eventDateKey = eventDate.toISOString().slice(0, 10);
      const isSaturday = eventDate.getUTCDay() === 6;
      const hasPassedToday = eventDateKey === dateKey && minutes >= 12 * 60;

      if (isSaturday && eventDateKey !== thanksgivingClosure && !hasPassedToday) {
        const eventName = eventDateKey === finalFallStand ? "Christmas Farm Stand - Last Day of the Season" : "Farm stand";
        return getEventStatus(eventDateKey, dateKey, minutes, eventName);
      }
    }

    return `Closed for winter · Reopening in April. Next farm stand: Saturday, April 10, 2027 · 8:00 AM–12:00 PM.`;
  }

  const status = getNextFarmStandStatus(new Date());
  farmStandStatusElements.forEach((element) => {
    element.textContent = status;
  });
}
