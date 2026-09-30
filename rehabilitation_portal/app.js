/**
 * rehabilitation_portal / app.js  v2.5
 * 전국 재활·요양기관 통합 안내 포털 (koreapmr.com)
 * 
 * ✅ 주요 기능:
 * 1. 최신 소식 최신순 정렬 및 데이터 기준일 자동 계산 갱신
 * 2. 최신 소식 카드 클릭 시 상세 안내 모달(newsDetailModal) 팝업
 * 3. 보호자 필독 재활 전문 칼럼 허브 동적 렌더링 및 모달(articleDetailModal) 열람
 * 4. 모바일 원터치 퀵 지역 바 및 핵심 조건별 퀵 필터 칩 연동
 * 5. 어르신·보호자를 위한 큰 글자 모드 (가+ / 가-)
 * 6. 야간 병실 모드 (다크/라이트 테마 전환)
 * 7. 카카오톡/SNS 1초 공유하기 (Web Share API + 클립보드 복사)
 * 8. 보호자 1:1 맞춤 입원/재활 상담 간편 접수 폼
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

    // 조건 필터 및 모바일 퀵 지역 바
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

    // 푸터 갱신일
    const footerFreshness     = document.getElementById('footerFreshness');

    // 렌더링된 카드 참조
    let renderedCards = [];
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
        let latestDate = data.meta.lastUpdated || '2026-09-30';
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
    // 최신 소식 렌더링 & 클릭 시 상세 모달 오픈
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

            card.innerHTML = `
                <span class="news-badge ${item.badgeType || 'notice'}">${item.badge || '공지'}</span>
                <div class="news-body">
                    <p class="news-title">${item.title}</p>
                    <p class="news-desc">${item.desc || ''}</p>
                    <div style="margin-top: 5px; display: flex; align-items: center; gap: 6px;">
                        ${regionTag}
                        <span class="news-date">${formatDate(item.date)}</span>
                    </div>
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
                : '관련 재활기관 목록 보기 ↗';
        }

        newsDetailModal.showModal();
    }

    // --------------------------------------------------------
    // 보호자 전문 칼럼 허브 렌더링 & 모달 열기
    // --------------------------------------------------------
    function renderArticles(articles) {
        if (!columnsGrid || !articles || articles.length === 0) return;

        columnsGrid.innerHTML = '';
        articles.forEach(art => {
            const card = document.createElement('article');
            card.className = 'column-card';

            card.innerHTML = `
                <div>
                    <div class="column-header">
                        <span class="column-category">${art.category}</span>
                        <span class="column-read-time">⏱️ ${art.readTime}</span>
                    </div>
                    <h3 class="column-title">${art.title}</h3>
                    <p class="column-summary">${art.summary}</p>
                </div>
                <button type="button" class="column-btn" data-id="${art.id}">
                    전문 칼럼 읽기 📖
                </button>
            `;

            // 버튼 클릭 시 전문 모달
            const btnRead = card.querySelector('.column-btn');
            btnRead.addEventListener('click', () => openArticleModal(art));

            columnsGrid.appendChild(card);
        });
    }

    // [칼럼 전문 모달 열기]
    function openArticleModal(art) {
        if (!articleDetailModal) return;

        articleModalCategory.textContent = art.category;
        articleModalReadTime.textContent = `⏱️ ${art.readTime}`;
        articleModalTitle.textContent = art.title;
        articleModalBody.innerHTML = art.contentHtml;

        // 칼럼 공유 버튼
        if (btnShareArticleModal) {
            btnShareArticleModal.onclick = () => {
                sharePortal(`${art.title} - 전국 재활·요양기관 안내 포털`);
            };
        }

        articleDetailModal.showModal();
    }

    // --------------------------------------------------------
    // 지역 카드 목록 렌더링
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
    // 통합 필터링 (검색어 + 조건 칩)
    // --------------------------------------------------------
    function applyCombinedFilter() {
        const query = (regionSearch ? regionSearch.value : '').trim().toLowerCase();
        let visibleCount = 0;

        renderedCards.forEach(card => {
            const keys = (card.getAttribute('data-search-keys') || '').toLowerCase();
            const name = (card.getAttribute('data-name') || '').toLowerCase();

            // 1. 검색어 매칭
            const matchesQuery = !query || keys.includes(query) || name.includes(query);

            // 2. 조건 필터 매칭
            let matchesCondition = true;
            if (currentFilterCondition !== 'all') {
                matchesCondition = keys.includes(currentFilterCondition.toLowerCase());
            }

            if (matchesQuery && matchesCondition) {
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
    if (btnResetSearch) {
        btnResetSearch.addEventListener('click', () => {
            if (regionSearch) regionSearch.value = '';
            currentFilterCondition = 'all';
            filterChips.forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('.filter-chip[data-filter="all"]');
            if (allChip) allChip.classList.add('active');
            regionPills.forEach(p => p.classList.remove('active'));
            const allPill = document.querySelector('.region-pill[data-region="all"]');
            if (allPill) allPill.classList.add('active');
            applyCombinedFilter();
            if (regionSearch) regionSearch.focus();
        });
    }

    // 조건별 퀵 필터 칩 클릭 이벤트
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

            // 모바일 화면에서는 카드 리스트 영역으로 부드럽게 스크롤
            if (window.innerWidth <= 768 && regionsGrid) {
                regionsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
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
            showToast(isDark ? '야간 병실 모드(눈부심 방지)가 켜졌습니다.' : '일반 화면 모드로 변경되었습니다.');
        });
    }

    // --------------------------------------------------------
    // 1초 공유하기 (Web Share API + 클립보드 복사)
    // --------------------------------------------------------
    function sharePortal(customTitle) {
        const title = customTitle || '전국 재활·요양기관 통합 안내 포털 | 재활지도';
        const text  = '내 가족을 위한 전국 회복기 재활병원, 간호간병통합서비스 병동 정보 한눈에 확인하세요!';
        const url   = window.location.href;

        if (navigator.share) {
            navigator.share({ title, text, url })
                .then(() => showToast('공유하기가 완료되었습니다!'))
                .catch(() => copyToClipboard(url));
        } else {
            copyToClipboard(url);
        }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
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
            showToast('포털 링크가 복사되었습니다!');
        } catch {
            showToast('링크 복사에 실패했습니다. 주소창 주소를 복사해 주세요.');
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
