document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // DOM Elements
    // --------------------------------------------------------
    const regionSearch = document.getElementById('regionSearch');
    const regionsGrid = document.getElementById('regionsGrid');
    const regionCards = document.querySelectorAll('.region-card');
    const searchEmptyState = document.getElementById('searchEmptyState');
    const btnResetSearch = document.getElementById('btnResetSearch');
    const btnShare = document.getElementById('btn-share');
    const toast = document.getElementById('toast');
    
    // Modal elements
    const preparingModal = document.getElementById('preparingModal');
    const modalRegionName = document.getElementById('modalRegionName');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnSubmitRequest = document.getElementById('btnSubmitRequest');
    const requestEmail = document.getElementById('requestEmail');
    
    // Map Hotspots
    const hotspots = document.querySelectorAll('.map-hotspot');

    // --------------------------------------------------------
    // Toast Notification System
    // --------------------------------------------------------
    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --------------------------------------------------------
    // Search / Filter System
    // --------------------------------------------------------
    function filterRegions(query) {
        const cleanQuery = query.trim().toLowerCase();
        let visibleCount = 0;
        
        regionCards.forEach(card => {
            const searchKeys = card.getAttribute('data-search-keys').toLowerCase();
            const isMatch = searchKeys.includes(cleanQuery);
            
            if (isMatch) {
                card.removeAttribute('hidden');
                visibleCount++;
            } else {
                card.setAttribute('hidden', '');
            }
        });

        // Toggle Empty State
        if (visibleCount === 0) {
            searchEmptyState.removeAttribute('hidden');
        } else {
            searchEmptyState.setAttribute('hidden', '');
        }

        // Sync with Map Hotspots (add highlight effect to active search match)
        hotspots.forEach(hotspot => {
            const regionName = hotspot.getAttribute('data-name');
            const cleanRegionName = regionName.toLowerCase();
            
            if (cleanQuery && (cleanRegionName.includes(cleanQuery) || cleanQuery.includes(cleanRegionName.replace('특별', '').replace('자치', '').replace('광역시', '').replace('도', '').replace('시', '')))) {
                hotspot.style.transform = 'translate(-50%, -50%) scale(1.18)';
                hotspot.style.boxShadow = '0 0 15px rgba(13, 148, 136, 0.4)';
                if (hotspot.classList.contains('active')) {
                    hotspot.style.backgroundColor = 'rgba(20, 184, 166, 0.25)';
                } else {
                    hotspot.style.backgroundColor = 'rgba(148, 163, 184, 0.25)';
                }
            } else {
                hotspot.style.transform = '';
                hotspot.style.boxShadow = '';
                hotspot.style.backgroundColor = '';
            }
        });
    }

    regionSearch.addEventListener('input', (e) => {
        filterRegions(e.target.value);
    });

    btnResetSearch.addEventListener('click', () => {
        regionSearch.value = '';
        filterRegions('');
        regionSearch.focus();
    });

    // --------------------------------------------------------
    // Dialog / Modal Logic (Preparing Regions)
    // --------------------------------------------------------
    function openPreparingModal(regionName) {
        modalRegionName.textContent = regionName;
        requestEmail.value = '';
        preparingModal.showModal();
    }

    function closeModal() {
        preparingModal.close();
    }

    // Hotspots Click Handler (for inactive ones)
    hotspots.forEach(hotspot => {
        if (hotspot.classList.contains('inactive')) {
            hotspot.addEventListener('click', (e) => {
                e.preventDefault();
                const name = hotspot.getAttribute('data-name');
                openPreparingModal(name);
            });
        }
    });

    // Card Click Handler (for inactive ones)
    document.querySelectorAll('.region-card.inactive .btn-open-request').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.region-card');
            const name = card.getAttribute('data-name');
            openPreparingModal(name);
        });
    });

    // Modal Close handlers
    btnCloseModal.addEventListener('click', closeModal);

    // Close on clicking backdrop
    preparingModal.addEventListener('click', (e) => {
        const dialogDimensions = preparingModal.getBoundingClientRect();
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            closeModal();
        }
    });

    // Submit Request Handler inside Modal
    btnSubmitRequest.addEventListener('click', () => {
        const emailValue = requestEmail.value.trim();
        if (!emailValue) {
            showToast('이메일 주소를 입력해 주세요.');
            requestEmail.focus();
            return;
        }

        // Basic email pattern check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
            showToast('올바른 이메일 형식이 아닙니다.');
            requestEmail.focus();
            return;
        }

        showToast(`${modalRegionName.textContent} 알림 신청이 완료되었습니다!`);
        closeModal();
    });

    // --------------------------------------------------------
    // Share Feature
    // --------------------------------------------------------
    if (btnShare) {
        btnShare.addEventListener('click', () => {
            const shareUrl = window.location.href;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl)
                    .then(() => {
                        showToast('포털 링크 주소가 복사되었습니다. 보호자들과 공유해 보세요!');
                    })
                    .catch(() => {
                        fallbackCopyText(shareUrl);
                    });
            } else {
                fallbackCopyText(shareUrl);
            }
        });
    }

    function fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            showToast('포털 링크 주소가 복사되었습니다. 보호자들과 공유해 보세요!');
        } catch (err) {
            showToast('링크 복사에 실패했습니다. 주소창의 주소를 복사해 주세요.');
        }

        document.body.removeChild(textArea);
    }
});
