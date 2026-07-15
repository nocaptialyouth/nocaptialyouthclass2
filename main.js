// 스크롤 애니메이션
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// 카드 애니메이션 초기화
document.querySelectorAll('.region-card, .dept-card, .guide-step, .resource-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s, border-color 0.3s, box-shadow 0.3s, background 0.3s`;
  observer.observe(el);
});

// 헤더 스크롤 효과
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  if (header) {
    if (window.scrollY > 50) {
      header.style.borderBottomColor = 'rgba(232,84,122,0.2)';
    } else {
      header.style.borderBottomColor = 'rgba(255,255,255,0.08)';
    }
  }
});

console.log('여성·소아 의료기관 안내 사이트가 로드되었습니다.');
