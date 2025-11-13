let authToken = null;
let currentDisplayDate = new Date();
let allMonthEvents = [];

// DOM 요소 캐시
let loginView, calendarContainer, calendarView, detailView, calendarGrid, yearTitle, monthTitle, detailDateTitle, detailEventsList, loadingSpinner, loginButton;

document.addEventListener('DOMContentLoaded', () => {
  // 뷰 컨테이너 캐시
  loginView = document.getElementById('login-view');
  calendarContainer = document.getElementById('calendar-container');

  // 캘린더 뷰 요소 캐시
  calendarView = document.getElementById('calendar-view');
  detailView = document.getElementById('detail-view');
  calendarGrid = document.getElementById('calendar-grid');
  yearTitle = document.getElementById('year-title');
  monthTitle = document.getElementById('month-title');
  detailDateTitle = document.getElementById('detail-date-title');
  detailEventsList = document.getElementById('detail-events-list');
  loadingSpinner = document.getElementById('loading-spinner');

  // 버튼 캐시
  loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const logoutButtonDetail = document.getElementById('logout-button-detail');
  
  // 년/월 버튼 분리
  const prevYearButton = document.getElementById('prev-year-button');
  const nextYearButton = document.getElementById('next-year-button');
  const prevMonthButton = document.getElementById('prev-month-button');
  const nextMonthButton = document.getElementById('next-month-button');
  
  const backButton = document.getElementById('back-button');

  // 리스너 바인딩
  if (loginButton) {
    loginButton.addEventListener('click', handleLogin);
  } else {
    console.error('Error: login-button not found');
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  } else {
    console.error('Error: logout-button not found');
  }
  
  if (logoutButtonDetail) {
    logoutButtonDetail.addEventListener('click', handleLogout);
  } else {
    console.error('Error: logout-button-detail not found');
  }
  
  // 년도/월별 리스너 연결
  if (prevYearButton) {
    prevYearButton.addEventListener('click', () => changeYear(-1));
  } else {
    console.error('Error: prev-year-button not found');
  }
  if (nextYearButton) {
    nextYearButton.addEventListener('click', () => changeYear(1));
  } else {
    console.error('Error: next-year-button not found');
  }
  if (prevMonthButton) {
    prevMonthButton.addEventListener('click', () => changeMonth(-1));
  } else {
    console.error('Error: prev-month-button not found');
  }
  if (nextMonthButton) {
    nextMonthButton.addEventListener('click', () => changeMonth(1));
  } else {
    console.error('Error: next-month-button not found');
  }
  
  if (backButton) {
    backButton.addEventListener('click', showCalendarView);
  } else {
    console.error('Error: back-button not found');
  }
  
  // 자동 로그인
  // 팝업을 띄우지 않고, 캐시된 토큰이 있는지 확인
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (chrome.runtime.lastError || !token) {
      // 로그인 필요: 로그인 뷰 표시 (기본값이므로 코드가 필요 없음)
      console.log("Not logged in. Showing login view.");
      showView('login');
    } else {
      // 로그인 성공: 캘린더 뷰 표시
      console.log("Already logged in. Showing calendar view.");
      authToken = token;
      showView('calendar');
      updateCalendar();
    }
  });
});

/**
 * 로그인 뷰 / 캘린더 뷰 전환.
 * @param {'login' | 'calendar'} viewName
 */
function showView(viewName) {
  if (viewName === 'login') {
    if (loginView) loginView.style.display = 'flex';
    if (calendarContainer) calendarContainer.style.display = 'none';
  } else {
    if (loginView) loginView.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
    if (calendarView) calendarView.style.display = 'flex';
  }
}

/**
 * 'Sign in' 버튼 클릭 시 호출.
 * 사용자에게 계정 선택 팝업 불러오기.
 */
function handleLogin() {
  if (loginButton) {
    loginButton.textContent = 'Signing in...';
    loginButton.disabled = true;
  }
  
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      console.error(chrome.runtime.lastError);
      if (loginButton) {
        loginButton.textContent = 'Sign in with Google';
        loginButton.disabled = false;
      }
      return;
    }
    // 로그인 성공
    console.log("Interactive login successful.");
    authToken = token;
    showView('calendar');
    updateCalendar();
    
    // 버튼 상태 복구 (로그아웃 후 다시 로그인할 경우 대비)
    if (loginButton) {
      loginButton.textContent = 'Sign in with Google';
      loginButton.disabled = false;
    }
  });
}

/**
 * 'Logout' 버튼 클릭 시 호출.
 * 캐시된 토큰을 삭제하고 로그인 뷰로 회귀.
 */
function handleLogout() {
  if (authToken) {
    console.log("Logging out. Removing cached token...");
    // UI 초기화
    if (loadingSpinner) loadingSpinner.classList.add('show');
    showCalendarView(); // 캘린더 메인 뷰로 전환

    // 캐시된 토큰 삭제
    const currentToken = authToken;
    authToken = null; // 내부 변수 초기화
    allMonthEvents = []; // 이벤트 캐시 초기화
    if (calendarGrid) calendarGrid.innerHTML = '';
    if (yearTitle) yearTitle.textContent = 'Logging out...';
    if (monthTitle) monthTitle.textContent = '';


    chrome.identity.removeCachedAuthToken({ token: currentToken }, () => {
      if (chrome.runtime.lastError) {
        console.error("Could not remove cached token:", chrome.runtime.lastError);
      } else {
        console.log("Cached token removed successfully.");
      }
      
      // 뷰 전환
      if (loadingSpinner) loadingSpinner.classList.remove('show');
      showView('login');
      // 헤더 텍스트 초기화 (다음에 로그인할 때를 위해)
      if (yearTitle) yearTitle.textContent = 'Loading...';
      if (monthTitle) monthTitle.textContent = 'Loading...';
    });
  } else {
    // 토큰이 없는 상태라면, 그냥 뷰만 전환
    console.log("No auth token found, just showing login view.");
    showView('login');
  }
}

/**
 * 달력 업데이트
 */
function updateCalendar() {
  if (!authToken || !yearTitle || !monthTitle || !calendarGrid || !loadingSpinner) {
     console.error("Cannot update calendar, auth token or core elements missing.");
     return;
  }

  // 헤더 업데이트
  yearTitle.textContent = currentDisplayDate.getFullYear();
  monthTitle.textContent = currentDisplayDate.toLocaleDateString('en-US', {
    month: 'long'
  });

  // 캘린더 그리드 비우기
  calendarGrid.innerHTML = '';
  
  // 로딩 표시
  loadingSpinner.classList.add('show');

  // API 호출을 위한 날짜 범위 계산
  const firstDayOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, 0);

  const timeMin = new Date(firstDayOfMonth);
  timeMin.setDate(timeMin.getDate() - firstDayOfMonth.getDay()); 
  const timeMax = new Date(lastDayOfMonth);
  timeMax.setDate(timeMax.getDate() + (6 - lastDayOfMonth.getDay())); 
  timeMax.setHours(23, 59, 59, 999); 

  fetchCalendarEvents(timeMin.toISOString(), timeMax.toISOString());
}

/**
 * Google Calendar API를 호출하여 특정 기간의 이벤트 불러오기.
 * @param {string} timeMin - ISO 8601 날짜 문자열
 * @param {string} timeMax - ISO 8601 날짜 문자열
 */
async function fetchCalendarEvents(timeMin, timeMax) {
  if (!authToken) {
      console.error("No auth token, cannot fetch events.");
      return;
  }
  
  const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
       // 인증 실패 시 로그아웃 처리
       console.error("Authorization failed (401). Token likely expired. Logging out.");
       handleLogout();
       return;
    }
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    allMonthEvents = data.items || [];
    
    if (loadingSpinner) loadingSpinner.classList.remove('show');
    renderCalendarGrid();

  } catch (error) {
    console.error('Error fetching events:', error);
    if (loadingSpinner) loadingSpinner.classList.remove('show');
    if (calendarGrid) {
      calendarGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / 8; padding: 20px; color: red;">Error loading events.</p>';
    }
  }
}

/**
 * 캘린더 그리드 렌더링.
 */
function renderCalendarGrid() {
  if (!calendarGrid) return;
  
  calendarGrid.innerHTML = '';

  const year = currentDisplayDate.getFullYear();
  const month = currentDisplayDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); 
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // 이전 달의 빈 날짜 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day empty';
    calendarGrid.appendChild(dayEl);
  }

  // 현재 달의 날짜 채우기
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    
    const currentDate = new Date(year, month, day);
    
    const localYear = currentDate.getFullYear();
    const localMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const localDay = currentDate.getDate().toString().padStart(2, '0');
    const dateString = `${localYear}-${localMonth}-${localDay}`;

    dayEl.dataset.date = dateString; 

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayEl.classList.add('today');
    }

    if (hasEventsOnDate(dateString)) {
      dayEl.classList.add('has-events');
    }
    
    dayEl.addEventListener('click', () => showDetailView(currentDate));

    calendarGrid.appendChild(dayEl);
  }

  // 다음 달의 빈 날짜 채우기 (총 6주, 42칸을 채우도록)
  const totalCells = startDayOfWeek + totalDaysInMonth;
  const cellsToFill = (totalCells > 35) ? 42 : 35; // 5주(35) 또는 6주(42)
  const remainingCells = cellsToFill - totalCells;
  
  for (let i = 0; i < remainingCells; i++) {
     const dayEl = document.createElement('div');
     dayEl.className = 'calendar-day empty';
     calendarGrid.appendChild(dayEl);
  }
}

/**
 * 특정 날짜에 이벤트가 있는지 확인.
 * @param {string} dateString - 'YYYY-MM-DD' 형식의 날짜
 * @returns {boolean}
 */
function hasEventsOnDate(dateString) {
  return allMonthEvents.some(event => {
    const eventStartDate = (event.start.dateTime || event.start.date).split('T')[0];
    
    let eventEndDate = eventStartDate;
    if (event.end && event.end.date) {
        const endDateObj = new Date(event.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        eventEndDate = endDateObj.toISOString().split('T')[0];
    } else if (event.end && event.end.dateTime) {
        eventEndDate = event.end.dateTime.split('T')[0];
    }
    return dateString >= eventStartDate && dateString <= eventEndDate;
  });
}

/**
 * 이전/다음 달로 캘린더 변경.
 * @param {number} delta - -1 (이전 달) 또는 1 (다음 달)
 */
function changeMonth(delta) {
  currentDisplayDate.setMonth(currentDisplayDate.getMonth() + delta);
  allMonthEvents = []; // 이벤트 캐시 클리어
  updateCalendar(); // 캘린더 새로고침
}

/**
 * 이전/다음 년도로 캘린더 변경.
 * @param {number} delta - -1 (이전 년도) 또는 1 (다음 년도)
 */
function changeYear(delta) {
  currentDisplayDate.setFullYear(currentDisplayDate.getFullYear() + delta);
  allMonthEvents = []; // 이벤트 캐시 클리어
  updateCalendar(); // 캘린더 새로고침
}

/**
 * 특정 날짜의 세부 일정 뷰 표시.
 * @param {Date} date - 클릭된 날짜의 Date 객체
 */
function showDetailView(date) {
  if (!calendarView || !detailView || !detailDateTitle || !detailEventsList) return;

  calendarView.style.display = 'none';
  detailView.style.display = 'flex';

  detailDateTitle.textContent = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  detailEventsList.innerHTML = ''; // 리스트 비우기
  
  const localYear = date.getFullYear();
  const localMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  const localDay = date.getDate().toString().padStart(2, '0');
  const dateString = `${localYear}-${localMonth}-${localDay}`;

  const eventsOnThisDate = allMonthEvents.filter(event => {
    const eventStartDate = (event.start.dateTime || event.start.date).split('T')[0];
    let eventEndDate = eventStartDate;
    if (event.end && event.end.date) {
        const endDateObj = new Date(event.end.date);
        endDateObj.setDate(endDateObj.getDate() - 1);
        eventEndDate = endDateObj.toISOString().split('T')[0];
    } else if (event.end && event.end.dateTime) {
        eventEndDate = event.end.dateTime.split('T')[0];
    }
    return dateString >= eventStartDate && dateString <= eventEndDate;
  }).sort((a, b) => { 
      const aTime = a.start.dateTime ? new Date(a.start.dateTime).getTime() : 0; 
      const bTime = b.start.dateTime ? new Date(b.start.dateTime).getTime() : 0;
      return aTime - bTime;
  });

  if (eventsOnThisDate.length > 0) {
    eventsOnThisDate.forEach(item => {
      const eventEl = document.createElement('div');
      eventEl.className = 'event-item';

      const summaryEl = document.createElement('h2');
      summaryEl.className = 'event-summary';
      summaryEl.textContent = item.summary || '(No Title)';
      
      const dateEl = document.createElement('p');
      dateEl.className = 'event-date';
      dateEl.textContent = formatEventDate(item.start, item.end, dateString);

      const linkEl = document.createElement('a');
      linkEl.className = 'event-link';
      linkEl.href = item.htmlLink;
      linkEl.textContent = 'View/Edit on Google Calendar';
      linkEl.target = '_blank'; 

      eventEl.appendChild(summaryEl);
      eventEl.appendChild(dateEl);
      eventEl.appendChild(linkEl);
      detailEventsList.appendChild(eventEl);
    });
  } else {
    const noEventsMsg = document.createElement('p');
    noEventsMsg.textContent = 'No events on this day.';
    noEventsMsg.style.textAlign = 'center';
    noEventsMsg.style.color = '#777';
    noEventsMsg.style.padding = '20px 0 10px 0'; 

    detailEventsList.appendChild(noEventsMsg);
  }
  
  const addButton = document.createElement('button');
  addButton.textContent = '새 일정 추가';
  addButton.className = 'add-event-button';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const startDateString = `${year}${month}${day}`;

  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  const nextYear = nextDay.getFullYear();
  const nextMonth = (nextDay.getMonth() + 1).toString().padStart(2, '0');
  const nextDayDate = nextDay.getDate().toString().padStart(2, '0');
  const endDateString = `${nextYear}${nextMonth}${nextDayDate}`;

  const addEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${startDateString}/${endDateString}`;

  addButton.addEventListener('click', () => {
    chrome.tabs.create({ url: addEventUrl });
  });

  detailEventsList.appendChild(addButton);
}

/**
 * 캘린더 뷰로 회귀.
 */
function showCalendarView() {
  if (!calendarView || !detailView) return;
  calendarView.style.display = 'flex';
  detailView.style.display = 'none';
}

/**
 * 이벤트 날짜/시간 문자열 포맷.
 */
function formatEventDate(start, end, dateString) {
  const options = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  if (start.dateTime) {
    const startDate = new Date(start.dateTime);
    const endDate = new Date(end.dateTime);
    
    const startTime = startDate.toLocaleTimeString('en-US', options);
    const endTime = endDate.toLocaleTimeString('en-US', options);

    const startDateString = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
    const endDateString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

    if (startDateString === dateString && endDateString === dateString) {
      return `${startTime} - ${endTime}`;
    }
    if (startDateString === dateString && endDateString !== dateString) {
      return `${startTime} - (Ends ${endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})`;
    }
    if (startDateString !== dateString && endDateString === dateString) {
      return `(Starts ${startDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}) - ${endTime}`;
    }
    if (startDateString !== dateString && endDateString !== dateString) {
        return `(All day - Multi-day event)`;
    }
    
    return `${startTime} - ${endTime}`; 

  } else if (start.date) {
    return 'All day';
  }
  return 'Date not available';
}