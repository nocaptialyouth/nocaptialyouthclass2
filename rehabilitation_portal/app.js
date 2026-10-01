/**
 * rehabilitation_portal / app.js  v2.6
 * 전국 재활·요양기관 통합 안내 포털 (koreapmr.com)
 * 
 * ✅ 주요 기능:
 * 1. 최신 소식 동적 렌더링 & 모바일 글자 세로 깨짐 완전 방지 클린 레이아웃
 * 2. 최신 소식 클릭 시 상세 모달(newsDetailModal) 팝업 열람
 * 3. 5대 대권역(수도권/영남/충청·세종/호남/강원·제주) 스마트 탭 + 특화 시설 복합 필터링
 * 4. [전문가 기능 1] 3초 재활 골든타임 & 간병비 절감 인터랙티브 자가진단 계산기
 * 5. [전문가 기능 2] 국가 공공 재활·간병비 원스톱 핫라인 다이얼 연결
 * 6. [전문가 기능 3] 보호자 병원 전화상담 체크리스트 생성 및 단톡방 복사
 * 7. [전문가 기능 4] 보호자 최다 빈도 FAQ 아코디언 허브 인터랙션
 * 8. 보호자 필독 재활 전문 칼럼 허브 및 상세 모달(articleDetailModal) 열람
 * 9. 어르신·보호자를 위한 큰 글자 모드 (가+ / 가-)
 * 10. 야간 병실 모드 (다크/라이트 테마 전환)
 * 11. 카카오톡/SNS 1초 공유하기 (Web Share API + 클립보드 복사)
 */

// ============================================================
// 상수
// ============================================================
const NEWS_MAX = 4; // 메인 화면 표시 최신 소식 개수

// ============================================================
// DOM 준비 후 실행
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // DOM 참조
    // --------------------------------------------------------
    const regionSearch        = document.getElementById('regionSearch');
    const regionsGrid         = document.getElementById('regionsGrid');
    const searchEmptyState    = document.getElementById('searchEmptyState');
    const btnResetSearch      = document.getElementById('btnResetSearch');
    const toast               = document.getElementById('toast');
    const skeletonLoader      = document.getElementById('skeletonLoader');
    const activeCountEl       = document.getElementById('activeCount');
    const hotspots            = document.querySelectorAll('.map-hotspot');

    // 상단 네비게이션 컨트롤
    const btnToggleFontSize   = document.getElementById('btnToggleFontSize');
    const btnToggleTheme      = document.getElementById('btnToggleTheme');
    const themeIcon           = document.getElementById('themeIcon');
    const btnShareTop         = document.getElementById('btnShareTop');

    // 통계 바
    const statsBar            = document.getElementById('statsBar');
    const statRegionCount     = document.getElementById('statRegionCount');
    const statHospitalCount   = document.getElementById('statHospitalCount');
    const statLastUpdated     = document.getElementById('statLastUpdated');

    // 5대 권역 스마트 탭, 특화 필터 및 모바일 퀵 지역 바
    const zoneChips           = document.querySelectorAll('.zone-chip');
    const filterChips         = document.querySelectorAll('.filter-chip');
    const regionPills         = document.querySelectorAll('.region-pill');

    // 소식 섹션
    const newsSection         = document.getElementById('newsSection');
    const newsList            = document.getElementById('newsList');

    // 전문 칼럼 섹션
    const columnsGrid         = document.getElementById('columnsGrid');

    // [모달 1] 소식 상세 모달
    const newsDetailModal     = document.getElementById('newsDetailModal');
    const newsModalBadge      = document.getElementById('newsModalBadge');
    const newsModalDate       = document.getElementById('newsModalDate');
    const newsModalRegion     = document.getElementById('newsModalRegion');
    const newsModalTitle      = document.getElementById('newsModalTitle');
    const newsModalBody       = document.getElementById('newsModalBody');
    const btnNewsModalAction  = document.getElementById('btnNewsModalAction');
    const newsModalActionText = document.getElementById('newsModalActionText');
    const btnCloseNewsModal   = document.getElementById('btnCloseNewsModal');
    const btnDismissNewsModal = document.getElementById('btnDismissNewsModal');

    // [모달 2] 칼럼 상세 모달
    const articleDetailModal  = document.getElementById('articleDetailModal');
    const articleModalCategory= document.getElementById('articleModalCategory');
    const articleModalReadTime= document.getElementById('articleModalReadTime');
    const articleModalTitle   = document.getElementById('articleModalTitle');
    const articleModalBody    = document.getElementById('articleModalBody');
    const btnCloseArticleModal= document.getElementById('btnCloseArticleModal');
    const btnDismissArticleModal = document.getElementById('btnDismissArticleModal');
    const btnShareArticleModal= document.getElementById('btnShareArticleModal');

    // [모달 3] 준비 중 지역 모달
    const preparingModal      = document.getElementById('preparingModal');
    const modalRegionName     = document.getElementById('modalRegionName');
    const btnCloseModal       = document.getElementById('btnCloseModal');
    const btnSubmitRequest    = document.getElementById('btnSubmitRequest');
    const requestEmail        = document.getElementById('requestEmail');

    // [전문가 기능 1] 3초 재활 골든타임 & 간병비 계산기
    const calcDisease         = document.getElementById('calcDisease');
    const calcDays            = document.getElementById('calcDays');
    const calcCareType        = document.getElementById('calcCareType');
    const calcResultBox       = document.getElementById('calcResultBox');

    // [전문가 기능 3] 체크리스트 생성기
    const btnCopyChecklist       = document.getElementById('btnCopyChecklist');
    const btnShareKakaoChecklist = document.getElementById('btnShareKakaoChecklist');
    const checklistItems         = document.getElementById('checklistItems');

    // [전문가 기능 4] FAQ 아코디언
    const faqItems            = document.querySelectorAll('.faq-item');

    // 푸터 갱신일
    const footerFreshness     = document.getElementById('footerFreshness');

    // 렌더링된 카드 참조 및 필터 상태
    let renderedCards          = [];
    let currentZone            = 'all';
    let currentFilterCondition = 'all';

    // --------------------------------------------------------
    // 토스트 알림
    // --------------------------------------------------------
    let toastTimeout;
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
    }

    // --------------------------------------------------------
    // 날짜 포맷팅: "2026-09-28" → "2026년 9월 28일"
    // --------------------------------------------------------
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length < 3) return dateStr;
        return `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
    }

    // --------------------------------------------------------
    // 최신 데이터 기준일 자동 계산 및 통계 바 렌더링
    // --------------------------------------------------------
    function renderStatsBar(data) {
        const activeRegions = data.regions.filter(r => r.status === 'active');
        const totalHospitals = activeRegions.reduce((sum, r) => sum + (r.count || 0), 0);

        statRegionCount.textContent   = activeRegions.length;
        statHospitalCount.textContent = totalHospitals.toLocaleString('ko-KR');

        // ✅ 최신 소식 중 가장 최근 날짜를 자동으로 찾아 '데이터 기준일'에 반영
        let latestDate = data.meta.lastUpdated || '2026-10-01';
        if (data.news && data.news.length > 0) {
            data.news.forEach(n => {
                if (n.date && n.date > latestDate) {
                    latestDate = n.date;
                }
            });
        }

        statLastUpdated.textContent = formatDate(latestDate);
        statsBar.removeAttribute('hidden');
        renderFooterFreshness(latestDate);
    }

    // --------------------------------------------------------
    // 최신 소식 렌더링 (모바일 글자 세로 깨짐 완전 방지 구조)
    // --------------------------------------------------------
    function renderNews(news) {
        if (!news || news.length === 0) return;

        // 최신 날짜순 정렬
        const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));
        const items  = sorted.slice(0, NEWS_MAX);

        newsList.innerHTML = '';
        items.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.style.animationDelay = `${idx * 0.07}s`;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `${item.title} 상세 보기`);

            const regionTag = item.region ? `<span class="news-region-tag">${item.region}</span>` : '';

            // ✅ 모바일 세로 글자 깨짐을 완벽 방지하는 독립 상단 바 + 풀-위드 본문 구조
            card.innerHTML = `
                <div class="news-card-top">
                    <div class="news-card-tags">
                        <span class="news-badge ${item.badgeType || 'notice'}">${item.badge || '공지'}</span>
                        ${regionTag}
                        <span class="news-date">${formatDate(item.date)}</span>
                    </div>
                    <span class="news-more-btn" aria-hidden="true">상세보기 &gt;</span>
                </div>
                <div class="news-body">
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-desc">${item.desc || ''}</p>
                </div>
            `;

            // 클릭 이벤트: 상세 모달 열기
            card.addEventListener('click', () => openNewsDetail(item));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openNewsDetail(item);
                }
            });

            newsList.appendChild(card);
        });

        newsSection.removeAttribute('hidden');
    }

    // [소식 상세 모달 열기]
    function openNewsDetail(item) {
        if (!newsDetailModal) return;

        newsModalBadge.textContent = item.badge || '공지';
        newsModalBadge.className = `news-badge ${item.badgeType || 'notice'}`;
        newsModalDate.textContent = formatDate(item.date);
        newsModalRegion.textContent = item.region || '전국';
        newsModalTitle.textContent = item.title;

        // 본문 내용 (detailHtml 있으면 우선 렌더링, 없으면 desc)
        newsModalBody.innerHTML = item.detailHtml || `<p>${item.desc}</p>`;

        // 액션 버튼
        if (btnNewsModalAction) {
            btnNewsModalAction.href = item.targetUrl || "https://koreapmr.com/";
            newsModalActionText.textContent = item.region && item.region !== '전국'
                ? `${item.region} 재활기관 찾기 ↗`
                : "전국 재활기관 지도 보기 ↗";
        }

        newsDetailModal.showModal();
    }

    // --------------------------------------------------------
    // 보호자 필독 재활 전문 칼럼 허브 렌더링
    // --------------------------------------------------------
    function renderArticles(articles) {
        if (!columnsGrid || !articles || articles.length === 0) return;

        columnsGrid.innerHTML = '';
        articles.forEach((art, idx) => {
            const card = document.createElement('article');
            card.className = 'column-card';
            card.style.animationDelay = `${idx * 0.08}s`;

            card.innerHTML = `
                <div>
                    <div class="column-header">
                        <span class="column-category">${art.category || '가이드'}</span>
                        <span class="column-readtime">⏱️ ${art.readTime || '3분'}</span>
                    </div>
                    <h3 class="column-title">${art.title}</h3>
                    <p class="column-summary">${art.summary}</p>
                </div>
                <div class="column-footer">
                    <span class="column-tag-pill">${art.tag || '필독'}</span>
                    <button type="button" class="btn-read-column" aria-label="${art.title} 칼럼 전체 읽기">
                        전체 읽기 ↗
                    </button>
                </div>
            `;

            const btnRead = card.querySelector('.btn-read-column');
            if (btnRead) {
                btnRead.addEventListener('click', () => openArticleDetail(art));
            }
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-read-column')) {
                    openArticleDetail(art);
                }
            });

            columnsGrid.appendChild(card);
        });
    }

    // [칼럼 상세 모달 열기]
    let currentOpenArticle = null;
    function openArticleDetail(art) {
        if (!articleDetailModal) return;
        currentOpenArticle = art;

        articleModalCategory.textContent = art.category || '재활 가이드';
        articleModalReadTime.textContent = `⏱️ ${art.readTime || '약 3분'}`;
        articleModalTitle.textContent    = art.title;
        articleModalBody.innerHTML       = art.contentHtml || `<p>${art.summary}</p>`;

        articleDetailModal.showModal();
    }

    // 칼럼 모달 내 공유 버튼
    if (btnShareArticleModal) {
        btnShareArticleModal.addEventListener('click', () => {
            if (!currentOpenArticle) return;
            const title = currentOpenArticle.title;
            const text  = `[재활 길잡이 필독 칼럼] ${title}
보호자를 위한 필수 재활 지식을 확인해 보세요.
`;
            const url   = window.location.href;

            if (navigator.share) {
                navigator.share({ title, text, url }).catch(() => {});
            } else {
                fallbackCopy(`${text}${url}`);
            }
        });
    }

    // --------------------------------------------------------
    // 지역 카드 동적 생성 (15개 권역 마스터)
    // --------------------------------------------------------
    function renderRegionCards(regions) {
        if (skeletonLoader) skeletonLoader.remove();

        renderedCards.forEach(el => el.remove());
        renderedCards = [];

        const activeRegions = regions.filter(r => r.status === 'active');
        if (activeCountEl) activeCountEl.textContent = activeRegions.length;

        activeRegions.forEach(region => {
            const article = document.createElement('article');
            article.className = 'region-card active';
            article.setAttribute('data-search-keys', region.searchKeys || region.name);
            article.setAttribute('data-name', region.name);
            article.setAttribute('data-id', region.id);
            article.setAttribute('data-zone', region.zone || '');

            const highlightBadge = region.highlight
                ? `<span class="card-highlight-badge">${region.highlight}</span>`
                : '';

            const countChip = region.count
                ? `<span class="card-count-chip">📋 ${region.count.toLocaleString('ko-KR')}개소 이상</span>`
                : '';

            const tagsHtml = (region.tags || []).map(t => `<span>${t}</span>`).join('');
            const shortName = region.name.replace(/(특별자치도|특별자치시|광역시|통합특별시|특별시)$/, '').replace(/(도|시)$/, '') || region.name;

            article.innerHTML = `
                <div class="card-badge badge-active">운영 중</div>
                <h3 class="card-region-title">${region.name}${highlightBadge}</h3>
                <p class="card-desc">${region.desc}</p>
                <div class="card-meta">
                    ${tagsHtml}
                    ${countChip}
                </div>
                <a href="${region.url}" target="_blank" rel="noopener" class="btn btn-primary btn-block">
                   ${shortName} 재활기관 찾기 ↗
                </a>
            `;

            regionsGrid.appendChild(article);
            renderedCards.push(article);
        });
    }

    // --------------------------------------------------------
    // 푸터 갱신일 표시
    // --------------------------------------------------------
    function renderFooterFreshness(lastUpdated) {
        if (!footerFreshness || !lastUpdated) return;
        footerFreshness.style.textAlign = 'center';
        footerFreshness.style.display   = 'block';
        footerFreshness.style.marginTop = '12px';
        footerFreshness.innerHTML = `<span class="data-freshness">심평원·복지부 공공데이터 최신 교차검증: ${formatDate(lastUpdated)}</span>`;
    }

    // --------------------------------------------------------
    // 통합 필터링 (권역 탭 + 특화 조건 + 검색어)
    // --------------------------------------------------------
    function applyCombinedFilter() {
        const query = (regionSearch ? regionSearch.value : '').trim().toLowerCase();
        let visibleCount = 0;

        renderedCards.forEach(card => {
            const keys = (card.getAttribute('data-search-keys') || '').toLowerCase();
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            const zone = (card.getAttribute('data-zone') || '').toLowerCase();

            // 1. 대권역 매칭
            const matchesZone = (currentZone === 'all') || (zone === currentZone);

            // 2. 특화 시설 조건 매칭
            let matchesCondition = true;
            if (currentFilterCondition !== 'all') {
                matchesCondition = keys.includes(currentFilterCondition.toLowerCase());
            }

            // 3. 검색어 매칭
            const matchesQuery = !query || keys.includes(query) || name.includes(query);

            if (matchesZone && matchesCondition && matchesQuery) {
                card.removeAttribute('hidden');
                visibleCount++;
            } else {
                card.setAttribute('hidden', '');
            }
        });

        if (searchEmptyState) {
            searchEmptyState[visibleCount === 0 ? 'removeAttribute' : 'setAttribute']('hidden', '');
        }

        // 지도 핫스팟 시각적 하이라이트 동기화
        hotspots.forEach(hotspot => {
            const rn = (hotspot.getAttribute('data-name') || '').toLowerCase();
            const sn = rn.replace(/특별|자치|광역시|통합|도$|시$/g, '');
            if (query && (rn.includes(query) || sn.includes(query))) {
                hotspot.style.transform       = 'translate(-50%, -50%) scale(1.18)';
                hotspot.style.boxShadow       = '0 0 15px rgba(13, 148, 136, 0.5)';
                hotspot.style.backgroundColor = 'rgba(20, 184, 166, 0.35)';
            } else {
                hotspot.style.transform = '';
                hotspot.style.boxShadow = '';
                hotspot.style.backgroundColor = '';
            }
        });
    }

    // 검색어 입력 이벤트
    if (regionSearch) {
        regionSearch.addEventListener('input', () => applyCombinedFilter());
    }

    // 검색 초기화 버튼
    if (btnResetSearch) {
        btnResetSearch.addEventListener('click', () => {
            if (regionSearch) regionSearch.value = '';
            currentZone = 'all';
            zoneChips.forEach(c => c.classList.remove('active'));
            const allZoneChip = document.querySelector('.zone-chip[data-zone="all"]');
            if (allZoneChip) allZoneChip.classList.add('active');

            currentFilterCondition = 'all';
            filterChips.forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('.filter-chip[data-filter="all"]');
            if (allChip) allChip.classList.add('active');

            regionPills.forEach(p => p.classList.remove('active'));
            const allPill = document.querySelector('.region-pill[data-region="all"]');
            if (allPill) allPill.classList.add('active');

            applyCombinedFilter();
            if (regionSearch) regionSearch.focus();
            showToast('검색 및 필터 조건이 초기화되었습니다.');
        });
    }

    // 5대 권역 스마트 탭 클릭 이벤트
    zoneChips.forEach(chip => {
        chip.addEventListener('click', () => {
            zoneChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentZone = chip.getAttribute('data-zone') || 'all';
            applyCombinedFilter();
            const cleanName = chip.textContent.replace(/[0-9]/g, '').replace(/[()]/g, '').trim();
            showToast(`'${cleanName}' 권역으로 필터링되었습니다.`);

            // 모바일 화면에서는 카드 리스트 영역으로 부드럽게 스크롤
            if (window.innerWidth <= 768 && regionsGrid) {
                regionsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 특화 조건 필터 칩 클릭 이벤트
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilterCondition = chip.getAttribute('data-filter') || 'all';
            applyCombinedFilter();
            showToast(`'${chip.textContent.trim()}' 조건이 적용되었습니다.`);
        });
    });

    // 모바일 퀵 지역 바 클릭 이벤트
    regionPills.forEach(pill => {
        pill.addEventListener('click', () => {
            regionPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const regionKey = pill.getAttribute('data-region');
            if (regionKey === 'all') {
                if (regionSearch) regionSearch.value = '';
            } else {
                const text = pill.textContent.trim();
                if (regionSearch) regionSearch.value = text;
            }
            applyCombinedFilter();

            if (window.innerWidth <= 768 && regionsGrid) {
                regionsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --------------------------------------------------------
    // [전문가 기능 1] 3초 재활 골든타임 & 간병비 절감 인터랙티브 계산기
    // --------------------------------------------------------
    function updateCalculator() {
        if (!calcResultBox || !calcDisease || !calcDays || !calcCareType) return;

        const disease  = calcDisease.value;
        const days     = parseInt(calcDays.value, 10);
        const careType = calcCareType.value;

        let goldenLimit = 90;
        let diseaseName = '뇌졸중';
        if (disease === 'stroke') {
            goldenLimit = 90;
            diseaseName = '뇌졸중 (뇌경색·뇌출혈)';
        } else if (disease === 'spinal') {
            goldenLimit = 180;
            diseaseName = '척수 손상 (마비)';
        } else if (disease === 'fracture') {
            goldenLimit = 30;
            diseaseName = '대퇴·고관절 골절 (수술 후)';
        } else if (disease === 'multi') {
            goldenLimit = 60;
            diseaseName = '다발 골절 및 하지 절단';
        }

        const remaining = goldenLimit - days;
        let statusClass = 'safe';
        let statusTitle = `🟢 회복기 집중재활 입원 적기 (골든타임 잔여 D-${remaining}일)`;
        let statusDesc = `${diseaseName} 발병 후 정부 지정 회복기 재활병원(일 4시간 1:1 도수/작업치료)에 건강보험으로 입원 가능한 최적기입니다.`;

        if (remaining <= 0) {
            statusClass = 'urgent';
            statusTitle = `🔴 골든타임 기한(${goldenLimit}일) 초과 — 전문 상담 필요`;
            statusDesc = `법정 집중재활 건강보험 지원 기한이 경과되었습니다. 일반 재활의학과 전문병원 또는 만성기 요양병원 집중치료실 전원을 검토하세요.`;
        } else if (remaining <= 20) {
            statusClass = 'warning';
            statusTitle = `🟡 골든타임 마감 임박 (잔여 약 ${remaining}일)`;
            statusDesc = `서류 심사 및 병상 배정에 3~5일이 소요되므로, 지금 즉시 대학병원 퇴원 의무기록을 발급받아 상담을 진행해야 합니다.`;
        }

        // 간병비 절감 계산
        let careSavingText = '월 약 310만 원 절감';
        let careSavingDesc = '개인 사설 간병(월 420만 원) ➔ 간호간병통합(월 110만 원 내외 본인부담금)';
        if (careType === 'family') {
            careSavingText = '가족 간병 부담 100% 해소';
            careSavingDesc = '전문 간호인력이 24시간 전담 케어하여 보호자의 일상 복귀 및 직장 유지가 가능합니다.';
        } else if (careType === 'group') {
            careSavingText = '월 약 80~100만 원 절감';
            careSavingDesc = '요양병원 다인실 공동간병(월 190~220만 원) 대비 경제적이며 전문 간호사가 직접 케어합니다.';
        }

        calcResultBox.innerHTML = `
            <div class="calc-result-grid">
                <div class="calc-result-item">
                    <span class="calc-result-title">1. 회복기 재활 골든타임 판정</span>
                    <span class="calc-status-badge ${statusClass}">${statusTitle}</span>
                    <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin: 4px 0 0;">${statusDesc}</p>
                </div>
                <div class="calc-result-item">
                    <span class="calc-result-title">2. 간호간병통합 시 예상 간병비 절감</span>
                    <span class="calc-money-saved">${careSavingText}</span>
                    <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin: 4px 0 0;">${careSavingDesc}</p>
                </div>
            </div>
            <div class="calc-tip-text">
                💡 <strong>보호자 실천 팁:</strong> 퇴원 최소 5일 전 진료의뢰서, 의무기록사본(경과기록지/퇴원요약지), 영상CD를 챙겨 희망 지역의 보건복지부 지정 회복기 재활병원에 입원 심사를 요청하세요.
            </div>
        `;
    }

    if (calcDisease)  calcDisease.addEventListener('change', updateCalculator);
    if (calcDays)     calcDays.addEventListener('change', updateCalculator);
    if (calcCareType) calcCareType.addEventListener('change', updateCalculator);
    updateCalculator();

    // --------------------------------------------------------
    // [전문가 기능 3] 보호자 병원 전화상담 체크리스트 생성기
    // --------------------------------------------------------
    function copyChecklistMemo(isKakaoFormat) {
        if (!checklistItems) return;
        const checked = checklistItems.querySelectorAll('input[type="checkbox"]:checked');
        if (checked.length === 0) {
            showToast('최소 하나 이상의 질문 항목을 선택해 주세요.');
            return;
        }

        let memo = isKakaoFormat
            ? `[가족 공유] 🏥 재활병원 입원상담 필수 체크리스트
`
            : `📋 [재활병원 전화상담 메모]
`;

        checked.forEach((cb, idx) => {
            memo += `${idx + 1}. ${cb.value}
`;
        });
        memo += `
출처: 전국 재활·요양기관 통합 안내 포털 (https://koreapmr.com/)`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(memo)
                .then(() => showToast(isKakaoFormat ? '가족 단톡방 공유용 질문지가 복사되었습니다!' : '전화상담 체크리스트가 클립보드에 복사되었습니다!'))
                .catch(() => fallbackCopy(memo));
        } else {
            fallbackCopy(memo);
        }
    }

    if (btnCopyChecklist) btnCopyChecklist.addEventListener('click', () => copyChecklistMemo(false));
    if (btnShareKakaoChecklist) btnShareKakaoChecklist.addEventListener('click', () => copyChecklistMemo(true));

    // --------------------------------------------------------
    // [전문가 기능 4] 보호자 최다 빈도 자주 묻는 질문 (FAQ) 아코디언
    // --------------------------------------------------------
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            item.classList.toggle('open');
            btn.setAttribute('aria-expanded', !isOpen);
        });
    });

    // --------------------------------------------------------
    // 큰 글자 모드 (어르신·보호자 배려)
    // --------------------------------------------------------
    const savedLargeFont = localStorage.getItem('koreapmr_large_font');
    if (savedLargeFont === 'true') {
        document.body.classList.add('large-font');
    }

    if (btnToggleFontSize) {
        btnToggleFontSize.addEventListener('click', () => {
            const isLarge = document.body.classList.toggle('large-font');
            localStorage.setItem('koreapmr_large_font', isLarge);
            showToast(isLarge ? '글자 크기가 확대되었습니다.' : '기본 글자 크기로 복원되었습니다.');
        });
    }

    // --------------------------------------------------------
    // 야간 병실 모드 (다크 테마)
    // --------------------------------------------------------
    const savedTheme = localStorage.getItem('koreapmr_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
    }

    if (btnToggleTheme) {
        btnToggleTheme.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('koreapmr_theme', isDark ? 'dark' : 'light');
            if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
            showToast(isDark ? '야간 병실 모드(다크)가 켜졌습니다.' : '주간 모드로 전환되었습니다.');
        });
    }

    // --------------------------------------------------------
    // 카카오톡/SNS 1초 공유하기 (Web Share API + 클립보드 복사)
    // --------------------------------------------------------
    function sharePortal() {
        const shareData = {
            title: '전국 재활·요양기관 통합 안내 포털 | koreapmr.com',
            text: '어려운 재활병원 찾기, 전국 15개 지역 보건복지부 지정 회복기 기관 및 간호간병통합 병동 정보를 한눈에 확인하세요!',
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => showToast('공유 창이 열렸습니다.'))
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        copyLinkToClipboard(shareData.url);
                    }
                });
        } else {
            copyLinkToClipboard(shareData.url);
        }
    }

    function copyLinkToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('포털 링크가 복사되었습니다. 가족 단톡방이나 환우회에 공유해 보세요!'))
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try {
            document.execCommand('copy');
            showToast('내용이 클립보드에 복사되었습니다!');
        } catch {
            showToast('복사에 실패했습니다. 직접 복사해 주세요.');
        }
        document.body.removeChild(ta);
    }

    if (btnShareTop) {
        btnShareTop.addEventListener('click', () => sharePortal());
    }

    // --------------------------------------------------------
    // 공통 모달 닫기 이벤트 (X 버튼, 배경 클릭, ESC 키 지원)
    // --------------------------------------------------------
    const dialogs = [newsDetailModal, articleDetailModal, preparingModal];

    dialogs.forEach(dlg => {
        if (!dlg) return;
        dlg.addEventListener('click', (e) => {
            const r = dlg.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
                dlg.close();
            }
        });
    });

    if (btnCloseNewsModal)   btnCloseNewsModal.addEventListener('click', () => newsDetailModal.close());
    if (btnDismissNewsModal) btnDismissNewsModal.addEventListener('click', () => newsDetailModal.close());

    if (btnCloseArticleModal)   btnCloseArticleModal.addEventListener('click', () => articleDetailModal.close());
    if (btnDismissArticleModal) btnDismissArticleModal.addEventListener('click', () => articleDetailModal.close());

    if (btnCloseModal && preparingModal) btnCloseModal.addEventListener('click', () => preparingModal.close());

    // --------------------------------------------------------
    // 메인 초기화 — window.PORTAL_DATA 읽기
    // --------------------------------------------------------
    function init() {
        const data = window.PORTAL_DATA;

        if (!data) {
            console.error('[Portal] window.PORTAL_DATA 를 찾을 수 없습니다. portal-data.js 로드를 확인하세요.');
            if (skeletonLoader) skeletonLoader.remove();
            if (activeCountEl) activeCountEl.textContent = '로드 실패';
            return;
        }

        renderStatsBar(data);
        renderNews(data.news);
        renderArticles(data.articles);
        renderRegionCards(data.regions);
    }

    init();
});
