(() => {
  "use strict";

  const data = window.REHAB_DATA || [];
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    search: $("#searchInput"),
    searchKbd: $("#searchKbd"),
    heroSuggestions: $("#heroSuggestions"),
    district: $("#districtFilter"),
    type: $("#typeFilter"),
    verification: $("#verificationFilter"),
    sort: $("#sortFilter"),
    results: $("#results"),
    resultCount: $("#resultCount"),
    empty: $("#emptyState"),
    activeFilters: $("#activeFilters"),
    dialog: $("#detailDialog"),
    dialogContent: $("#dialogContent"),
    homepageDialog: $("#homepageDialog"),
    homepageDialogContent: $("#homepageDialogContent"),
    compareDialog: $("#compareDialog"),
    compareDialogContent: $("#compareDialogContent"),
    favoriteToggle: $("#favoriteToggle"),
    btnCompareFavorites: $("#btnCompareFavorites"),
    toast: $("#toast"),
    // 계산기 요소
    calcDisease: $("#calcDisease"),
    calcDate: $("#calcDate"),
    btnCalculate: $("#btnCalculate"),
    calcResultDisplay: $("#calcResultDisplay"),
    calcResultTitle: $("#calcResultTitle"),
    calcDDayBadge: $("#calcDDayBadge"),
    calcSummaryText: $("#calcSummaryText"),
    btnShowRecoveryHospitals: $("#btnShowRecoveryHospitals"),
    // 체크리스트 요소
    formPatientDiagnosis: $("#formPatientDiagnosis"),
    formMobility: $("#formMobility"),
    formDevice: $("#formDevice"),
    formCareType: $("#formCareType"),
    btnGenerateScript: $("#btnGenerateScript"),
    scriptOutputCard: $("#scriptOutputCard"),
    scriptTextBox: $("#scriptTextBox"),
    btnCopyScript: $("#btnCopyScript"),
  };

  // 단축키 KBD 동적 표기 (Mac, Windows, Mobile 구분)
  if (elements.searchKbd) {
    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    if (isTouch) {
      elements.searchKbd.style.display = "none";
    } else {
      elements.searchKbd.textContent = isMac ? "⌘ K" : "Ctrl + K";
    }
  }

  function loadFavorites() {
    try {
      return JSON.parse(window.localStorage?.getItem("busan-rehab-favorites") || "[]").map(String);
    } catch {
      return [];
    }
  }

  const state = {
    query: "",
    district: "",
    type: "",
    verification: "",
    preset: "",
    favoritesOnly: false,
    favorites: new Set(loadFavorites()),
  };

  const VERIFIED = /HIRA|공식|공단|홈페이지 확인|개별확인/;
  const NEEDS_CALL = /확인필요|후보|전화확인/;
  const ABSENT = /해당없음|미확인|확인필요|^$/;
  const districtOrder = ["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구","금정구","강서구","연제구","수영구","사상구","기장군"];

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));

  const normalize = (value) => String(value || "").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  const isPhone = (phone) => /^(?:\d{2,4})-\d/.test(phone || "");
  const sourceUrls = (item) => String(item.sources || "").match(/https?:\/\/[^\s;]+/g) || [];
  const homepageUrl = (item) => sourceUrls(item).find((url) =>
    !/hira\.or\.kr|comwel\.or\.kr|karm\.or\.kr|brhmc\.or\.kr|busan\.go\.kr|ddoga\.co\.kr|caredoc\.kr/i.test(url)
  );
  const homepageSearchUrl = (item) =>
    `https://search.naver.com/search.naver?query=${encodeURIComponent(item.name)}`;
  
  const verifiedScore = (item) => {
    let score = 0;
    if (/공식|HIRA 확인|HIRA 개별확인|공단/.test(item.verification)) score += 4;
    else if (VERIFIED.test(item.verification)) score += 2;
    if (item.rehabDept === "있음") score += 2;
    if (!ABSENT.test(item.recovery)) score += 3;
    if (isPhone(item.phone)) score += 1;
    return score;
  };

  const mapUrl = (item) => `https://map.naver.com/p/search/${encodeURIComponent(`${item.name} ${item.district}`)}`;
  const kakaoMapUrl = (item) => `https://map.kakao.com/link/search/${encodeURIComponent(`${item.name} ${item.district}`)}`;
  const youtubeUrl = (item) => `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name)}`;

  const getShareText = (item) => {
    return `[부산 재활기관 정보 공유]
■ 기관명: ${item.name} (${item.type})
■ 구·군: ${item.district}
■ 전문의: ${item.rehabDept === "있음" ? `재활의학과 있음 (${item.specialists})` : "확인필요"}
■ 형태: ${item.careType}
■ 대상/질환: ${item.conditions}
■ 지정/특화: ${item.specialty || "해당없음"}
■ 회복기 지정: ${item.recovery}
■ 산재/자보: ${item.workersComp} / ${item.autoInsurance}
■ 전화번호: ${item.phone || "확인필요"}
■ 주소: ${item.address}

* 네이버 지도: ${mapUrl(item)}
* 카카오맵: ${kakaoMapUrl(item)}`;
  };

  function presetMatches(item, preset) {
    const text = normalize(Object.values(item).join(" "));
    const rules = {
      rehab: () => item.rehabDept === "있음",
      inpatient: () => /입원|요양입원/.test(item.careType),
      care: () => /요양병원/.test(item.type) || /요양재활|재활요양/.test(text),
      recovery: () => !ABSENT.test(item.recovery),
      workers: () => /재활인증 확인|산재 재활인증|재활인증의료기관/.test(`${item.workersComp} ${item.specialty} ${item.notes}`),
      auto: () => /가능|확인|자동차보험|교통사고/.test(`${item.autoInsurance} ${item.conditions}`) && !/해당없음/.test(item.autoInsurance),
      oriental: () => /한의원|한방병원/.test(item.type) || /한방재활/.test(text),
      call: () => !isPhone(item.phone),
    };
    return !preset || rules[preset]?.();
  }

  function filterData() {
    const terms = String(state.query || "").toLocaleLowerCase("ko-KR").trim().split(/\s+/).filter(Boolean).map(normalize);
    const filtered = data.filter((item) => {
      const haystack = normalize(Object.values(item).join(" "));
      if (terms.some((term) => !haystack.includes(term))) return false;
      if (state.district && item.district !== state.district) return false;
      if (state.type && item.type !== state.type) return false;
      if (state.verification === "verified" && !VERIFIED.test(item.verification)) return false;
      if (state.verification === "call" && !NEEDS_CALL.test(`${item.verification} ${item.notes}`)) return false;
      if (!presetMatches(item, state.preset)) return false;
      if (state.favoritesOnly && !state.favorites.has(String(item.id))) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (elements.sort.value === "name") return a.name.localeCompare(b.name, "ko");
      if (elements.sort.value === "district") {
        return districtOrder.indexOf(a.district) - districtOrder.indexOf(b.district) || a.name.localeCompare(b.name, "ko");
      }
      return verifiedScore(b) - verifiedScore(a) || a.name.localeCompare(b.name, "ko");
    });
  }

  function tagsFor(item) {
    const tags = [];
    if (item.rehabDept === "있음") tags.push("재활의학과");
    if (/입원/.test(item.careType)) tags.push("입원재활");
    if (!ABSENT.test(item.recovery)) tags.push("★회복기지정");
    if (/재활인증 확인|산재 재활인증/.test(`${item.workersComp} ${item.specialty}`)) tags.push("산재 재활인증");
    if (/가능/.test(item.autoInsurance)) tags.push("자동차보험");
    if (/운영 확인|가능성 높음/.test(item.dayRehab)) tags.push("낮병동");
    return tags.slice(0, 4);
  }

  function verificationBadge(item) {
    if (/공식|HIRA 확인|HIRA 개별확인|공단/.test(item.verification)) return ["심평원 검증", ""];
    if (VERIFIED.test(item.verification)) return ["홈페이지 확인", ""];
    return ["전화확인 권장", "warning"];
  }

  function cardTemplate(item) {
    const [verification, warningClass] = verificationBadge(item);
    const tags = tagsFor(item);
    const favorite = state.favorites.has(String(item.id));
    const phoneLink = isPhone(item.phone)
      ? `<a href="tel:${escapeHtml(item.phone)}" data-phone="${escapeHtml(item.phone)}" data-name="${escapeHtml(item.name)}">전화 문의</a>`
      : ``;
    const homepage = homepageUrl(item);

    return `
      <article class="institution-card" data-id="${escapeHtml(item.id)}">
        <button class="favorite-button ${favorite ? "active" : ""}" data-action="favorite" aria-label="${escapeHtml(item.name)} 관심기관 ${favorite ? "해제" : "추가"}" title="관심기관">${favorite ? "★" : "☆"}</button>
        <div class="card-top">
          <span class="badge">${escapeHtml(item.district)}</span>
          <span class="badge type">${escapeHtml(item.type)}</span>
          <span class="badge ${warningClass}">${verification}</span>
        </div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="card-subtitle">${escapeHtml(item.specialty || item.inclusion)}</p>
        <div class="card-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("") || "<span>상세정보 확인</span>"}</div>
        <div class="card-meta">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
          <span>${escapeHtml(item.address)}</span>
        </div>
        <div class="card-actions">
          ${phoneLink}
          <a href="${mapUrl(item)}" target="_blank" rel="noopener">지도 보기</a>
          ${homepage
            ? `<a href="#" data-action="homepage-select" data-id="${escapeHtml(item.id)}">홈페이지</a>`
            : `<a href="${escapeHtml(homepageSearchUrl(item))}" target="_blank" rel="noopener">홈페이지 찾기</a>`}
          <button class="detail-button" data-action="detail">상세 보기</button>
        </div>
      </article>`;
  }

  function render() {
    const items = filterData();
    elements.resultCount.textContent = items.length.toLocaleString("ko-KR");
    elements.results.innerHTML = items.map(cardTemplate).join("");
    elements.results.hidden = items.length === 0;
    elements.empty.hidden = items.length !== 0;
    renderActiveFilters();
    renderHeroSuggestions(items);
  }

  function renderHeroSuggestions(items) {
    if (!state.query) {
      elements.heroSuggestions.hidden = true;
      elements.heroSuggestions.innerHTML = "";
      return;
    }
    const visible = items.slice(0, 5);
    elements.heroSuggestions.hidden = false;
    elements.heroSuggestions.innerHTML = visible.length ? `
      <div class="suggestion-summary">
        <span><strong>${items.length}</strong>개 기관 검색됨</span>
        <span>기관을 누르면 상세정보가 열립니다</span>
      </div>
      <div class="suggestion-list">
        ${visible.map((item) => `
          <button class="suggestion-item" data-suggestion-id="${escapeHtml(item.id)}">
            <span>
              <span class="suggestion-name">${escapeHtml(item.name)}</span>
              <span class="suggestion-meta">${escapeHtml(item.district)} · ${escapeHtml(item.type)} · ${escapeHtml(item.phone)}</span>
            </span>
            <span class="suggestion-arrow">상세보기 ›</span>
          </button>`).join("")}
      </div>
      <button class="suggestion-more" data-suggestion-more>검색 결과 전체 보기 ↓</button>
    ` : `<div class="suggestion-empty">“${escapeHtml(state.query)}”에 해당하는 기관이 없습니다.</div>`;
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.query) chips.push(["query", `검색: ${state.query}`]);
    if (state.district) chips.push(["district", state.district]);
    if (state.type) chips.push(["type", state.type]);
    if (state.verification) chips.push(["verification", state.verification === "verified" ? "확인자료 우선" : "전화확인 대상"]);
    if (state.preset) {
      const presetLabel = document.querySelector(`[data-preset="${state.preset}"]`)?.textContent;
      chips.push(["preset", presetLabel]);
    }
    if (state.favoritesOnly) chips.push(["favorites", "관심기관만"]);
    elements.activeFilters.innerHTML = chips.map(([key, label]) =>
      `<button class="filter-chip" data-remove="${key}" title="조건 해제">${escapeHtml(label)} ×</button>`
    ).join("");
  }

  function detailRows(item) {
    const fields = [
      ["재활의학과 전문의", `${item.rehabDept} · 전문의 ${item.specialists}`],
      ["재활 형태", item.careType],
      ["주요 질환·대상", item.conditions],
      ["지정·특화 분야", item.specialty],
      ["회복기 재활 지정", item.recovery],
      ["산재보험 재활인증", item.workersComp],
      ["자동차보험 지불보증", item.autoInsurance],
      ["낮병동·주간재활", item.dayRehab],
      ["소재지 주소", item.address],
      ["대표 전화번호", item.phone],
      ["데이터 검증 수준", item.verification],
      ["확인 및 비고 메모", item.notes],
    ];
    return fields.map(([term, description]) =>
      `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description || "정보 없음")}</dd>`
    ).join("");
  }

  function sourceLinks(sources) {
    const urls = String(sources || "").match(/https?:\/\/[^\s;]+/g) || [];
    return urls.length
      ? urls.map((url, index) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">출처 ${index + 1} ↗</a>`).join("")
      : "등록된 링크 없음";
  }

  function openDetail(item) {
    const phoneAction = isPhone(item.phone)
      ? `<a href="tel:${escapeHtml(item.phone)}" data-phone="${escapeHtml(item.phone)}" data-name="${escapeHtml(item.name)}">☎ 전화 문의</a>`
      : ``;
    const homepage = homepageUrl(item);
    
    const isRecoveryHospital = item.recovery && !ABSENT.test(item.recovery);
    const recoveryBadge = isRecoveryHospital 
      ? `<span class="badge" style="background: var(--amber); color: var(--white); font-weight: 800; font-size: 11px; padding: 4px 10px; margin-bottom: 8px; display: inline-block; border-radius: 6px; letter-spacing: 0;">💡 보건복지부 제3기 공식 지정 회복기 재활의료기관</span>` 
      : "";

    const reportMailUrl = `mailto:rkstmtk@gmail.com?subject=${encodeURIComponent(`[부산 재활기관 정보 수정 제보] ${item.name}`)}&body=${encodeURIComponent(`■ 기관명: ${item.name}\n■ 관할 구·군: ${item.district}\n■ 주소: ${item.address}\n■ 수정 요청 내용:\n(예: 전문의 수 변동, 전화번호 정정, 병동 형태 등)\n\n※ 확인 가능한 증빙이나 홈페이지 주소를 첨부해 주시면 신속히 반영됩니다.`)}`;

    elements.dialogContent.innerHTML = `
      <div class="dialog-header">
        <div>
          ${recoveryBadge}
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
            <p style="margin: 0;">${escapeHtml(item.district)} · ${escapeHtml(item.type)}</p>
            <span class="verify-freshness-badge">🔄 최종 확인: 2026.09 (공공데이터 동기화)</span>
          </div>
          <h2 id="dialogTitle">${escapeHtml(item.name)}</h2>
        </div>
        <button class="dialog-close" aria-label="닫기">×</button>
      </div>
      <div class="dialog-body">
        <div class="dialog-actions">
          ${phoneAction}
          <a href="${mapUrl(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a>
          <a href="${kakaoMapUrl(item)}" target="_blank" rel="noopener">카카오맵 ↗</a>
          ${homepage
            ? `<a href="#" data-action="homepage-select" data-id="${escapeHtml(item.id)}">홈페이지 ↗</a>`
            : `<a href="${escapeHtml(homepageSearchUrl(item))}" target="_blank" rel="noopener">홈페이지 찾기 ↗</a>`}
          <a href="${youtubeUrl(item)}" target="_blank" rel="noopener" style="background: #ffebeb; border-color: #ffd6d6; color: #e50914;">유튜브 영상 ↗</a>
          <button type="button" data-copy="${escapeHtml(item.address)}">주소 복사</button>
          <button type="button" data-share="${escapeHtml(item.id)}">정보 공유</button>
          <a href="${reportMailUrl}" class="report-inline-btn">✉️ 정보 수정 제보</a>
        </div>
        <dl class="detail-list">
          ${detailRows(item)}
          <dt>근거 자료</dt><dd class="source-links">${sourceLinks(item.sources)}</dd>
        </dl>
      </div>`;
    elements.dialog.showModal();
  }

  function openHomepageSelect(item) {
    const homepage = homepageUrl(item);
    const searchUrl = homepageSearchUrl(item);
    
    elements.homepageDialogContent.innerHTML = `
      <div class="homepage-dialog-header">
        <div>
          <p>${escapeHtml(item.district)} · ${escapeHtml(item.type)}</p>
          <h3 id="homepageDialogTitle">${escapeHtml(item.name)}</h3>
        </div>
        <button class="homepage-dialog-close" aria-label="닫기">×</button>
      </div>
      <div class="homepage-dialog-body">
        <p class="homepage-dialog-desc">
          병원 홈페이지가 일시적으로 점검 중이거나 접속이 원활하지 않을 수 있습니다. 원하시는 이동 경로를 선택해 주세요.
        </p>
        <a href="${escapeHtml(homepage)}" class="homepage-btn-option primary" target="_blank" rel="noopener">
          <span>🌐 공식 홈페이지 바로가기</span>
          <span class="btn-icon">›</span>
        </a>
        <a href="${escapeHtml(searchUrl)}" class="homepage-btn-option naver" target="_blank" rel="noopener">
          <span>💚 네이버 포털에서 병원 검색하기</span>
          <span class="btn-icon">›</span>
        </a>
      </div>
    `;
    elements.homepageDialog.showModal();
  }

  function saveFavorites() {
    try {
      window.localStorage?.setItem("busan-rehab-favorites", JSON.stringify([...state.favorites]));
    } catch {
      // ignore local storage restrictions
    }
  }

  function resetAll() {
    Object.assign(state, { query: "", district: "", type: "", verification: "", preset: "", favoritesOnly: false });
    elements.search.value = "";
    elements.district.value = "";
    elements.type.value = "";
    elements.verification.value = "";
    elements.favoriteToggle.setAttribute("aria-pressed", "false");
    document.querySelectorAll("[data-preset]").forEach((button) => button.classList.remove("active"));
    render();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2000);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function populateFilters() {
    [...new Set(data.map((item) => item.district))]
      .sort((a, b) => districtOrder.indexOf(a) - districtOrder.indexOf(b))
      .forEach((value) => elements.district.add(new Option(value, value)));
    [...new Set(data.map((item) => item.type))].sort((a, b) => a.localeCompare(b, "ko"))
      .forEach((value) => elements.type.add(new Option(value, value)));

    $("#totalStat").textContent = data.length;
    $("#districtStat").textContent = new Set(data.map((item) => item.district).filter(Boolean)).size;
    $("#confirmedStat").textContent = data.filter((item) => item.rehabDept === "있음").length;
    $("#recoveryStat").textContent = data.filter((item) => !ABSENT.test(item.recovery)).length;
  }

  // ============================================================
  // [추가 기능 1] 골든타임 D-Day 계산기 로직
  // ============================================================
  const DISEASE_RULES = {
    stroke: { name: "뇌졸중 (뇌경색/뇌출혈/외상성 뇌손상)", limitDays: 90, maxCareDays: 180, note: "입원 집중치료 최장 180일 인정" },
    spine: { name: "척수손상 (신경외상/척수마비)", limitDays: 90, maxCareDays: 180, note: "입원 집중치료 최장 180일 인정 (의학적 불가피 사유 입증 시 최대 270일 예외 적용 가능)" },
    hip: { name: "고관절·골반·대퇴골 골절 및 치환술", limitDays: 30, maxCareDays: 60, note: "입원 집중치료 최장 30~60일 인정 (치환술·내고정술 시 최대 60일)" },
    multiFracture: { name: "하지 다발골절 (2부위 이상) / 절단", limitDays: 60, maxCareDays: 60, note: "입원 집중치료 최장 60일 인정" },
    disuse: { name: "비사용 증후군 (중환자실 장기치료 후)", limitDays: 60, maxCareDays: 60, note: "입원 집중치료 최장 60일 인정" },
  };

  // 계산기 날짜 기본값 세팅 (오늘 기준 14일 전)
  if (elements.calcDate) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 14);
    elements.calcDate.value = defaultDate.toISOString().split("T")[0];
  }

  function handleCalculateGoldenTime() {
    const diseaseKey = elements.calcDisease.value;
    const rule = DISEASE_RULES[diseaseKey];
    const dateVal = elements.calcDate.value;

    if (!dateVal) {
      showToast("발병일 또는 수술일을 선택해 주세요.");
      return;
    }

    const onsetDate = new Date(dateVal);
    onsetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 마감일 계산
    const deadlineDate = new Date(onsetDate);
    deadlineDate.setDate(deadlineDate.getDate() + rule.limitDays);

    const diffMs = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const deadlineStr = `${deadlineDate.getFullYear()}년 ${deadlineDate.getMonth() + 1}월 ${deadlineDate.getDate()}일`;

    elements.calcResultDisplay.classList.add("active");
    elements.calcResultTitle.textContent = `${rule.name} 골든타임 분석`;

    if (diffDays > 0) {
      elements.calcDDayBadge.textContent = `D-${diffDays}일 남음`;
      elements.calcDDayBadge.classList.remove("urgent");
      elements.calcSummaryText.innerHTML = `
        현재 발병/수술일로부터 입원 마감일까지 <strong>${diffDays}일</strong> 남았습니다.<br>
        • <strong>법정 입원 마감 기한:</strong> ${deadlineStr}까지 (발병 후 ${rule.limitDays}일 이내)<br>
        • <strong>건강보험 집중치료 인정 기간:</strong> ${rule.note}<br>
        💡 마감 기한을 넘기면 하루 최대 4시간 집중재활 건강보험 혜택을 받을 수 없으므로, <strong>부산 7개 회복기 재활병원</strong>에 즉시 전원 가능 여부를 문의하시기 바랍니다.
      `;
    } else if (diffDays === 0) {
      elements.calcDDayBadge.textContent = `D-Day 오늘 마감!`;
      elements.calcDDayBadge.classList.add("urgent");
      elements.calcSummaryText.innerHTML = `
        <strong>오늘(${deadlineStr})이 회복기 재활병원 입원 마감 골든타임 마지막 날입니다.</strong><br>
        즉시 지정 병원 입원 상담실로 연락하여 당일 입원 또는 전원 심사 접수를 진행하셔야 합니다.
      `;
    } else {
      elements.calcDDayBadge.textContent = `기한 ${Math.abs(diffDays)}일 경과`;
      elements.calcDDayBadge.classList.add("urgent");
      elements.calcSummaryText.innerHTML = `
        법정 회복기 재활 입원 기한(${deadlineStr})으로부터 <strong>${Math.abs(diffDays)}일 경과</strong>되었습니다.<br>
        • 단, 수술 지연이나 중환자실 급성기 치료 등 <em>의학적으로 불가피한 사유</em>가 진료기록부상 인정되는 경우 예외 심사가 가능할 수 있습니다.<br>
        • 예외 사유가 없더라도 부산 내 <strong>재활 요양병원 및 일반 재활의학과 입원 치료</strong>는 언제든 가능하므로 아래 병원 목록을 확인하세요.
      `;
    }
  }

  elements.btnCalculate?.addEventListener("click", handleCalculateGoldenTime);

  elements.btnShowRecoveryHospitals?.addEventListener("click", () => {
    state.preset = "recovery";
    document.querySelectorAll("[data-preset]").forEach((btn) => btn.classList.toggle("active", btn.dataset.preset === "recovery"));
    render();
    document.querySelector(".directory").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ============================================================
  // [추가 기능 4] 병원 전화 문의 1분 스크립트 생성기 로직
  // ============================================================
  function handleGenerateScript() {
    const diagnosis = elements.formPatientDiagnosis.value.trim() || "뇌질환 수술 후 재활 대상";
    const mobility = elements.formMobility.value;
    const device = elements.formDevice.value;
    const careType = elements.formCareType.value;

    const script = `[부산 재활병원 입원 상담 전화 1분 스크립트]

"안녕하세요, 재활 입원 및 전원 상담 문의드립니다.
저희 가족 환자 입원 가능 여부를 여쭙고자 전화드렸습니다.

■ 환자 핵심 정보
1. 질환 및 경과: ${diagnosis}
2. 거동 상태: ${mobility}
3. 의료장비 부착: ${device}
4. 희망 병동: ${careType}

■ 병원 상담원에게 확인할 핵심 질문 4가지
Q1. 위 환자 상태 기준으로 현재 입원 가능한 빈 병상(또는 대기 일정)이 있나요?
Q2. 재활의학과 전문의 및 치료사 1:1 맞춤 집중치료(하루 최대 4시간)가 매일 제공되나요?
Q3. 간호간병통합서비스 병동 적용이 가능한가요? (간병비 본인부담금 일 2~3만원대 확인)
Q4. 입원 심사를 위해 팩스로 먼저 보내야 하는 서류(진료의뢰서, 의무기록, 간호기록, 영상CD 등)와 팩스번호를 알려주세요."

* 본 스크립트는 '부산 재활기관 찾기 가이드(busan.koreapmr.com)'에서 생성되었습니다.`;

    elements.scriptTextBox.textContent = script;
    elements.scriptOutputCard.style.display = "block";
    showToast("전화 문의 스크립트가 생성되었습니다!");
  }

  elements.btnGenerateScript?.addEventListener("click", handleGenerateScript);

  elements.btnCopyScript?.addEventListener("click", async () => {
    await copyText(elements.scriptTextBox.textContent);
    showToast("전화 문의 스크립트를 클립보드에 복사했습니다!");
  });

  // ============================================================
  // [추가 기능 3] 관심 병원 나란히 비교 모달 로직
  // ============================================================
  function handleCompareFavorites() {
    const favIds = [...state.favorites];
    if (favIds.length === 0) {
      showToast("비교를 위해 관심기관(☆)을 2곳 이상 등록해 주세요.");
      return;
    }
    if (favIds.length === 1) {
      showToast("비교를 위해 관심기관(☆)을 1곳 더 등록해 주세요.");
      return;
    }

    const compareItems = favIds.slice(0, 3).map((id) => data.find((item) => String(item.id) === id)).filter(Boolean);

    let tableHtml = `
      <div class="compare-table-wrapper">
        <table class="compare-grid-table">
          <thead>
            <tr>
              <th style="width: 130px;">비교 항목</th>
              ${compareItems.map((item) => `<th style="min-width: 200px;">${escapeHtml(item.name)}<br><small style="font-weight: normal; color: var(--muted);">${escapeHtml(item.district)}</small></th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>기관 종별</th>
              ${compareItems.map((item) => `<td><strong>${escapeHtml(item.type)}</strong></td>`).join("")}
            </tr>
            <tr>
              <th>회복기 재활 지정</th>
              ${compareItems.map((item) => {
                const isRec = !ABSENT.test(item.recovery);
                return `<td>${isRec ? `<span style="color: #b45309; font-weight: 800;">★ 복지부 제3기 지정</span>` : escapeHtml(item.recovery || "-")}</td>`;
              }).join("")}
            </tr>
            <tr>
              <th>재활의학과 전문의</th>
              ${compareItems.map((item) => `<td>${escapeHtml(item.rehabDept)} (${escapeHtml(item.specialists)})</td>`).join("")}
            </tr>
            <tr>
              <th>입원/치료 형태</th>
              ${compareItems.map((item) => `<td>${escapeHtml(item.careType)}</td>`).join("")}
            </tr>
            <tr>
              <th>보험 적용 구분</th>
              ${compareItems.map((item) => `<td>산재: ${escapeHtml(item.workersComp)}<br>자보: ${escapeHtml(item.autoInsurance)}</td>`).join("")}
            </tr>
            <tr>
              <th>대표 전화</th>
              ${compareItems.map((item) => `<td><a href="tel:${escapeHtml(item.phone)}" style="font-weight: 800; color: var(--teal-900); text-decoration: none;">📞 ${escapeHtml(item.phone)}</a></td>`).join("")}
            </tr>
            <tr>
              <th>소재지 주소</th>
              ${compareItems.map((item) => `<td><small>${escapeHtml(item.address)}</small></td>`).join("")}
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size: 12.5px; color: var(--muted); margin: 8px 0 0;">
        ※ 최대 3곳까지 나란히 비교됩니다. 관심기관 목록에서 별표(★)를 추가하거나 변경하실 수 있습니다.
      </p>
    `;

    elements.compareDialogContent.innerHTML = tableHtml;
    elements.compareDialog.showModal();

    // 텍스트 복사 핸들러 연결
    $("#btnCopyCompare").onclick = async () => {
      const summaryText = `[부산 재활병원 비교 결과]
` + compareItems.map((item, idx) => `
${idx + 1}. ${item.name} (${item.district} / ${item.type})
• 회복기 재활: ${item.recovery}
• 전문의: ${item.rehabDept} (${item.specialists})
• 형태: ${item.careType}
• 보험: 산재(${item.workersComp}) / 자보(${item.autoInsurance})
• 전화: ${item.phone}
• 주소: ${item.address}`).join("\n--------------------\n");

      await copyText(summaryText);
      showToast("비교 결과 요약이 복사되었습니다. 카카오톡 등에 공유하세요!");
    };
  }

  elements.btnCompareFavorites?.addEventListener("click", handleCompareFavorites);
  $("#btnCloseCompare")?.addEventListener("click", () => elements.compareDialog.close());
  $("#btnCloseCompare2")?.addEventListener("click", () => elements.compareDialog.close());

  // ============================================================
  // 이벤트 리스너 연결
  // ============================================================
  elements.search.addEventListener("input", (event) => { state.query = event.target.value.trim(); render(); });
  elements.heroSuggestions.addEventListener("click", (event) => {
    const suggestion = event.target.closest("[data-suggestion-id]");
    if (suggestion) {
      const item = data.find((record) => String(record.id) === suggestion.dataset.suggestionId);
      if (item) openDetail(item);
      return;
    }
    if (event.target.closest("[data-suggestion-more]")) {
      document.querySelector(".directory").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  elements.district.addEventListener("change", (event) => { state.district = event.target.value; render(); });
  elements.type.addEventListener("change", (event) => { state.type = event.target.value; render(); });
  elements.verification.addEventListener("change", (event) => { state.verification = event.target.value; render(); });
  elements.sort.addEventListener("change", render);
  $("#resetButton").addEventListener("click", resetAll);
  $("#emptyReset").addEventListener("click", resetAll);
  $("#printButton").addEventListener("click", () => window.print());

  document.querySelector(".quick-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    state.preset = state.preset === button.dataset.preset ? "" : button.dataset.preset;
    document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("active", item.dataset.preset === state.preset));
    document.querySelector(".directory").scrollIntoView({ behavior: "smooth", block: "start" });
    render();
  });

  elements.favoriteToggle.addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    elements.favoriteToggle.setAttribute("aria-pressed", String(state.favoritesOnly));
    render();
  });

  elements.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    const key = button.dataset.remove;
    if (key === "query") { state.query = ""; elements.search.value = ""; }
    if (key === "district") { state.district = ""; elements.district.value = ""; }
    if (key === "type") { state.type = ""; elements.type.value = ""; }
    if (key === "verification") { state.verification = ""; elements.verification.value = ""; }
    if (key === "preset") {
      state.preset = "";
      document.querySelectorAll("[data-preset]").forEach((item) => item.classList.remove("active"));
    }
    if (key === "favorites") {
      state.favoritesOnly = false;
      elements.favoriteToggle.setAttribute("aria-pressed", "false");
    }
    render();
  });

  elements.results.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    const action = event.target.closest("[data-action]");
    if (!card || !action) return;
    const item = data.find((record) => String(record.id) === card.dataset.id);
    if (!item) return;
    if (action.dataset.action === "detail") openDetail(item);
    if (action.dataset.action === "homepage-select") {
      event.preventDefault();
      openHomepageSelect(item);
    }
    if (action.dataset.action === "favorite") {
      const id = String(item.id);
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      saveFavorites();
      showToast(state.favorites.has(id) ? "관심기관에 저장했습니다." : "관심기관에서 삭제했습니다.");
      render();
    }
  });

  elements.dialog.addEventListener("click", async (event) => {
    if (event.target === elements.dialog || event.target.closest(".dialog-close")) elements.dialog.close();
    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      await copyText(copyButton.dataset.copy);
      showToast("주소를 복사했습니다.");
    }
    const shareButton = event.target.closest("[data-share]");
    if (shareButton) {
      const item = data.find((record) => String(record.id) === shareButton.dataset.share);
      if (item) {
        await copyText(getShareText(item));
        showToast("상세 정보를 복사했습니다. 필요한 곳에 붙여넣어 공유하세요!");
      }
    }
    const homepageSelectBtn = event.target.closest('[data-action="homepage-select"]');
    if (homepageSelectBtn) {
      event.preventDefault();
      const item = data.find((record) => String(record.id) === homepageSelectBtn.dataset.id);
      if (item) openHomepageSelect(item);
    }
  });

  elements.homepageDialog.addEventListener("click", (event) => {
    if (event.target === elements.homepageDialog || event.target.closest(".homepage-dialog-close")) {
      elements.homepageDialog.close();
    }
    if (event.target.closest(".homepage-btn-option")) {
      elements.homepageDialog.close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape" && elements.search.value && !elements.dialog.open && !elements.compareDialog.open) {
      state.query = "";
      elements.search.value = "";
      render();
    }
  });

  // 전문가 가이드 탭 전환
  document.querySelector(".guide-tabs")?.addEventListener("click", (event) => {
    const tabBtn = event.target.closest(".guide-tab-btn");
    if (!tabBtn) return;
    const targetId = tabBtn.dataset.tab;
    
    document.querySelectorAll(".guide-tab-btn").forEach((btn) => btn.classList.remove("active"));
    tabBtn.classList.add("active");
    
    document.querySelectorAll(".guide-pane").forEach((pane) => pane.classList.remove("active"));
    document.getElementById(targetId)?.classList.add("active");
  });

  // 전화번호 클릭 시 안내 팝업창 및 복사
  document.addEventListener("click", async (event) => {
    const phoneBtn = event.target.closest("[data-phone]");
    if (!phoneBtn) return;
    
    event.preventDefault();
    const phone = phoneBtn.dataset.phone;
    const name = phoneBtn.dataset.name || "기관";
    
    await copyText(phone);
    showToast("전화번호를 복사했습니다.");
    alert(`📞 ${name} 전화 문의 안내\n\n▶ 전화번호: ${phone}\n\n확인을 누르면 번호가 클립보드에 자동 복사됩니다.`);
  });

  populateFilters();
  render();
})();
