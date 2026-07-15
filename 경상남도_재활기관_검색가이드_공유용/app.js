(() => {
  "use strict";

  const data = window.REHAB_DATA || [];
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    search: $("#searchInput"),
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
    favoriteToggle: $("#favoriteToggle"),
    toast: $("#toast"),
  };

  function loadFavorites() {
    try {
      return JSON.parse(window.localStorage?.getItem("gyeongnam-rehab-favorites") || "[]").map(String);
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

  const VERIFIED = /HIRA|공식|공단|홈페이지 확인|개별확인|위키/;
  const NEEDS_CALL = /확인필요|후보|전화확인/;
  const ABSENT = /해당없음|미확인|확인필요|^$/;
  
  // 18 districts/counties of Gyeongsangnam-do
  const districtOrder = [
    "창원시", "김해시", "양산시", "진주시", "거제시", 
    "통영시", "사천시", "밀양시", "함안군", "창녕군", 
    "고성군", "하동군", "남해군", "함양군", "산청군", 
    "거창군", "합천군", "의령군"
  ];

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));

  const normalize = (value) => String(value || "").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  const isPhone = (phone) => /^(?:\d{2,4})-\d/.test(phone || "");
  const sourceUrls = (item) => String(item.sources || "").match(/https?:\/\/[^\s;]+/g) || [];
  const homepageUrl = (item) => sourceUrls(item).find((url) =>
    !/hira\.or\.kr|comwel\.or\.kr|karm\.or\.kr|nrc\.go\.kr|mohw\.go\.kr|kmspecialist\.org|ddoga\.co\.kr|caredoc\.kr/i.test(url)
  );
  const homepageSearchUrl = (item) =>
    `https://search.naver.com/search.naver?query=${encodeURIComponent(item.name)}`;
  const verifiedScore = (item) => {
    let score = 0;
    if (/공식|HIRA 확인|HIRA 개별확인|공단/.test(item.verification)) score += 4;
    else if (VERIFIED.test(item.verification)) score += 2;
    if (/있음/.test(item.rehabDept)) score += 2;
    if (/지정/.test(item.recovery)) score += 2;
    if (isPhone(item.phone)) score += 1;
    return score;
  };
  const mapUrl = (item) => `https://map.naver.com/p/search/${encodeURIComponent(`${item.name} ${item.district}`)}`;
  const kakaoMapUrl = (item) => `https://map.kakao.com/link/search/${encodeURIComponent(`${item.name} ${item.district}`)}`;
  const youtubeUrl = (item) => `https://www.youtube.com/results?search_query=${encodeURIComponent(item.name)}`;
  const getShareText = (item) => {
    return `[경남 재활기관 정보 공유]
■ 기관명: ${item.name} (${item.type})
■ 시·군: ${item.district}
■ 전문의: ${/있음/.test(item.rehabDept) ? `재활의학과 있음 (${item.specialists})` : "확인필요"}
■ 형태: ${item.careType}
■ 대상/질환: ${item.conditions}
■ 지정/특화: ${item.specialty || "해당없음"}
■ 회복기 지정: ${item.recovery}
■ 산재/자보: ${item.workersComp} / ${item.autoInsurance}
■ 전화번호: ${item.phone || "확인필요"}
■ 주소: ${item.address}

* 네이버 지도: ${mapUrl(item)}
* 카카오맵: ${kakaoMapUrl(item)}
* 관련 유튜브: ${youtubeUrl(item)}`;
  };
  let activeDetailItem = null;

  function presetMatches(item, preset) {
    const text = normalize(Object.values(item).join(" "));
    const rules = {
      rehab: () => /있음/.test(item.rehabDept),
      inpatient: () => /입원|요양입원/.test(item.careType),
      care: () => /요양병원/.test(item.type) || /요양재활|재활요양/.test(text) || /요양/.test(item.inclusion + " " + item.careType),
      recovery: () => /지정/.test(item.recovery),
      workers: () => /인증|공단/.test(item.workersComp + " " + item.specialty + " " + item.notes),
      auto: () => /가능|자동차/.test(item.autoInsurance) && !/해당없음|확인필요/.test(item.autoInsurance),
      oriental: () => /한의원|한방병원/.test(item.type) || /한방재활/.test(text),
      call: () => !isPhone(item.phone),
      pediatric: () => /소아|어린이/.test(item.conditions + " " + item.specialty + " " + item.notes),
      dialysis: () => /투석|인공신장/.test(item.conditions + " " + item.specialty + " " + item.notes),
    };
    return !preset || rules[preset]?.();
  }

  const CHOSUNG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  function getChosung(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) - 44032;
      if (code > -1 && code < 11172) {
        result += CHOSUNG[Math.floor(code / 588)];
      } else {
        result += str.charAt(i);
      }
    }
    return result;
  }

  function filterData() {
    const terms = String(state.query || "").toLocaleLowerCase("ko-KR").trim().split(/\s+/).filter(Boolean).map(normalize);
    const filtered = data.filter((item) => {
      const haystack = normalize(Object.values(item).join(" "));
      const chosungHaystack = getChosung(haystack);
      
      if (terms.some((term) => {
        const isOnlyChosung = /^[ㄱ-ㅎ]+$/.test(term);
        if (isOnlyChosung) {
          return !chosungHaystack.includes(term);
        } else {
          return !haystack.includes(term);
        }
      })) return false;
      
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
    if (/있음/.test(item.rehabDept)) tags.push("재활의학과");
    if (/입원/.test(item.careType)) tags.push("입원재활");
    if (/지정/.test(item.recovery)) tags.push("회복기");
    if (/인증|공단/.test(item.workersComp)) tags.push("산재 인증");
    if (/가능/.test(item.autoInsurance) && !/해당없음|확인/.test(item.autoInsurance)) tags.push("자동차보험");
    if (/소아|어린이/.test(item.conditions + " " + item.specialty)) tags.push("소아재활");
    if (/투석|인공신장/.test(item.notes + " " + item.conditions)) tags.push("투석가능");
    if (/운영 확인|가능성 높음/.test(item.dayRehab)) tags.push("낮병동");
    return tags.slice(0, 4);
  }

  function verificationBadge(item) {
    if (/공식|HIRA 확인|HIRA 개별확인|공단/.test(item.verification)) return ["확인 자료", ""];
    if (VERIFIED.test(item.verification)) return ["홈페이지 확인", ""];
    return ["전화확인 권장", "warning"];
  }

  function cardTemplate(item) {
    const [verification, warningClass] = verificationBadge(item);
    const tags = tagsFor(item);
    const favorite = state.favorites.has(String(item.id));
    const phoneLink = isPhone(item.phone)
      ? `<a href="tel:${escapeHtml(item.phone)}" data-phone="${escapeHtml(item.phone)}" data-name="${escapeHtml(item.name)}">전화번호</a>`
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
          <a href="${escapeHtml(homepage || homepageSearchUrl(item))}" target="_blank" rel="noopener">${homepage ? "홈페이지" : "홈페이지 찾기"}</a>
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
        <span>기관을 선택하면 상세정보가 열립니다</span>
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
      ["재활의학과", `${item.rehabDept} · 전문의 ${item.specialists}`],
      ["재활 형태", item.careType],
      ["주요 질환·대상", item.conditions],
      ["지정·특화", item.specialty],
      ["회복기 재활기관", item.recovery],
      ["산재 지정·인증", item.workersComp],
      ["자동차보험", item.autoInsurance],
      ["낮병동·주간재활", item.dayRehab],
      ["주소", item.address],
      ["전화", item.phone],
      ["검증수준", item.verification],
      ["확인 메모", item.notes],
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

  function detailNotice(item) {
    if (/지정/.test(item.recovery)) {
      return '<span class="dialog-notice" style="background: var(--amber); color: var(--white); font-weight: 800; font-size: 11px; padding: 4px 10px; margin-bottom: 8px; display: inline-block; border-radius: 6px; letter-spacing: 0;">💡 보건복지부 지정 제3기 회복기 재활의료기관</span>';
    }
    if (/한방병원|한의원/.test(item.type)) {
      return '<span class="dialog-notice oriental">한방재활 후보 · 의과 재활의학과와 구분</span>';
    }
    if (item.rehabDept === "있음") {
      return '<span class="dialog-notice">✓ 재활의학과 확인 기관</span>';
    }
    return '<span class="dialog-notice review">☎ 최신 진료·입원 운영 여부 전화 확인 권장</span>';
  }

  function openDetail(item) {
    activeDetailItem = item;
    const phoneAction = isPhone(item.phone)
      ? `<a href="tel:${escapeHtml(item.phone)}" data-phone="${escapeHtml(item.phone)}" data-name="${escapeHtml(item.name)}">☎ 전화번호 보기</a>`
      : ``;
    const homepage = homepageUrl(item);
    elements.dialogContent.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title-wrap">
          ${detailNotice(item)}
          <p>${escapeHtml(item.district)} · ${escapeHtml(item.type)}</p>
          <h2 id="dialogTitle">${escapeHtml(item.name)}</h2>
        </div>
        <button class="dialog-close" aria-label="닫기">×</button>
      </div>
      <div class="dialog-body">
        <div class="dialog-actions">
          ${phoneAction}
          <a href="${mapUrl(item)}" target="_blank" rel="noopener">네이버 지도 ↗</a>
          <a href="${kakaoMapUrl(item)}" target="_blank" rel="noopener">카카오맵 ↗</a>
          <a href="${escapeHtml(homepage || homepageSearchUrl(item))}" target="_blank" rel="noopener">${homepage ? "공식 홈페이지 ↗" : "홈페이지 찾기 ↗"}</a>
          <a href="${youtubeUrl(item)}" target="_blank" rel="noopener" style="background: #ffebeb; border-color: #ffd6d6; color: #e50914;">유튜브 검색 ↗</a>
          <button type="button" data-copy="${escapeHtml(item.address)}">주소 복사</button>
          <button type="button" data-share="${escapeHtml(item.id)}">정보 공유</button>
        </div>
        <dl class="detail-list">
          ${detailRows(item)}
          <dt>근거 자료</dt><dd class="source-links">${sourceLinks(item.sources)}</dd>
        </dl>
      </div>`;
    elements.dialog.showModal();
  }

  function saveFavorites() {
    try {
      window.localStorage?.setItem("gyeongnam-rehab-favorites", JSON.stringify([...state.favorites]));
    } catch {
      // 로컬 파일 보안 설정 우회
    }
  }

  function renderDistrictRow() {
    const counts = {};
    data.forEach((item) => {
      if (item.district) {
        counts[item.district] = (counts[item.district] || 0) + 1;
      }
    });
    
    const row = $("#districtRow");
    if (!row) return;
    row.innerHTML = "";
    
    const allChip = document.createElement("button");
    allChip.className = "drawer-chip" + (state.district === "" ? " active" : "");
    allChip.dataset.district = "";
    allChip.innerHTML = `경남 전체 <span class="cnt" style="margin-left: 4px; font-size: 11px; opacity: 0.7;">${data.length}</span>`;
    row.appendChild(allChip);
    
    districtOrder.forEach((gugun) => {
      if (!counts[gugun]) return;
      const chip = document.createElement("button");
      chip.className = "drawer-chip" + (state.district === gugun ? " active" : "");
      chip.dataset.district = gugun;
      chip.innerHTML = `${gugun} <span class="cnt" style="margin-left: 4px; font-size: 11px; opacity: 0.7;">${counts[gugun]}</span>`;
      row.appendChild(chip);
    });
    
    row.querySelectorAll(".drawer-chip").forEach((el) => {
      el.addEventListener("click", () => {
        row.querySelectorAll(".drawer-chip").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        state.district = el.dataset.district;
        elements.district.value = el.dataset.district;
        
        document.querySelector(".directory").scrollIntoView({ behavior: "smooth", block: "start" });
        render();
      });
    });
  }

  function resetAll() {
    Object.assign(state, { query: "", district: "", type: "", verification: "", preset: "", favoritesOnly: false });
    elements.search.value = "";
    elements.district.value = "";
    elements.type.value = "";
    elements.verification.value = "";
    elements.favoriteToggle.setAttribute("aria-pressed", "false");
    document.querySelectorAll("[data-preset]").forEach((button) => button.classList.remove("active"));
    document.querySelectorAll("#districtRow .drawer-chip").forEach((el) => {
      el.classList.toggle("active", (el.dataset.district || "") === "");
    });
    render();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 1700);
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
    // Unique districts sorted by districtOrder
    const uniqueDistricts = [...new Set(data.map((item) => item.district))].filter(Boolean);
    uniqueDistricts.sort((a, b) => {
      const idxA = districtOrder.indexOf(a);
      const idxB = districtOrder.indexOf(b);
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      return valA - valB || a.localeCompare(b, "ko");
    });
    uniqueDistricts.forEach((value) => elements.district.add(new Option(value, value)));

    // Unique types sorted alphabetically
    const uniqueTypes = [...new Set(data.map((item) => item.type))].filter(Boolean);
    uniqueTypes.sort((a, b) => a.localeCompare(b, "ko"));
    uniqueTypes.forEach((value) => elements.type.add(new Option(value, value)));

    $("#totalStat").textContent = data.length;
    $("#districtStat").textContent = new Set(data.map((item) => item.district).filter(Boolean)).size;
    $("#confirmedStat").textContent = data.filter((item) => /있음/.test(item.rehabDept)).length;
    $("#recoveryStat").textContent = data.filter((item) => /지정/.test(item.recovery)).length;
    
    renderDistrictRow();
  }

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
  elements.district.addEventListener("change", (event) => { 
    state.district = event.target.value; 
    document.querySelectorAll("#districtRow .drawer-chip").forEach((el) => {
      el.classList.toggle("active", (el.dataset.district || "") === state.district);
    });
    render(); 
  });
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
    if (key === "district") { 
      state.district = ""; 
      elements.district.value = ""; 
      document.querySelectorAll("#districtRow .drawer-chip").forEach((el) => {
        el.classList.toggle("active", (el.dataset.district || "") === "");
      });
    }
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
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === "Escape" && elements.search.value && !elements.dialog.open) {
      state.query = "";
      elements.search.value = "";
      render();
    }
  });

  // 전문가 가이드 탭 기능 추가
  document.querySelector(".guide-tabs")?.addEventListener("click", (event) => {
    const tabBtn = event.target.closest(".guide-tab-btn");
    if (!tabBtn) return;
    const targetId = tabBtn.dataset.tab;
    
    document.querySelectorAll(".guide-tab-btn").forEach((btn) => btn.classList.remove("active"));
    tabBtn.classList.add("active");
    
    document.querySelectorAll(".guide-pane").forEach((pane) => pane.classList.remove("active"));
    document.getElementById(targetId)?.classList.add("active");
  });

  // 전화번호 클릭 시 안내 팝업 및 복사
  document.addEventListener("click", async (event) => {
    const phoneBtn = event.target.closest("[data-phone]");
    if (!phoneBtn) return;
    
    event.preventDefault();
    const phone = phoneBtn.dataset.phone;
    const name = phoneBtn.dataset.name || "기관";
    
    await copyText(phone);
    showToast("전화번호를 복사했습니다.");
    alert(`📞 ${name} 전화번호 안내\n\n▶ 전화번호: ${phone}\n\n확인을 누르면 번호가 클립보드에 자동 복사됩니다.`);
  });

  // AdSense 연동 필수 정책 모달 처리
  const policyDialog = $("#policyDialog");
  const policyContent = $("#policyContent");

  if (policyDialog) {
    policyDialog.addEventListener("click", (event) => {
      if (event.target === policyDialog || event.target.closest(".dialog-close")) policyDialog.close();
    });
  }

  function openPolicy(title, bodyHtml) {
    if (!policyDialog || !policyContent) return;
    policyContent.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title-wrap">
          <p>경상남도 재활기관 안내 서비스</p>
          <h2 id="policyTitle">${title}</h2>
        </div>
        <button class="dialog-close" aria-label="닫기">×</button>
      </div>
      <div class="dialog-body" style="line-height: 1.8; font-size: 14.5px; color: var(--ink);">
        ${bodyHtml}
      </div>
    `;
    policyDialog.showModal();
  }

  const POLICIES = {
    privacy: {
      title: "개인정보처리방침 (Privacy Policy)",
      body: `
        <h3 style="margin-top: 0; color: var(--teal-900);">1. 수집하는 개인정보 항목</h3>
        <p>본 서비스("경상남도 재활기관 검색 가이드")는 사용자로부터 어떠한 이름, 이메일, 전화번호 등의 개인 식별 정보도 별도로 입력받거나 서버로 전송하여 수집하지 않는 **회원가입이 필요 없는 비영리 정보 조회 서비스**입니다.</p>
        <p>단, 사용자가 선호하는 기관을 즐겨찾기(관심기관 ★)로 설정할 경우, 브라우저가 제공하는 로컬 저장소(LocalStorage)에 해당 기관 고유 ID를 보관하며, 이는 전적으로 사용자의 기기 내부에서만 처리되고 외부에 공유되거나 서버에 백업되지 않습니다.</p>
        
        <h3 style="margin-top: 20px; color: var(--teal-900);">2. 쿠키(Cookie) 및 제3자 광고사용 안내</h3>
        <p>본 서비스는 사용자 경험 개선 및 구글 애드센스(Google AdSense) 광고 게재를 위해 분석 도구 및 제3자 광고 시스템을 이용할 수 있으며, 이 과정에서 쿠키(Cookie) 또는 비식별 식별자가 자동으로 생성되어 저장될 수 있습니다.</p>
        <p>구글 애드센스는 쿠키를 사용하여 사용자가 당사 사이트 또는 타 사이트를 방문한 내역을 기반으로 맞춤형 맞춤광고를 표시합니다. 사용자는 구글의 <a href="https://adssettings.google.com" target="_blank" rel="noopener" style="color: var(--teal-800); font-weight: 800;">광고 설정</a> 또는 브라우저의 쿠키 옵션을 통해 이러한 맞춤 광고 배제를 직접 설정하실 수 있습니다.</p>
        
        <h3 style="margin-top: 20px; color: var(--teal-900);">3. 개인정보 보호 문의</h3>
        <p>본 방침 또는 로컬데이터 처리에 대한 궁금증이나 제안사항이 있으신 경우 아래 '정보 오류 제보 및 문의' 창구를 통해 제보 또는 이메일 연락을 주시면 신속히 답변해 드리겠습니다.</p>
      `
    },
    terms: {
      title: "이용약관 및 면책고지 (Terms & Disclaimer)",
      body: `
        <h3 style="margin-top: 0; color: var(--teal-900);">1. 서비스 이용 안내</h3>
        <p>본 사이트에서 제공되는 모든 의료기관 정보는 건강보험심사평가원(HIRA), 보건복지부, 근로복지공단, 국립재활원의 오픈 공공데이터 및 공개 자료를 수집·가공하여 공공의 알 권리를 위해 무료로 제공하는 웹 정보 서비스입니다.</p>
        
        <h3 style="margin-top: 20px; color: var(--teal-900);">2. 데이터의 한계 및 면책 고지</h3>
        <p>각 의료기관의 상세 현황(전문의 수, 입원 대기 병상 유무, 치료 형태 등)은 매시간 또는 일 단위로 변경될 수 있어 실제 현황과 일치하지 않는 정보가 포함될 수 있습니다. **따라서 어떠한 응급조치나 입원 및 내원 결정을 내리시기 전에, 반드시 안내된 대표 전화를 통해 해당 병원 원무과나 치료센터에 직접 전화를 걸어 최신 상황을 재확인해야 합니다.**</p>
        <p>본 사이트 개설자 및 서비스 제공자는 제공된 데이터의 오류, 지연, 누락 등으로 인해 이용자에게 발생한 어떠한 신체적·재산적 손실이나 법적 분쟁에 대해서도 간접적/직접적 법적 배상 책임을 지지 않습니다.</p>
        
        <h3 style="margin-top: 20px; color: var(--teal-900);">3. 저작권 및 공공 이용 범위</h3>
        <p>본 검색가이드 플랫폼의 코드, 레이아웃 및 랜드마크 배너 디자인 등은 본 사이트에 귀속되어 있으며, 개인 참고 용도 외 상업적 목적의 무단 재배포 및 데이터베이스 크롤링은 엄격히 금지됩니다.</p>
      `
    },
    contact: {
      title: "정보 오류 제보 및 문의 (Feedback & Contact)",
      body: `
        <h3 style="margin-top: 0; color: var(--teal-900);">✉ 문의 및 데이터 정정 제보 안내</h3>
        <p>병원 정보가 변경되었거나, 잘못 기록된 내용이 발견된 경우 신속히 정정 조치를 취하도록 하겠습니다. 병원 관계자분이나 이용자분들의 적극적인 제보를 기다립니다.</p>
        <div style="background: var(--mint-soft); border: 1px solid #b9ddd7; padding: 18px; border-radius: 12px; margin-top: 15px;">
          <p style="margin: 0 0 8px; font-weight: 800; color: var(--teal-900);">대표 이메일 문의처</p>
          <p style="margin: 0; font-size: 17px; font-family: monospace; font-weight: 900; color: #08776e;">rkstmtk@gmail.com</p>
        </div>
        <p style="margin-top: 15px; font-size: 12.5px; color: var(--muted);">※ 제보 시 [병원명] 및 [변경이 필요한 항목(주소, 전화번호, 전문의 수 등)]을 정확히 작성하여 송부해 주시면, 심평원 및 공식 홈페이지 대조 작업을 거쳐 24시간 이내에 데이터에 반영해 드리겠습니다.</p>
      `
    }
  };

  $("#privacyBtn")?.addEventListener("click", () => openPolicy(POLICIES.privacy.title, POLICIES.privacy.body));
  $("#termsBtn")?.addEventListener("click", () => openPolicy(POLICIES.terms.title, POLICIES.terms.body));
  $("#contactBtn")?.addEventListener("click", () => openPolicy(POLICIES.contact.title, POLICIES.contact.body));

  populateFilters();
  render();
})();
