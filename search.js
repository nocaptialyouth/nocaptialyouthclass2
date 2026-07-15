// ============================================================
// 전국 여성·소아 의료기관 검색 엔진
// ============================================================

let currentDept = "전체";
let displayCount = 12;
let filteredResults = [];

// ── 초기화 ──────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  initSidoSelect();
  initDeptTabs();
  initEnterKey();
  initCategoryFilters();
  updateDataCount();
  renderDalbit("전체");
  renderEmergency("전체");
});

function updateDataCount() {
  var badge = document.getElementById("data-count-badge");
  if (badge) {
    var dalbitCnt = HOSPITALS.filter(function(h){ return h.special.indexOf("달빛어린이병원") >= 0; }).length;
    var emergCnt  = HOSPITALS.filter(function(h){ return h.special.indexOf("소아응급실") >= 0; }).length;
    badge.textContent = "전국 " + HOSPITALS.length + "개 기관 수록 · 달빛 " + dalbitCnt + "곳 · 응급 " + emergCnt + "곳";
  }
}

// ── 시/도 선택 ───────────────────────────────
function initSidoSelect() {
  var sidoSel = document.getElementById("sido-select");
  sidoSel.addEventListener("change", function () {
    var sido = this.value;
    var sigunguSel = document.getElementById("sigungu-select");
    sigunguSel.innerHTML = '<option value="">전체 구/군/시</option>';
    if (sido && SIGUNGU_MAP[sido]) {
      sigunguSel.disabled = false;
      SIGUNGU_MAP[sido].forEach(function (sg) {
        var opt = document.createElement("option");
        opt.value = sg; opt.textContent = sg;
        sigunguSel.appendChild(opt);
      });
    } else {
      sigunguSel.disabled = true;
      sigunguSel.innerHTML = '<option value="">시/도 먼저 선택</option>';
    }
  });
}

// ── 진료과목 탭 ──────────────────────────────
function initDeptTabs() {
  document.querySelectorAll(".dept-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".dept-tab").forEach(function (t) { t.classList.remove("active"); });
      this.classList.add("active");
      currentDept = this.dataset.dept;
    });
  });
}

// ── 기관유형 필터 ─────────────────────────────
function initCategoryFilters() {
  document.querySelectorAll('input[name="catFilter"]').forEach(function(cb) {
    cb.addEventListener("change", function() {});
  });
}

function getCheckedCategories() {
  var cats = [];
  document.querySelectorAll('input[name="catFilter"]:checked').forEach(function(cb) {
    cats.push(cb.value);
  });
  return cats;
}

// ── 엔터키 검색 ──────────────────────────────
function initEnterKey() {
  document.getElementById("name-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") doSearch();
  });
}

// ── 메인 검색 ────────────────────────────────
function doSearch() {
  var sido     = document.getElementById("sido-select").value.trim();
  var sigungu  = document.getElementById("sigungu-select").value.trim();
  var nameKw   = document.getElementById("name-input").value.trim();
  var dept     = currentDept;
  var cats     = getCheckedCategories();
  displayCount = 12;

  filteredResults = HOSPITALS.filter(function (h) {
    var matchSido    = !sido    || h.sido    === sido;
    var matchSigungu = !sigungu || h.sigungu === sigungu;
    var matchName    = !nameKw  || h.name.indexOf(nameKw) >= 0 || h.address.indexOf(nameKw) >= 0 || (h.dong && h.dong.indexOf(nameKw) >= 0);
    
    var matchDept = false;
    if (dept === "전체") {
      matchDept = true;
    } else if (dept === "달빛어린이병원") {
      matchDept = h.special.indexOf("달빛어린이병원") >= 0;
    } else if (dept === "소아응급실") {
      matchDept = h.special.indexOf("소아응급실") >= 0;
    } else if (dept === "출산/난임") {
      matchDept = h.types.indexOf("출산") >= 0 || h.types.indexOf("난임") >= 0;
    } else {
      matchDept = h.types.indexOf(dept) >= 0;
    }

    var matchCat     = cats.length === 0 || cats.indexOf(h.category) >= 0;
    return matchSido && matchSigungu && matchName && matchDept && matchCat;
  });

  renderResults(sido, sigungu, nameKw, dept);
  document.getElementById("results-area").scrollIntoView({ behavior:"smooth", block:"start" });
}

// ── 결과 렌더링 ──────────────────────────────
function renderResults(sido, sigungu, nameKw, dept) {
  var area = document.getElementById("results-area");
  if (filteredResults.length === 0) {
    area.innerHTML = buildNoResults(sido, sigungu, nameKw, dept);
    return;
  }
  var showing = filteredResults.slice(0, displayCount);
  var html = buildResultsHeader(filteredResults.length, sido, sigungu, dept);
  html += '<div class="hospital-grid" id="hospital-grid">';
  showing.forEach(function (h) { html += buildCard(h); });
  html += "</div>";
  if (filteredResults.length > displayCount) html += buildLoadMore();
  area.innerHTML = html;
  animateCards();
}

function animateCards() {
  setTimeout(function () {
    document.querySelectorAll(".hospital-card").forEach(function (c, i) {
      c.style.opacity = "0";
      c.style.transform = "translateY(20px)";
      setTimeout(function () {
        c.style.transition = "opacity .35s ease, transform .35s ease, border-color .3s, box-shadow .3s, background .3s";
        c.style.opacity = "1";
        c.style.transform = "translateY(0)";
      }, i * 45);
    });
  }, 10);
}

function buildResultsHeader(total, sido, sigungu, dept) {
  var locLabel  = [sido, sigungu].filter(Boolean).join(" ") || "전국";
  var deptLabel = dept === "전체" ? "전체 과목" : dept;
  return '<div class="results-header">' +
    '<div class="results-count"><span class="num">' + total + '</span>개 기관 검색됨' +
    ' <span style="font-size:12px;color:var(--text-muted);font-weight:400;">(' + locLabel + ' · ' + deptLabel + ')</span></div>' +
    '<div style="font-size:11px;color:var(--text-muted);">※ 대표 기관 목록입니다. 더 많은 의원은 지역 선택 후 검색하세요.</div>' +
  '</div>';
}

// ── 헬퍼 함수 ────────────────────────────────
function getTypeBadgeClass(t) {
  if (t === "산부인과") return "type-obgyn";
  if (t === "부인과") return "type-gyn";
  if (t === "여성병원") return "type-women";
  if (t === "소아과") return "type-pedi";
  if (t === "소아청소년과") return "type-pedadol";
  if (t === "어린이병원") return "type-childhosp";
  if (t === "출산") return "type-birth";
  if (t === "난임") return "type-infertility";
  return "type-badge-default";
}

// ── 카드 빌드 ────────────────────────────────
function buildCard(h) {
  // 과목 뱃지
  var typeBadges = h.types.map(function (t) {
    var cls = getTypeBadgeClass(t);
    return '<span class="type-badge ' + cls + '">' + t + '</span>';
  }).join("");

  // 특수 뱃지
  var specBadges = "";
  if (h.special.indexOf("달빛어린이병원") >= 0) specBadges += '<span class="type-badge type-dalbit">🌙 달빛어린이병원</span>';
  if (h.special.indexOf("소아응급실") >= 0)      specBadges += '<span class="type-badge type-emerg">🚨 소아응급실</span>';

  // 기관 카테고리 뱃지
  var catClass = h.category === "의원" ? "cat-clinic" : h.category === "병원" ? "cat-hospital" : h.category === "전문병원" ? "cat-special" : "cat-general";

  var naverUrl  = "https://map.naver.com/p/search/" + encodeURIComponent(h.name + " " + (h.sigungu || ""));
  var kakaoUrl  = "https://map.kakao.com/?q=" + encodeURIComponent(h.name);

  return '<div class="hospital-card">' +
    '<div class="card-top">' +
      '<div>' +
        '<div class="card-name">' + h.name + '</div>' +
      '</div>' +
      '<span class="card-category ' + catClass + '">' + h.category + '</span>' +
    '</div>' +
    '<div class="card-types">' + typeBadges + (specBadges ? specBadges : "") + '</div>' +
    '<div class="card-info">' +
      '<div class="card-row"><span class="row-icon">📍</span>' + h.address + '</div>' +
      (h.phone ? '<div class="card-row"><span class="row-icon">📞</span><a href="tel:' + h.phone + '">' + h.phone + '</a></div>' : '') +
      (h.hours ? '<div class="card-row card-hours"><span>🕐</span>' + h.hours + '</div>' : '') +
    '</div>' +
    '<div class="card-actions">' +
      '<a href="' + naverUrl + '" target="_blank" rel="noopener" class="card-btn naver">🗺️ 네이버지도</a>' +
      '<a href="' + kakaoUrl + '" target="_blank" rel="noopener" class="card-btn kakao">🗺️ 카카오맵</a>' +
      (h.phone ? '<a href="tel:' + h.phone + '" class="card-btn call">📞 전화</a>' : '') +
    '</div>' +
  '</div>';
}

function buildNoResults(sido, sigungu, nameKw, dept) {
  var loc = [sido, sigungu].filter(Boolean).join(" ") || "전국";
  return '<div class="no-results">' +
    '<div class="no-results-icon">🔍</div>' +
    '<div class="no-results-text">검색 결과가 없습니다</div>' +
    '<div class="no-results-sub">검색조건: ' + loc + ' · ' + dept + (nameKw ? " · " + nameKw : "") + '<br/><br/>' +
    '조건을 바꿔서 다시 검색해보세요.<br/>지역 선택 없이 병원명만으로도 검색 가능합니다.</div>' +
  '</div>';
}

function buildLoadMore() {
  var remain = filteredResults.length - displayCount;
  return '<div class="load-more-wrap"><button class="load-more-btn" onclick="loadMore()">더보기 (' + remain + '개) ↓</button></div>';
}

function loadMore() {
  displayCount += 12;
  var sido    = document.getElementById("sido-select").value.trim();
  var sigungu = document.getElementById("sigungu-select").value.trim();
  var nameKw  = document.getElementById("name-input").value.trim();
  renderResults(sido, sigungu, nameKw, currentDept);
}

// ── 달빛어린이병원 섹션 ─────────────────────
function filterDalbit(sido, btn) {
  document.querySelectorAll("#dalbit-section .region-pill").forEach(function(p){ p.classList.remove("active"); });
  btn.classList.add("active");
  renderDalbit(sido);
}

function renderDalbit(sido) {
  var list = HOSPITALS.filter(function(h) {
    return h.special.indexOf("달빛어린이병원") >= 0 && (sido === "전체" || h.sido === sido);
  });
  var area = document.getElementById("dalbit-results");
  if (list.length === 0) {
    area.innerHTML = '<div class="no-results"><div class="no-results-icon">🌙</div><div class="no-results-text">해당 지역 달빛어린이병원 정보가 없습니다</div></div>';
    return;
  }
  var html = '<div style="margin-bottom:14px;font-size:13px;color:#a29bfe;font-weight:600;">' +
    '🌙 ' + (sido === "전체" ? "전국" : sido) + ' 달빛어린이병원 ' + list.length + '곳</div>';
  html += '<div class="hospital-grid">';
  list.forEach(function(h) { html += buildDalbitCard(h); });
  html += '</div>';
  area.innerHTML = html;
}

function buildDalbitCard(h) {
  var naverUrl = "https://map.naver.com/p/search/" + encodeURIComponent(h.name + " " + (h.sigungu || ""));
  var kakaoUrl = "https://map.kakao.com/?q=" + encodeURIComponent(h.name);
  var catClass = h.category === "의원" ? "cat-clinic" : h.category === "병원" ? "cat-hospital" : h.category === "전문병원" ? "cat-special" : "cat-general";
  var typeBadges = h.types.map(function(t) {
    var cls = getTypeBadgeClass(t);
    return '<span class="type-badge ' + cls + '">' + t + '</span>';
  }).join("");
  return '<div class="dalbit-card-wrap"><div class="hospital-card">' +
    '<div class="card-top"><div>' +
      '<div class="card-name">' + h.name + '</div>' +
    '</div><span class="card-category ' + catClass + '">' + h.category + '</span></div>' +
    '<div class="card-types">' + typeBadges +
      '<span class="type-badge type-dalbit">🌙 달빛어린이병원</span>' +
      (h.special.indexOf("소아응급실") >= 0 ? '<span class="type-badge type-emerg">🚨 응급</span>' : '') +
    '</div>' +
    '<div class="card-info">' +
      '<div class="card-row"><span class="row-icon">📍</span>' + h.sido + ' ' + h.sigungu + '</div>' +
      '<div class="card-row"><span class="row-icon">📌</span>' + h.address + '</div>' +
      (h.phone ? '<div class="card-row"><span class="row-icon">📞</span><a href="tel:' + h.phone + '">' + h.phone + '</a></div>' : '') +
      '<div class="card-row card-hours"><span>🕐</span>' + (h.hours || "-") + '</div>' +
    '</div>' +
    '<div class="card-actions">' +
      '<a href="' + naverUrl + '" target="_blank" rel="noopener" class="card-btn naver">🗺️ 네이버지도</a>' +
      '<a href="' + kakaoUrl + '" target="_blank" rel="noopener" class="card-btn kakao">🗺️ 카카오맵</a>' +
      (h.phone ? '<a href="tel:' + h.phone + '" class="card-btn">📞 전화</a>' : '') +
    '</div>' +
  '</div></div>';
}

// ── 소아응급실 섹션 ──────────────────────────
function filterEmergency(sido, btn) {
  document.querySelectorAll("#emergency-section .region-pill").forEach(function(p){ p.classList.remove("active"); });
  btn.classList.add("active");
  renderEmergency(sido);
}

function renderEmergency(sido) {
  var list = HOSPITALS.filter(function(h) {
    return h.special.indexOf("소아응급실") >= 0 && (sido === "전체" || h.sido === sido);
  });
  var area = document.getElementById("emergency-results");
  if (list.length === 0) {
    area.innerHTML = '<div class="no-results"><div class="no-results-icon">🚨</div><div class="no-results-text">해당 지역 소아응급실 정보가 없습니다</div></div>';
    return;
  }
  var html = '<div style="margin-bottom:14px;font-size:13px;color:#ff6b81;font-weight:600;">' +
    '🚨 ' + (sido === "전체" ? "전국" : sido) + ' 소아응급실 ' + list.length + '곳 (24시간 운영)</div>';
  html += '<div class="hospital-grid">';
  list.forEach(function(h) { html += buildEmergencyCard(h); });
  html += '</div>';
  area.innerHTML = html;
}

function buildEmergencyCard(h) {
  var naverUrl = "https://map.naver.com/p/search/" + encodeURIComponent(h.name + " " + (h.sigungu || ""));
  var kakaoUrl = "https://map.kakao.com/?q=" + encodeURIComponent(h.name);
  var typeBadges = h.types.map(function(t) {
    var cls = getTypeBadgeClass(t);
    return '<span class="type-badge ' + cls + '">' + t + '</span>';
  }).join("");
  return '<div class="emergency-card-wrap"><div class="hospital-card">' +
    '<div class="card-top"><div>' +
      '<div class="card-name">' + h.name + '</div>' +
    '</div><span class="card-category cat-general">' + h.category + '</span></div>' +
    '<div class="card-types">' + typeBadges +
      '<span class="type-badge type-emerg">🚨 소아응급실</span>' +
      (h.special.indexOf("달빛어린이병원") >= 0 ? '<span class="type-badge type-dalbit">🌙 달빛</span>' : '') +
    '</div>' +
    '<div class="card-info">' +
      '<div class="card-row"><span class="row-icon">📍</span>' + h.sido + ' ' + h.sigungu + '</div>' +
      '<div class="card-row"><span class="row-icon">📌</span>' + h.address + '</div>' +
      (h.phone ? '<div class="card-row"><span class="row-icon">📞</span><a href="tel:' + h.phone + '">' + h.phone + '</a></div>' : '') +
      '<div class="card-row" style="color:#ff6b81;font-weight:700;"><span>🕐</span>24시간 운영</div>' +
    '</div>' +
    '<div class="card-actions">' +
      '<a href="' + naverUrl + '" target="_blank" rel="noopener" class="card-btn naver">🗺️ 네이버지도</a>' +
      '<a href="' + kakaoUrl + '" target="_blank" rel="noopener" class="card-btn kakao">🗺️ 카카오맵</a>' +
      (h.phone ? '<a href="tel:' + h.phone + '" class="card-btn" style="border-color:rgba(255,71,87,0.4);color:#ff6b81;">📞 응급전화</a>' : '') +
    '</div>' +
  '</div></div>';
}

// ── 빠른 이동 ────────────────────────────────
function scrollToSearch(dept) {
  document.querySelectorAll(".dept-tab").forEach(function(t){ t.classList.remove("active"); });
  document.querySelectorAll(".dept-tab").forEach(function(t){
    if (t.dataset.dept === dept) t.classList.add("active");
  });
  currentDept = dept;
  document.getElementById("search-section").scrollIntoView({ behavior:"smooth" });
  setTimeout(function() {
    doSearch();
  }, 350);
}

function scrollToDalbit() {
  document.getElementById("dalbit-section").scrollIntoView({ behavior:"smooth" });
}

function scrollToEmergency() {
  document.getElementById("emergency-section").scrollIntoView({ behavior:"smooth" });
}

// ── 스크롤 헤더 ──────────────────────────────
window.addEventListener("scroll", function () {
  var header = document.querySelector(".site-header");
  if (header) {
    header.style.borderBottomColor = window.scrollY > 40 ? "rgba(232,84,122,0.25)" : "rgba(255,255,255,0.09)";
  }
});
