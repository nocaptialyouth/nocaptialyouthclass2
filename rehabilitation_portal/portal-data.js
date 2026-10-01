/**
 * portal-data.js
 * 포털 마스터 데이터 파일 (v2.6)
 * 
 * ✅ 전국 15개 지역 연동 데이터 및 5대 대권역 / 특성화 필터 키워드 전면 보강
 * - news 배열 중 가장 최신 날짜가 홈페이지 상단 '데이터 기준일'로 자동 연동됩니다.
 * - 소식 카드를 클릭하면 상세 안내 모달이 열립니다.
 */
window.PORTAL_DATA = {

  meta: {
    lastUpdated: "2026-10-01",
    version: "2.6",
    totalRegions: 15,
    dataSource: "보건복지부, 건강보험심사평가원(HIRA), 근로복지공단 공공 데이터 실시간 교차 검증"
  },

  // ------------------------------------------------------------
  // 최신 소식 & 업데이트 데이터 (클릭 시 상세 모달 팝업 지원)
  // ------------------------------------------------------------
  news: [
    {
      id: "news-010",
      date: "2026-09-28",
      badge: "데이터 갱신",
      badgeType: "update",
      title: "2026년 하반기 전국 회복기 재활 간호간병통합서비스 병동 현황 동기화",
      desc: "간병비 부담을 최대 75%까지 줄여주는 전국 15개 지역 간호간병통합서비스 재활병동 운영 병원 데이터가 최신 인력 신고 기준으로 전면 갱신되었습니다.",
      region: "전국",
      targetUrl: "https://koreapmr.com/",
      detailHtml: `
        <p><strong>보건복지부 및 국민건강보험공단 2026년 3분기 인력 현황 연동 완료</strong></p>
        <p>재활 환자 보호자분들의 가장 큰 현실적 고민인 <strong>간병비 부담(월 400~450만 원 상당)</strong>을 건강보험 적용을 통해 <strong>월 100~130만 원 수준</strong>으로 대폭 낮출 수 있는 전국 간호간병통합서비스 재활병동 데이터가 일제 정비되었습니다.</p>
        <ul style="margin: 12px 0 16px 20px; line-height: 1.7;">
          <li><strong>수도권 (서울·경기·인천):</strong> 국립재활원, 서울재활병원, 명지춘혜병원 등 주요 회복기 병동 운영 정보 최신화</li>
          <li><strong>영남권 (부산·대구·울산·경남·경북):</strong> 동아대대신병원, 워커힐재활병원, 맥켄지일신기독병원 등 통합병동 가동 현황 반영</li>
          <li><strong>충청·호남·강원·제주권:</strong> 대전충남권역재활병원, 드림솔병원, 호남권역재활병원, 제주권역재활병원 등 간호간병 병상수 확인 완료</li>
        </ul>
        <div style="background:#f0fdfa; padding:14px; border-radius:8px; border-left:4px solid #0d9488; font-size:14px;">
          💡 <strong>보호자 이용 팁:</strong> 간호간병통합병동은 낙상 위험도 및 일상생활동작(MBI) 평가 결과에 따라 입원 우선순위가 결정되므로, 전원 전 진료의뢰서와 의무기록사본을 지참하여 사전 상담하시기 바랍니다.
        </div>
      `
    },
    {
      id: "news-009",
      date: "2026-09-15",
      badge: "시설 검증",
      badgeType: "update",
      title: "전국 첨단 로봇 보행 재활장비(로코맷·엔젤렉스 등) 보유 기관 교차 검증",
      desc: "뇌졸중 및 척수손상 환자의 조기 보행 회복을 돕는 첨단 외골격 로봇보행 재활치료기 구비 병원 정보가 포털 필터에 반영되었습니다.",
      region: "전국",
      targetUrl: "https://koreapmr.com/",
      detailHtml: `
        <p><strong>외골격 로봇 보행 및 상지 재활 치료 시스템 구비 현황 반영</strong></p>
        <p>보행 훈련 초기 능동 보행이 어려운 중증 편마비 환자의 고유수용감각 자극과 뇌가소성 증진을 위해 널리 사용되는 로봇 재활 시스템(Lokomat, Erigo, Angel Legs, Morning Walk 등)을 보유한 전국 주요 병원을 데이터베이스에 태깅 완료하였습니다.</p>
        <ul style="margin: 12px 0 16px 20px; line-height: 1.7;">
          <li>로봇 보행 훈련은 선별급여 적용으로 건강보험 본인부담률 완화 혜택이 적용됩니다.</li>
          <li>로봇 치료 전담 물리치료사 배치 여부 및 1:1 맞춤 세션 운영 기관을 집중 검증하였습니다.</li>
        </ul>
      `
    },
    {
      id: "news-008",
      date: "2026-08-20",
      badge: "공지",
      badgeType: "notice",
      title: "보건복지부 제3기 회복기 재활의료기관 지정 기준 및 90일 골든타임 안내",
      desc: "뇌손상·뇌경색 발병 후 90일 이내 입원 필수 규정 및 하루 최대 4시간 1:1 집중재활 건강보험 지원 혜택에 관한 가이드라인을 최신화하였습니다.",
      region: "전국",
      targetUrl: "https://koreapmr.com/",
      detailHtml: `
        <p><strong>수술 후 골든타임(기한) 내 전원 시 본인부담률 대폭 인하</strong></p>
        <p>보건복지부가 지정한 회복기 재활의료기관에 건강보험 혜택으로 집중 치료를 받기 위해서는 반드시 다음 기한 내에 입원해야 합니다.</p>
        <ul style="margin: 12px 0 16px 20px; line-height: 1.7;">
          <li><strong>뇌졸중 / 뇌손상:</strong> 발병일 또는 수술일로부터 <strong>90일 이내</strong> 입원 필수 (최대 180일 보장)</li>
          <li><strong>척수 손상:</strong> 발병일 또는 수술일로부터 <strong>180일 이내</strong> 입원 필수 (최대 2년 보장)</li>
          <li><strong>대퇴·골반·고관절 골절:</strong> 수술 후 <strong>30일 이내</strong> 입원 필수 (최대 30일 보장)</li>
        </ul>
      `
    },
    {
      id: "news-007",
      date: "2026-07-10",
      badge: "데이터 갱신",
      badgeType: "update",
      title: "부산광역시 동아대학교대신병원, 공식 명칭 변경 및 데이터 갱신 완료",
      desc: "동아대학교대신요양병원이 보건복지부 제3기 회복기 재활의료기관 지정 후 '동아대학교대신병원'으로 개칭됨에 따라 최신 정보를 반영하였습니다.",
      region: "부산광역시",
      targetUrl: "https://busan.koreapmr.com/",
      detailHtml: `
        <p><strong>동아대학교대신요양병원 ➡️ 동아대학교대신병원 공식 개칭</strong></p>
        <p>부산 서구 대신동에 위치한 동아대학교대신병원이 보건복지부 제3기 회복기 재활의료기관 지정 승격에 맞춰 병원급 의료기관으로 명칭 변경 절차를 완료하였습니다. 본 포털의 부산 지역 리스트 및 지도 바로가기 데이터에 최신 상태로 반영되었습니다.</p>
      `
    },
    {
      id: "news-006",
      date: "2026-07-09",
      badge: "신규 오픈",
      badgeType: "open",
      title: "충청북도 재활기관 검색 가이드 정식 서비스 오픈",
      desc: "청주, 충주, 제천 등 충청북도 11개 시·군의 재활의학과 및 회복기 재활병원 전문 데이터가 통합 연동되었습니다.",
      region: "충청북도",
      targetUrl: "https://chungbuk.koreapmr.com/",
      detailHtml: `
        <p><strong>충북 11개 시·군 맞춤 재활 안내 오픈</strong></p>
        <p>청주, 충주, 제천, 진천, 음성 등 충북 전역의 전문 재활의학과, 요양병원, 보건복지부 지정 회복기 재활병원 데이터가 단독 서브도메인(chungbuk.koreapmr.com)으로 오픈되었습니다.</p>
      `
    }
  ],

  // ------------------------------------------------------------
  // 보호자 필독 재활 전문 칼럼 (구글 애드센스 E-E-A-T 승인 핵심 콘텐츠)
  // ------------------------------------------------------------
  articles: [
    {
      id: "col-001",
      category: "재활 골든타임",
      tag: "필독 가이드",
      title: "뇌졸중·뇌출혈 골든타임 재활병원 선택 기준 & 90일 규정 총정리",
      readTime: "약 4분",
      summary: "급성기 대학병원 퇴원 후 일상 복귀를 좌우하는 발병 90일 이내 집중재활 기한, 1:1 도수·작업치료 4시간 건강보험 적용 요건 및 전원 체크리스트를 상세히 안내합니다.",
      contentHtml: `
        <h3>1. 뇌졸중 발병 후 90일, 왜 '골든타임'이라 부르는가?</h3>
        <p>뇌세포는 손상되면 완전히 재생되지 않지만, 손상된 부위 주변의 건강한 뇌세포가 새로운 신경망을 형성하여 기능을 대신하는 <strong>'뇌가소성(Neuroplasticity)'</strong> 기전이 발병 후 첫 3~6개월 동안 가장 폭발적으로 일어납니다. 특히 초기 90일간 집중적인 물리·작업치료를 얼마나 밀도 있게 받느냐가 평생 보행 가능 여부와 독립적인 일상 복귀 확률을 결정합니다.</p>
        
        <h3>2. 보건복지부 지정 '회복기 재활의료기관'의 특별한 혜택</h3>
        <p>일반 요양병원이나 일반 병원에서는 건강보험 규제상 하루 받을 수 있는 물리치료 시간에 제한이 있습니다. 반면 정부가 엄격한 시설·인력(전문의 1인당 환자 수, 물리·작업치료사 비율)을 심사해 지정한 '회복기 재활의료기관'은 다음과 같은 독보적 혜택을 제공합니다.</p>
        <ul>
          <li><strong>하루 최대 4시간 1:1 맞춤 집중 재활 치료 지원:</strong> 단순 온열·전기 치료가 아닌 중추신경계 발달재활(Bobath, PNF), 매트 훈련, 보행 훈련을 하루 종일 집중적으로 받습니다.</li>
          <li><strong>건강보험 수가 적용으로 진료비 대폭 절감:</strong> 산정특례 및 집중재활 수가 적용으로 상급종합병원 대비 환자 부담금이 합리적입니다.</li>
          <li><strong>퇴원 지원 및 지역사회 연계팀 운영:</strong> 퇴원 전 사회복지사와 작업치료사가 환자의 자택을 방문해 문턱 제거, 안전 손잡이 설치 등 주거환경 개선까지 맞춤 지원합니다.</li>
        </ul>

        <h3>3. 입원 골든타임(기한)을 놓치면 안 되는 이유</h3>
        <p>가장 주의하셔야 할 점은 <strong>'발병일 또는 수술일로부터 90일 이내'</strong>에 회복기 재활병원에 입원해야만 이 모든 집중재활 혜택을 최장 180일까지 보장받을 수 있다는 점입니다. 90일이 지나면 일반 만성 요양병원으로 분류되어 하루 치료 가능 시간이 대폭 축소될 수 있습니다.</p>

        <h3>4. 대학병원 퇴원 전 미리 준비할 필수 서류</h3>
        <ul>
          <li>진료의뢰서 (회복기 재활 치료 요망 명시)</li>
          <li>입원 기간 전체 의무기록사본 (경과기록지, 간호초진기록지, 퇴원요약지)</li>
          <li>검사 결과지 (Brain CT / MRI 판독지, 혈액검사 결과지)</li>
          <li>기능평가 결과지 (K-MBI 일상생활동작평가, MMSE 인지기능평가 등)</li>
          <li>영상 CD (CT/MRI 복사본) 및 복약 처방전</li>
        </ul>
      `
    },
    {
      id: "col-002",
      category: "간병비 절감",
      tag: "경제적 팁",
      title: "간호간병통합서비스 재활병원 간병비 절감 계산 & 현명한 입원 팁",
      readTime: "약 3분",
      summary: "개인 간병인 고용 시 월 400~450만 원에 달하는 간병비 부담을 월 100~130만 원으로 대폭 줄여주는 간호간병통합서비스의 입원 자격과 병동 선택 요령을 정리합니다.",
      contentHtml: `
        <h3>1. 치솟는 사설 간병비, 대안은 '간호간병통합서비스'</h3>
        <p>최근 24시간 개인 간병인을 고용할 경우 일당 13~15만 원에 식대, 유급 휴일 비용까지 합쳐지면 <strong>월 400만~450만 원</strong>의 순수 간병비가 발생합니다. 수개월 이상 지속되는 재활 기간 동안 이는 일반 가정에 파산에 가까운 경제적 재난이 됩니다.</p>
        <p><strong>간호간병통합서비스 재활병동</strong>은 전문 간호사와 간호조무사, 병동 지원인력이 팀을 이루어 24시간 환자의 위생, 식사, 체위 변경, 투약, 낙상 예방을 전담하며, 건강보험이 적용되어 <strong>간병비 포함 본인부담금이 월 100만~130만 원 선</strong>으로 대폭 절감됩니다.</p>

        <h3>2. 모든 환자가 무조건 입원할 수 있을까? (선정 기준)</h3>
        <p>간호간병통합병동은 전담 간호 인력이 여러 환자를 체계적으로 순회 케어하는 구조입니다. 따라서 다음 조건에 해당하는 환자분들의 입원이 적극 권장됩니다.</p>
        <ul>
          <li>스스로 벨을 눌러 의사 표현이 가능하거나 보조를 받아 휠체어 탑승이 가능한 환자</li>
          <li>치료에 대한 재활 의지가 있고 섬망(환각, 폭력성, 야간 배회) 증상이 조절되는 환자</li>
          <li>욕창 단계가 깊지 않고 인공호흡기 등 특수 중환자 장비가 필요 없는 환자</li>
        </ul>

        <h3>3. 보호자가 입원 전 반드시 병원에 확인할 3가지 체크리스트</h3>
        <ol>
          <li><strong>병동 전담 간호사 대 환자 비율:</strong> 1:5 또는 1:6 이하의 우수 인력 등급을 유지하는지 확인</li>
          <li><strong>치료실 이동 동선 지원:</strong> 병실에서 물리치료실, 작업치료실로 이동할 때 이송 전담 인력이 체계적으로 보조하는지 점검</li>
          <li><strong>낙상 방지 안전 인프라:</strong> 저상형 전동 침대, 낙상 감지 센서 매트, 안전 바가 병동 복도 전체에 완비되어 있는지 확인</li>
        </ol>
      `
    },
    {
      id: "col-003",
      category: "병원 비교",
      tag: "필수 상식",
      title: "보건복지부 지정 회복기 재활의료기관 vs 일반 요양병원 5가지 핵심 차이",
      readTime: "약 4분",
      summary: "환자의 회복 속도와 퇴원 확률을 가르는 회복기 재활의료기관과 일반 요양병원의 의사/치료사 인력 기준, 일일 치료 시간, 간병 시스템을 객관적으로 비교합니다.",
      contentHtml: `
        <h3>1. 제도의 설립 목적부터 완전히 다릅니다</h3>
        <p>많은 보호자분들께서 '재활'이라는 단어가 붙은 일반 요양병원과 보건복지부가 지정한 '회복기 재활의료기관'의 차이를 혼동하십니다. 두 기관은 법적 지위와 목적 자체가 완전히 상이합니다.</p>
        
        <div style="overflow-x:auto; margin:16px 0;">
          <table style="width:100%; border-collapse:collapse; font-size:14px; text-align:left;">
            <thead>
              <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
                <th style="padding:10px;">비교 항목</th>
                <th style="padding:10px; color:#0d9488;">복지부 지정 회복기 재활병원</th>
                <th style="padding:10px; color:#64748b;">일반 재활 요양병원</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">설립 목적</td>
                <td style="padding:10px; color:#0d9488;">수술 후 일상 복귀 및 자택 퇴원</td>
                <td style="padding:10px;">장기 요양 및 만성 질환 돌봄 케어</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">1일 1:1 치료 시간</td>
                <td style="padding:10px; color:#0d9488;"><strong>하루 최대 4시간</strong> 집중 재활</td>
                <td style="padding:10px;">하루 1~2시간 내외 기본 치료</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">전문의 인력 기준</td>
                <td style="padding:10px; color:#0d9488;">재활의학과 전문의 3인 이상 상주</td>
                <td style="padding:10px;">가정의학과, 내과, 한방 등 다양</td>
              </tr>
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:10px; font-weight:bold;">간병 서비스</td>
                <td style="padding:10px; color:#0d9488;">간호간병통합서비스 병동 다수 운영</td>
                <td style="padding:10px;">공동 간병(1:4~1:8) 또는 개인 간병</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2. 어떤 환자가 어디로 가야 할까요?</h3>
        <p><strong>수술 후 3개월 이내이며 보행이나 일상 기능 회복 의지가 뚜렷한 환자</strong>는 반드시 <strong>'회복기 재활의료기관'</strong>으로 입원하셔야 골든타임을 허비하지 않습니다. 반면, 급성기 치료가 끝난 후 1년 이상 경과하여 현 상태 유지가 목적이거나 의학적 투약 관리가 주 목적인 만성기 환자분은 <strong>'재활 요양병원'</strong>이 적합합니다.</p>
      `
    },
    {
      id: "col-004",
      category: "보험 가이드",
      tag: "산재/자보",
      title: "산재보험 및 자동차보험 승인 환자를 위한 집중재활 지정병원 이용 요령",
      readTime: "약 3분",
      summary: "산업재해 승인 환자를 위한 근로복지공단 재활인증의료기관 혜택과 교통사고 후 자보 집중재활의학과 선택 기준을 알기 쉽게 해설합니다.",
      contentHtml: `
        <h3>1. 산업재해 승인 환자: '근로복지공단 재활인증병원'을 찾아야 하는 이유</h3>
        <p>업무상 재해로 뇌출혈, 척수 손상, 복합 골절을 겪으신 산재 근로자분들은 일반 병원이 아닌 근로복지공단이 심사하여 선정한 <strong>'산재보험 재활인증의료기관'</strong>을 이용하셔야 본인 부담금 없이 전문 재활 치료와 사회 복귀 프로그램을 온전히 지원받을 수 있습니다.</p>
        <ul>
          <li><strong>비급여 전문 재활 수가 산재 지원:</strong> 로봇 보행 재활, 수중 재활 등 고가 비급여 치료 항목이 산재 승인 범위 내에서 전액 지원됩니다.</li>
          <li><strong>직장 복귀 맞춤형 집중 훈련:</strong> 작업능력평가 및 직무 복귀를 위한 신체기능 모의 훈련 세션이 무료 연계됩니다.</li>
        </ul>

        <h3>2. 자동차보험 환자: 자보 환자 전원 시 필수 체크사항</h3>
        <p>교통사고로 인한 외상성 뇌손상(TBI), 척수 손상 환자분은 자동차보험 지급보증을 통해 1:1 재활치료를 받을 수 있습니다. 이때 해당 병원에 <strong>'재활의학과 전문의'</strong>가 상주하며 상급종합병원과 동급 수준의 물리/작업/인지치료실 인프라를 갖추었는지 사전에 확인하는 것이 원활한 합의 및 신체 장해율 최소화에 매우 중요합니다.</p>
      `
    }
  ],

  // ------------------------------------------------------------
  // 15개 지역 연동 데이터 (대권역 및 특성화 태그 완비)
  // ------------------------------------------------------------
  regions: [
    {
      id: "seoul",
      name: "서울특별시",
      zone: "sudogwon",
      zoneName: "수도권",
      url: "https://seoul.koreapmr.com/",
      status: "active",
      count: 120,
      searchKeys: "서울 서울특별시 seoul 수도권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 국립재활원 명지춘혜 서울재활",
      tags: ["복지부 제3기 회복기 7개소", "간호간병통합 운영", "로봇보행 치료실", "산재 인증기관"],
      desc: "서울 25개 자치구 국립재활원, 명지춘혜병원 등 보건복지부 지정 회복기 재활병원 및 뇌졸중 집중 치료 기관 총망라.",
      highlight: "회복기 우수"
    },
    {
      id: "gyeonggi",
      name: "경기도",
      zone: "sudogwon",
      zoneName: "수도권",
      url: "https://gyeonggido.koreapmr.com/",
      status: "active",
      count: 200,
      searchKeys: "경기 경기도 gyeonggi 수도권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 수원 고양 성남 용인 부천 안산 남양주 안양 화성 평택",
      tags: ["복지부 지정 회복기 10개소", "간호간병통합 가동", "로봇보행 치료실", "도내 200개 이상"],
      desc: "수원, 성남, 고양, 용인 등 경기 29개 시·군 내 간호간병통합서비스 및 복지부 지정 회복기 기관 상세 안내.",
      highlight: "최대 수록"
    },
    {
      id: "incheon",
      name: "인천광역시",
      zone: "sudogwon",
      zoneName: "수도권",
      url: "https://incheon.koreapmr.com/",
      status: "active",
      count: 63,
      searchKeys: "인천 인천광역시 incheon 수도권 회복기 회복기재활 간호간병 산재자보 산재 부평 남동 연수 미추홀 계양 서구",
      tags: ["복지부 지정 회복기 2개소", "간호간병통합 운영", "산재 인증 전문기관"],
      desc: "부평, 남동, 연수 등 인천 10개 군·구 내 보건복지부 지정 회복기 기관 및 산재 인증 전문 재활시설 검색.",
      highlight: ""
    },
    {
      id: "busan",
      name: "부산광역시",
      zone: "yeongnam",
      zoneName: "영남권",
      url: "https://busan.koreapmr.com/",
      status: "active",
      count: 146,
      searchKeys: "부산 부산광역시 busan 영남권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 해운대 부산진구 동래구 동아대대신 워커힐 맥켄지",
      tags: ["복지부 지정 회복기 6개소", "간호간병통합 운영", "로봇보행 치료실", "동아대대신병원 반영"],
      desc: "부산 권역별 146개 전문 재활병원 및 집중 1:1 재활치료 가능 회복기·요양병원 정보를 빠르게 검색할 수 있습니다.",
      highlight: "회복기 우수"
    },
    {
      id: "daegu",
      name: "대구광역시",
      zone: "yeongnam",
      zoneName: "영남권",
      url: "https://daegu.koreapmr.com/",
      status: "active",
      count: 78,
      searchKeys: "대구 대구광역시 daegu 영남권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 수성구 달서구 중구 동구 남산병원",
      tags: ["복지부 지정 회복기 5개소", "간호간병통합 가동", "로봇보행 치료실", "산재 재활인증"],
      desc: "대구 내 9개 구·군 재활의학과 전문의 상주 병원 및 보건복지부 지정 회복기 재활병원 데이터가 연동되어 있습니다.",
      highlight: "회복기 다수"
    },
    {
      id: "ulsan",
      name: "울산광역시",
      zone: "yeongnam",
      zoneName: "영남권",
      url: "https://ulsan.koreapmr.com/",
      status: "active",
      count: 52,
      searchKeys: "울산 울산광역시 ulsan 영남권 회복기 회복기재활 간호간병 산재자보 산재 남구 중구 북구 울주군 근로복지공단울산병원",
      tags: ["근로복지공단 산재인증", "전문재활 간호간병", "산재·자보 인증본원"],
      desc: "울산 관내 재활의학과 전문의 상주 병원 및 산재보험/자동차보험 집중 치료실 보유 여부를 바로 확인하실 수 있습니다.",
      highlight: "산재 특화"
    },
    {
      id: "gyeongnam",
      name: "경상남도",
      zone: "yeongnam",
      zoneName: "영남권",
      url: "https://gyeongnam.koreapmr.com/",
      status: "active",
      count: 95,
      searchKeys: "경남 경상남도 gyeongnam 영남권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 창원 김해 양산 진주 양산부산대병원",
      tags: ["복지부 지정 회복기 4개소", "간호간병통합 운영", "로봇치료실 구비", "김해·양산 연동"],
      desc: "창원, 김해, 양산 등 경상남도 시·군 지역 내 최적의 재활 치료실 및 대학병원 전원 협력 기관 검색.",
      highlight: ""
    },
    {
      id: "gyeongbuk",
      name: "경상북도",
      zone: "yeongnam",
      zoneName: "영남권",
      url: "https://gyeongbuk.koreapmr.com/",
      status: "active",
      count: 88,
      searchKeys: "경북 경상북도 gyeongbuk 영남권 회복기 회복기재활 간호간병 산재자보 산재 포항 구미 경산 안동 울릉도",
      tags: ["복지부 지정 회복기", "간호간병 운영", "울릉도 연계 가이드", "산재 인증기관"],
      desc: "포항, 구미, 경산, 안동 등 경상북도 시·군 지역 내 회복기 집중재활 및 간호간병 서비스 병원 검색.",
      highlight: ""
    },
    {
      id: "chungnam",
      name: "대전·충청남도",
      zone: "chungcheong",
      zoneName: "충청·세종권",
      url: "https://chungnamdaejeon.koreapmr.com/",
      status: "active",
      count: 70,
      searchKeys: "충남 충청남도 대전 대전광역시 chungnam daejeon 충청권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 대전충남권역재활",
      tags: ["대전충남권역재활 연동", "복지부 지정 회복기 3개소", "간호간병통합", "로봇치료실"],
      desc: "대전 및 충남 전역의 권역재활병원, 보건복지부 지정 회복기 재활기관 정보가 실시간 연동되어 있습니다.",
      highlight: "권역재활 연동"
    },
    {
      id: "chungbuk",
      name: "충청북도",
      zone: "chungcheong",
      zoneName: "충청·세종권",
      url: "https://chungbuk.koreapmr.com/",
      status: "active",
      count: 41,
      searchKeys: "충북 충청북도 chungbuk 충청권 회복기 회복기재활 간호간병 산재자보 산재 청주 충주 제천 진천 음성",
      tags: ["복지부 지정 회복기", "간호간병통합 가동", "충북 11개 시군 망라"],
      desc: "청주, 충주, 제천 등 충청북도 11개 시·군 내 최적의 재활 치료실 보유 병원 및 요양기관 데이터.",
      highlight: ""
    },
    {
      id: "sejong",
      name: "세종특별자치시",
      zone: "chungcheong",
      zoneName: "충청·세종권",
      url: "https://sejong.koreapmr.com/",
      status: "active",
      count: 18,
      searchKeys: "세종 세종시 세종특별자치시 sejong 충청권 간호간병 요양병원 통원재활",
      tags: ["통원 1:1 재활클리닉", "대전·충청권 전원 연계", "요양병원 안내"],
      desc: "세종 관내 요양병원 및 통원 1:1 재활 클리닉, 인근 대전·충청권 전원 연계 병원 안내.",
      highlight: ""
    },
    {
      id: "jeonnam",
      name: "광주·전라남도",
      zone: "honam",
      zoneName: "호남권",
      url: "https://jeonnamgwangju.koreapmr.com/",
      status: "active",
      count: 62,
      searchKeys: "전남 전라남도 광주 광주광역시 jeonnam gwangju 호남권 회복기 회복기재활 간호간병 로봇재활 로봇 산재자보 산재 광주365 호남권역재활 우암병원",
      tags: ["호남권역재활 연동", "복지부 지정 회복기 3개소", "로봇보행 치료실", "간호간병통합"],
      desc: "광주365재활병원, 호남권역재활병원, 우암병원 등 전라·광주 관내 핵심 회복기 재활병원 집중 안내.",
      highlight: "회복기 다수"
    },
    {
      id: "jeonbuk",
      name: "전북특별자치도",
      zone: "honam",
      zoneName: "호남권",
      url: "https://jeonbuk.koreapmr.com/",
      status: "active",
      count: 55,
      searchKeys: "전북 전북특별자치도 전라북도 jeonbuk 호남권 회복기 회복기재활 간호간병 산재자보 산재 전주 익산 군산 드림솔 예수병원",
      tags: ["드림솔병원 회복기 지정", "산재 인증 재활병원", "간호간병통합 운영"],
      desc: "드림솔병원(회복기 지정), 예수병원·전주병원(산재 인증) 및 전북 관내 55개 전문 기관 안내.",
      highlight: ""
    },
    {
      id: "gangwon",
      name: "강원특별자치도",
      zone: "gangwonjeju",
      zoneName: "강원·제주권",
      url: "https://gangwonstate.koreapmr.com/",
      status: "active",
      count: 45,
      searchKeys: "강원 강원도 강원특별자치도 gangwon 강원권 회복기 회복기재활 간호간병 산재자보 산재 춘천 원주 강릉 강원권역재활",
      tags: ["강원권역재활 연동", "복지부 지정 회복기", "간호간병통합", "산재 인증기관"],
      desc: "춘천, 원주, 강릉 등 강원특별자치도 18개 시·군 내 최적의 1:1 집중 재활 치료실 및 요양병원 정보.",
      highlight: ""
    },
    {
      id: "jeju",
      name: "제주특별자치도",
      zone: "gangwonjeju",
      zoneName: "강원·제주권",
      url: "https://jeju.koreapmr.com/",
      status: "active",
      count: 22,
      searchKeys: "제주 제주도 제주특별자치도 jeju 제주권 회복기 회복기재활 간호간병 산재자보 제주시 서귀포 제주대병원 제주권역재활",
      tags: ["제주권역재활병원(회복기)", "간호간병통합 운영", "도내 재활기관 망라"],
      desc: "제주권역재활병원(복지부 지정 회복기), 제주대병원 및 서귀포 지역 특화 요양병원 등 제주 관내 데이터 연동.",
      highlight: ""
    }
  ]

};
