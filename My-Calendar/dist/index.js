(() => {
  // src/index.js
  var authToken = null;
  var currentDisplayDate = /* @__PURE__ */ new Date();
  var allMonthEvents = [];
  var loginView;
  var calendarContainer;
  var calendarView;
  var detailView;
  var calendarGrid;
  var yearTitle;
  var monthTitle;
  var detailDateTitle;
  var detailEventsList;
  var loadingSpinner;
  var loginButton;
  document.addEventListener("DOMContentLoaded", () => {
    loginView = document.getElementById("login-view");
    calendarContainer = document.getElementById("calendar-container");
    calendarView = document.getElementById("calendar-view");
    detailView = document.getElementById("detail-view");
    calendarGrid = document.getElementById("calendar-grid");
    yearTitle = document.getElementById("year-title");
    monthTitle = document.getElementById("month-title");
    detailDateTitle = document.getElementById("detail-date-title");
    detailEventsList = document.getElementById("detail-events-list");
    loadingSpinner = document.getElementById("loading-spinner");
    loginButton = document.getElementById("login-button");
    const logoutButton = document.getElementById("logout-button");
    const logoutButtonDetail = document.getElementById("logout-button-detail");
    const prevYearButton = document.getElementById("prev-year-button");
    const nextYearButton = document.getElementById("next-year-button");
    const prevMonthButton = document.getElementById("prev-month-button");
    const nextMonthButton = document.getElementById("next-month-button");
    const backButton = document.getElementById("back-button");
    if (loginButton) {
      loginButton.addEventListener("click", handleLogin);
    } else {
      console.error("Error: login-button not found");
    }
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    } else {
      console.error("Error: logout-button not found");
    }
    if (logoutButtonDetail) {
      logoutButtonDetail.addEventListener("click", handleLogout);
    } else {
      console.error("Error: logout-button-detail not found");
    }
    if (prevYearButton) {
      prevYearButton.addEventListener("click", () => changeYear(-1));
    } else {
      console.error("Error: prev-year-button not found");
    }
    if (nextYearButton) {
      nextYearButton.addEventListener("click", () => changeYear(1));
    } else {
      console.error("Error: next-year-button not found");
    }
    if (prevMonthButton) {
      prevMonthButton.addEventListener("click", () => changeMonth(-1));
    } else {
      console.error("Error: prev-month-button not found");
    }
    if (nextMonthButton) {
      nextMonthButton.addEventListener("click", () => changeMonth(1));
    } else {
      console.error("Error: next-month-button not found");
    }
    if (backButton) {
      backButton.addEventListener("click", showCalendarView);
    } else {
      console.error("Error: back-button not found");
    }
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.log("Not logged in. Showing login view.");
        showView("login");
      } else {
        console.log("Already logged in. Showing calendar view.");
        authToken = token;
        showView("calendar");
        updateCalendar();
      }
    });
  });
  function showView(viewName) {
    if (viewName === "login") {
      if (loginView)
        loginView.style.display = "flex";
      if (calendarContainer)
        calendarContainer.style.display = "none";
    } else {
      if (loginView)
        loginView.style.display = "none";
      if (calendarContainer)
        calendarContainer.style.display = "block";
      if (detailView)
        detailView.style.display = "none";
      if (calendarView)
        calendarView.style.display = "flex";
    }
  }
  function handleLogin() {
    if (loginButton) {
      loginButton.textContent = "Signing in...";
      loginButton.disabled = true;
    }
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        console.error(chrome.runtime.lastError);
        if (loginButton) {
          loginButton.textContent = "Sign in with Google";
          loginButton.disabled = false;
        }
        return;
      }
      console.log("Interactive login successful.");
      authToken = token;
      showView("calendar");
      updateCalendar();
      if (loginButton) {
        loginButton.textContent = "Sign in with Google";
        loginButton.disabled = false;
      }
    });
  }
  function handleLogout() {
    if (authToken) {
      console.log("Logging out. Removing cached token...");
      if (loadingSpinner)
        loadingSpinner.classList.add("show");
      showCalendarView();
      const currentToken = authToken;
      authToken = null;
      allMonthEvents = [];
      if (calendarGrid)
        calendarGrid.innerHTML = "";
      if (yearTitle)
        yearTitle.textContent = "Logging out...";
      if (monthTitle)
        monthTitle.textContent = "";
      chrome.identity.removeCachedAuthToken({ token: currentToken }, () => {
        if (chrome.runtime.lastError) {
          console.error("Could not remove cached token:", chrome.runtime.lastError);
        } else {
          console.log("Cached token removed successfully.");
        }
        if (loadingSpinner)
          loadingSpinner.classList.remove("show");
        showView("login");
        if (yearTitle)
          yearTitle.textContent = "Loading...";
        if (monthTitle)
          monthTitle.textContent = "Loading...";
      });
    } else {
      console.log("No auth token found, just showing login view.");
      showView("login");
    }
  }
  function updateCalendar() {
    if (!authToken || !yearTitle || !monthTitle || !calendarGrid || !loadingSpinner) {
      console.error("Cannot update calendar, auth token or core elements missing.");
      return;
    }
    yearTitle.textContent = currentDisplayDate.getFullYear();
    monthTitle.textContent = currentDisplayDate.toLocaleDateString("en-US", {
      month: "long"
    });
    calendarGrid.innerHTML = "";
    loadingSpinner.classList.add("show");
    const firstDayOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, 0);
    const timeMin = new Date(firstDayOfMonth);
    timeMin.setDate(timeMin.getDate() - firstDayOfMonth.getDay());
    const timeMax = new Date(lastDayOfMonth);
    timeMax.setDate(timeMax.getDate() + (6 - lastDayOfMonth.getDay()));
    timeMax.setHours(23, 59, 59, 999);
    fetchCalendarEvents(timeMin.toISOString(), timeMax.toISOString());
  }
  async function fetchCalendarEvents(timeMin, timeMax) {
    if (!authToken) {
      console.error("No auth token, cannot fetch events.");
      return;
    }
    const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        }
      });
      if (response.status === 401) {
        console.error("Authorization failed (401). Token likely expired. Logging out.");
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      const data = await response.json();
      allMonthEvents = data.items || [];
      if (loadingSpinner)
        loadingSpinner.classList.remove("show");
      renderCalendarGrid();
    } catch (error) {
      console.error("Error fetching events:", error);
      if (loadingSpinner)
        loadingSpinner.classList.remove("show");
      if (calendarGrid) {
        calendarGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / 8; padding: 20px; color: red;">Error loading events.</p>';
      }
    }
  }
  function renderCalendarGrid() {
    if (!calendarGrid)
      return;
    calendarGrid.innerHTML = "";
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();
    const today = /* @__PURE__ */ new Date();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();
    for (let i = 0; i < startDayOfWeek; i++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day empty";
      calendarGrid.appendChild(dayEl);
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";
      dayEl.textContent = day;
      const currentDate = new Date(year, month, day);
      const localYear = currentDate.getFullYear();
      const localMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const localDay = currentDate.getDate().toString().padStart(2, "0");
      const dateString = `${localYear}-${localMonth}-${localDay}`;
      dayEl.dataset.date = dateString;
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayEl.classList.add("today");
      }
      if (hasEventsOnDate(dateString)) {
        dayEl.classList.add("has-events");
      }
      dayEl.addEventListener("click", () => showDetailView(currentDate));
      calendarGrid.appendChild(dayEl);
    }
    const totalCells = startDayOfWeek + totalDaysInMonth;
    const cellsToFill = totalCells > 35 ? 42 : 35;
    const remainingCells = cellsToFill - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day empty";
      calendarGrid.appendChild(dayEl);
    }
  }
  function hasEventsOnDate(dateString) {
    return allMonthEvents.some((event) => {
      const eventStartDate = (event.start.dateTime || event.start.date).split("T")[0];
      let eventEndDate = eventStartDate;
      if (event.end && event.end.date) {
        const endDateObj = new Date(event.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        eventEndDate = endDateObj.toISOString().split("T")[0];
      } else if (event.end && event.end.dateTime) {
        eventEndDate = event.end.dateTime.split("T")[0];
      }
      return dateString >= eventStartDate && dateString <= eventEndDate;
    });
  }
  function changeMonth(delta) {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + delta);
    allMonthEvents = [];
    updateCalendar();
  }
  function changeYear(delta) {
    currentDisplayDate.setFullYear(currentDisplayDate.getFullYear() + delta);
    allMonthEvents = [];
    updateCalendar();
  }
  function showDetailView(date) {
    if (!calendarView || !detailView || !detailDateTitle || !detailEventsList)
      return;
    calendarView.style.display = "none";
    detailView.style.display = "flex";
    detailDateTitle.textContent = date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    detailEventsList.innerHTML = "";
    const localYear = date.getFullYear();
    const localMonth = (date.getMonth() + 1).toString().padStart(2, "0");
    const localDay = date.getDate().toString().padStart(2, "0");
    const dateString = `${localYear}-${localMonth}-${localDay}`;
    const eventsOnThisDate = allMonthEvents.filter((event) => {
      const eventStartDate = (event.start.dateTime || event.start.date).split("T")[0];
      let eventEndDate = eventStartDate;
      if (event.end && event.end.date) {
        const endDateObj = new Date(event.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        eventEndDate = endDateObj.toISOString().split("T")[0];
      } else if (event.end && event.end.dateTime) {
        eventEndDate = event.end.dateTime.split("T")[0];
      }
      return dateString >= eventStartDate && dateString <= eventEndDate;
    }).sort((a, b) => {
      const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0;
      const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return aTime - bTime;
    });
    if (eventsOnThisDate.length > 0) {
      eventsOnThisDate.forEach((item) => {
        const eventEl = document.createElement("div");
        eventEl.className = "event-item";
        const summaryEl = document.createElement("h2");
        summaryEl.className = "event-summary";
        summaryEl.textContent = item.summary || "(No Title)";
        const dateEl = document.createElement("p");
        dateEl.className = "event-date";
        dateEl.textContent = formatEventDate(item.start, item.end, dateString);
        const linkEl = document.createElement("a");
        linkEl.className = "event-link";
        linkEl.href = item.htmlLink;
        linkEl.textContent = "View/Edit on Google Calendar";
        linkEl.target = "_blank";
        eventEl.appendChild(summaryEl);
        eventEl.appendChild(dateEl);
        eventEl.appendChild(linkEl);
        detailEventsList.appendChild(eventEl);
      });
    } else {
      const noEventsMsg = document.createElement("p");
      noEventsMsg.textContent = "No events on this day.";
      noEventsMsg.style.textAlign = "center";
      noEventsMsg.style.color = "#777";
      noEventsMsg.style.padding = "20px 0 10px 0";
      detailEventsList.appendChild(noEventsMsg);
    }
    const addButton = document.createElement("button");
    addButton.textContent = "\uC0C8 \uC77C\uC815 \uCD94\uAC00";
    addButton.className = "add-event-button";
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const startDateString = `${year}${month}${day}`;
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const nextYear = nextDay.getFullYear();
    const nextMonth = (nextDay.getMonth() + 1).toString().padStart(2, "0");
    const nextDayDate = nextDay.getDate().toString().padStart(2, "0");
    const endDateString = `${nextYear}${nextMonth}${nextDayDate}`;
    const addEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${startDateString}/${endDateString}`;
    addButton.addEventListener("click", () => {
      chrome.tabs.create({ url: addEventUrl });
    });
    detailEventsList.appendChild(addButton);
  }
  function showCalendarView() {
    if (!calendarView || !detailView)
      return;
    calendarView.style.display = "flex";
    detailView.style.display = "none";
  }
  function formatEventDate(start, end, dateString) {
    const options = { hour: "numeric", minute: "2-digit", hour12: true };
    if (start.dateTime) {
      const startDate = new Date(start.dateTime);
      const endDate = new Date(end.dateTime);
      const startTime = startDate.toLocaleTimeString("en-US", options);
      const endTime = endDate.toLocaleTimeString("en-US", options);
      const startDateString = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`;
      const endDateString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}`;
      if (startDateString === dateString && endDateString === dateString) {
        return `${startTime} - ${endTime}`;
      }
      if (startDateString === dateString && endDateString !== dateString) {
        return `${startTime} - (Ends ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
      }
      if (startDateString !== dateString && endDateString === dateString) {
        return `(Starts ${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}) - ${endTime}`;
      }
      if (startDateString !== dateString && endDateString !== dateString) {
        return `(All day - Multi-day event)`;
      }
      return `${startTime} - ${endTime}`;
    } else if (start.date) {
      return "All day";
    }
    return "Date not available";
  }
})();
