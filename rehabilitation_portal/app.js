/**
 * rehabilitation_portal / app.js  v2.1
 * portal-data.js 의 window.PORTAL_DATA 전역변수를 읽어 동적 렌더링
 * → file:// 로컬 환경, Vercel/GitHub Pages 모두 완벽 동작
 */

// ============================================================
// 상수
// ============================================================
const NEWS_MAX = 3; // 소식 섹션 최대 표시 개수

// ============================================================
// DOM 준비 후 실행
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------------
    // DOM 참조
    // --------------------------------------------------------
    const regionSearch      = document.getElementById('regionSearch');
    const regionsGrid       = document.getElementById('regionsGrid');
    const searchEmptyState  = document.getElementById('searchEmptyState');
    const btnResetSearch    = document.getElementById('btnResetSearch');
    const btnShare          = document.getElementById('btn-share');
    const toast             = document.getElementById('toast');
    const skeletonLoader    = document.getElementById('skeletonLoader');
    const activeCountEl     = document.getElementById('activeCount');
    const hotspots          = document.querySelectorAll('.map-hotspot');

    // 통계 바
    const statsBar          = document.getElementById('statsBar');
    const statRegionCount   = document.getElementById('statRegionCount');
    const statHospitalCount = document.getElementById('statHospitalCount');
    const statLastUpdated   = document.getElementById('statLastUpdated');

    // 소식 섹션
    const newsSection       = document.getElementById('newsSection');
    const newsList          = document.getElementById('newsList');

    // 모달
    const preparingModal    = document.getElementById('preparingModal');
    const modalRegionName   = document.getElementById('modalRegionName');
    const btnCloseModal     = document.getElementById('btnCloseModal');
    const btnSubmitRequest  = document.getElementById('btnSubmitRequest');
    const requestEmail      = document.getElementById('requestEmail');

    // 푸터 갱신일
    const footerFreshness   = document.getElementById('footerFreshness');

    // 동적으로 생성된 카드 참조 배열
    let renderedCards = [];

    // --------------------------------------------------------
    // 토스트 알림
    // --------------------------------------------------------
    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --------------------------------------------------------
    // 날짜 포맷  "2026-07-10" → "2026년 7월 10일"
    // --------------------------------------------------------
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
    }

    // --------------------------------------------------------
    // 통계 바 렌더링
    // --------------------------------------------------------
    function renderStatsBar(data) {
        const activeRegions = data.regions.filter(r => r.status === 'active');
        const totalHospitals = activeRegions.reduce((sum, r) => sum + (r.count || 0), 0);

        statRegionCount.textContent   = activeRegions.length;
        statHospitalCount.textContent = totalHospitals.toLocaleString('ko-KR');
        statLastUpdated.textContent   = formatDate(data.meta.lastUpdated);
        statsBar.removeAttribute('hidden');
    }

    // --------------------------------------------------------
    // 최신 소식 섹션 렌더링
    // --------------------------------------------------------
    function renderNews(news) {
        if (!news || news.length === 0) return;

        const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date));
        const items  = sorted.slice(0, NEWS_MAX);

        newsList.innerHTML = '';
        items.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.style.animationDelay = `${idx * 0.08}s`;
            card.innerHTML = `
                <span class="news-badge ${item.badgeType || 'notice'}">${item.badge || '공지'}</span>
                <div class="news-body">
                    <p class="news-title">${item.title}</p>
                    <p class="news-desc">${item.desc || ''}</p>
                </div>
                <span class="news-date">${formatDate(item.date)}</span>
            `;
            newsList.appendChild(card);
        });

        newsSection.removeAttribute('hidden');
    }

    // --------------------------------------------------------
    // 지역 카드 렌더링
    // --------------------------------------------------------
    function renderRegionCards(regions) {
        // 스켈레톤 제거
        if (skeletonLoader) skeletonLoader.remove();

        // 이전 동적 카드 초기화
        renderedCards.forEach(el => el.remove());
        renderedCards = [];

        const activeRegions = regions.filter(r => r.status === 'active');

        if (activeCountEl) activeCountEl.textContent = activeRegions.length;

        activeRegions.forEach(region => {
            const article = document.createElement('article');
            article.className = 'region-card active';
            article.setAttribute('data-search-keys', region.searchKeys || region.name);
            article.setAttribute('data-name', region.name);

            const highlightBadge = region.highlight
                ? `<span class="card-highlight-badge">${region.highlight}</span>`
                : '';

            const countChip = region.count
                ? `<span class="card-count-chip">📋 ${region.count.toLocaleString('ko-KR')}개 이상</span>`
                : '';

            const tagsHtml = (region.tags || []).map(t => `<span>${t}</span>`).join('');

            // 버튼 레이블 정리: 지역 이름에서 행정구역 접미사 추출
            const shortName = region.name.replace(/(특별자치도|특별자치시|광역시|통합특별시|특별시)$/, '').replace(/(도|시)$/, '') || region.name;

            article.innerHTML = `
                <div class="card-badge badge-active">서비스 중</div>
                <h3 class="card-region-title">${region.name}${highlightBadge}</h3>
                <p class="card-desc">${region.desc}</p>
                <div class="card-meta">
                    ${tagsHtml}
                    ${countChip}
                </div>
                <a href="${region.url}" target="_blank" rel="noopener"
                   class="btn btn-primary btn-block">
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
        footerFreshness.style.marginTop = '10px';
        footerFreshness.innerHTML = `<span class="data-freshness">마지막 데이터 갱신: ${formatDate(lastUpdated)}</span>`;
    }

    // --------------------------------------------------------
    // 검색 / 필터
    // --------------------------------------------------------
    function filterRegions(query) {
        const cleanQuery = query.trim().toLowerCase();
        let visibleCount = 0;

        regionsGrid.querySelectorAll('.region-card').forEach(card => {
            const keys = (card.getAttribute('data-search-keys') || '').toLowerCase();
            const isMatch = !cleanQuery || keys.includes(cleanQuery);
            if (isMatch) { card.removeAttribute('hidden'); visibleCount++; }
            else         { card.setAttribute('hidden', ''); }
        });

        searchEmptyState[visibleCount === 0 && cleanQuery ? 'removeAttribute' : 'setAttribute']('hidden', '');

        // 지도 핫스팟 하이라이트 동기화
        hotspots.forEach(hotspot => {
            const rn = (hotspot.getAttribute('data-name') || '').toLowerCase();
            const sn = rn.replace(/특별|자치|광역시|통합|도$|시$/g, '');
            if (cleanQuery && (rn.includes(cleanQuery) || sn.includes(cleanQuery))) {
                hotspot.style.transform       = 'translate(-50%, -50%) scale(1.18)';
                hotspot.style.boxShadow       = '0 0 15px rgba(13, 148, 136, 0.4)';
                hotspot.style.backgroundColor = hotspot.classList.contains('active')
                    ? 'rgba(20, 184, 166, 0.25)' : 'rgba(148, 163, 184, 0.25)';
            } else {
                hotspot.style.transform = '';
                hotspot.style.boxShadow = '';
                hotspot.style.backgroundColor = '';
            }
        });
    }

    if (regionSearch) {
        regionSearch.addEventListener('input', e => filterRegions(e.target.value));
    }
    if (btnResetSearch) {
        btnResetSearch.addEventListener('click', () => {
            regionSearch.value = '';
            filterRegions('');
            regionSearch.focus();
        });
    }

    // --------------------------------------------------------
    // 모달 (서비스 준비 중 지역)
    // --------------------------------------------------------
    function openPreparingModal(regionName) {
        modalRegionName.textContent = regionName;
        requestEmail.value = '';
        preparingModal.showModal();
    }
    function closeModal() { preparingModal.close(); }

    hotspots.forEach(hotspot => {
        if (hotspot.classList.contains('inactive')) {
            hotspot.addEventListener('click', e => {
                e.preventDefault();
                openPreparingModal(hotspot.getAttribute('data-name'));
            });
        }
    });

    document.querySelectorAll('.region-card.inactive .btn-open-request').forEach(btn => {
        btn.addEventListener('click', e => {
            openPreparingModal(e.target.closest('.region-card').getAttribute('data-name'));
        });
    });

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (preparingModal) {
        preparingModal.addEventListener('click', e => {
            const r = preparingModal.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
                closeModal();
            }
        });
    }

    if (btnSubmitRequest) {
        btnSubmitRequest.addEventListener('click', () => {
            const email = requestEmail.value.trim();
            if (!email) { showToast('이메일 주소를 입력해 주세요.'); requestEmail.focus(); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('올바른 이메일 형식이 아닙니다.'); requestEmail.focus(); return;
            }
            showToast(`${modalRegionName.textContent} 알림 신청이 완료되었습니다!`);
            closeModal();
        });
    }

    // --------------------------------------------------------
    // 공유 버튼
    // --------------------------------------------------------
    if (btnShare) {
        btnShare.addEventListener('click', () => {
            const url = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url)
                    .then(() => showToast('포털 링크 주소가 복사되었습니다. 보호자들과 공유해 보세요!'))
                    .catch(() => fallbackCopy(url));
            } else {
                fallbackCopy(url);
            }
        });
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try {
            document.execCommand('copy');
            showToast('포털 링크 주소가 복사되었습니다!');
        } catch {
            showToast('링크 복사에 실패했습니다. 주소창의 주소를 복사해 주세요.');
        }
        document.body.removeChild(ta);
    }

    // --------------------------------------------------------
    // 메인 초기화 — window.PORTAL_DATA 읽기
    // --------------------------------------------------------
    function init() {
        const data = window.PORTAL_DATA;

        // portal-data.js 로드 실패 시 안내
        if (!data) {
            console.error('[Portal] window.PORTAL_DATA 를 찾을 수 없습니다. portal-data.js 가 로드되었는지 확인하세요.');
            if (skeletonLoader) skeletonLoader.remove();
            if (activeCountEl) activeCountEl.textContent = '로드 실패';
            return;
        }

        renderStatsBar(data);
        renderNews(data.news);
        renderRegionCards(data.regions);
        renderFooterFreshness(data.meta.lastUpdated);
    }

    init();
});
