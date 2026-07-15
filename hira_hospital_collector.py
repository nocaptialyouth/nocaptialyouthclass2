#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
전국 소아청소년과 / 산부인과(여성의원·여성병원 포함) 전문의 등록기관 전체 수집 스크립트
데이터 출처: 건강보험심사평가원(HIRA) "병원정보서비스" 오픈API (공공데이터포털 data.go.kr 제공)

=====================================================================
사용 전 준비 (딱 3단계)
=====================================================================
1) https://www.data.go.kr 회원가입 후 로그인
2) "건강보험심사평가원_병원정보서비스" 검색 → [활용신청] 클릭
   - 활용목적: 개인 연구/조사 등으로 간단히 기재하면 대부분 자동승인됩니다.
   - 승인 즉시(보통 몇 분~몇 시간 내) "마이페이지 > 오픈API > 활용신청 현황"에서
     발급받은 인증키(서비스키, Encoding/Decoding 둘 다 있음)를 확인할 수 있습니다.
3) 아래 SERVICE_KEY 변수에 발급받은 "Decoding" 키를 붙여넣고 실행하세요.

   실행 방법:
     pip install requests pandas openpyxl
     python hira_hospital_collector.py

=====================================================================
중요 안내
=====================================================================
- 진료과목코드(dgsbjtCd)는 "10=산부인과", "11=소아청소년과"로 일반적으로 알려진 값을
  기본 사용합니다. 다만 심평원이 코드를 개정할 수 있으므로, 결과 건수가 0이거나
  이상하게 적게 나오면 아래 링크에서 최신 코드를 확인 후 CONFIG의 DEPT_CODES 값을
  수정해 주세요.
  → 보건의료빅데이터개방시스템(opendata.hira.or.kr) > 서비스소개 > 용어설명 > 코드조회
- 코드값 오류에 대비해 "기관명에 소아과/산부인과/여성의원/여성병원 등 키워드가
  포함되는지"도 함께 표시해 이중 확인(교차검증)이 가능하도록 만들었습니다.
- 케이닥(Kdoc), 대한산부인과학회(sgo.or.kr) 등 민간/학회 사이트는 대량 다운로드용
  공개 API가 없고 이용약관상 자동 스크래핑이 제한되는 경우가 많아 이 스크립트에는
  포함하지 않았습니다. 정부 공식 데이터(심평원)가 "전문의 등록" 여부를 판단하는
  가장 신뢰도 높은 출처입니다.
"""

import time
import sys
import requests
import pandas as pd

# =====================================================================
# CONFIG - 여기만 수정하면 됩니다
# =====================================================================
SERVICE_KEY = "여기에_data.go.kr에서_발급받은_인증키(Decoding)를_붙여넣으세요"

# 심평원 병원정보서비스 (병원급 이상 + 의원급 포함 전체)
BASE_URL = "http://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList1"

# 조회할 진료과목코드 : 10=산부인과, 11=소아청소년과
# (코드가 바뀐 경우 opendata.hira.or.kr 코드조회에서 확인 후 수정)
DEPT_CODES = {
    "10": "산부인과",
    "11": "소아청소년과",
}

# 이름 기반 교차검증용 키워드 (여성의원/여성병원 등 명칭도 함께 표시)
NAME_KEYWORDS = ["소아", "산부인과", "부인과", "여성의원", "여성병원", "여성클리닉"]

NUM_OF_ROWS = 1000       # 한 페이지당 요청 건수(최대치 근처로 설정, API 허용범위 확인 필요)
SLEEP_SEC = 0.3          # 호출 간 대기시간(과도한 트래픽 방지)
OUTPUT_XLSX = "전국_소아청소년과_산부인과_전문의등록기관.xlsx"
OUTPUT_CSV = "전국_소아청소년과_산부인과_전문의등록기관.csv"

# =====================================================================
# 수집 로직
# =====================================================================

def fetch_page(dgsbjt_cd: str, page_no: int) -> dict:
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": page_no,
        "numOfRows": NUM_OF_ROWS,
        "dgsbjtCd": dgsbjt_cd,
        "_type": "json",
    }
    resp = requests.get(BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    try:
        return resp.json()
    except ValueError:
        # 서비스키 오류 등으로 XML 에러 메시지가 돌아온 경우
        print("⚠️ JSON 파싱 실패. 응답 원문 일부:", resp.text[:500])
        raise


def collect_department(dgsbjt_cd: str, dept_name: str) -> list:
    print(f"\n=== [{dept_name}] (dgsbjtCd={dgsbjt_cd}) 수집 시작 ===")
    all_rows = []
    page_no = 1

    first = fetch_page(dgsbjt_cd, page_no)
    header = first.get("response", {}).get("header", {})
    if header.get("resultCode") not in ("00", "0", None):
        print(f"❌ API 에러: {header}")
        return []

    body = first.get("response", {}).get("body", {})
    total_count = body.get("totalCount", 0)
    print(f"총 {total_count}건 확인됨")

    if total_count == 0:
        print("⚠️ 0건입니다. dgsbjtCd 코드가 최신 코드표와 일치하는지 확인해 주세요.")
        return []

    items = body.get("items", {})
    rows = items.get("item", []) if items else []
    if isinstance(rows, dict):  # 결과가 1건일 때 dict로 오는 경우 방지
        rows = [rows]
    all_rows.extend(rows)

    total_pages = (total_count // NUM_OF_ROWS) + (1 if total_count % NUM_OF_ROWS else 0)
    print(f"페이지 1/{total_pages} 수집 완료 ({len(rows)}건)")

    for page_no in range(2, total_pages + 1):
        time.sleep(SLEEP_SEC)
        data = fetch_page(dgsbjt_cd, page_no)
        body = data.get("response", {}).get("body", {})
        items = body.get("items", {})
        rows = items.get("item", []) if items else []
        if isinstance(rows, dict):
            rows = [rows]
        all_rows.extend(rows)
        print(f"페이지 {page_no}/{total_pages} 수집 완료 ({len(rows)}건, 누적 {len(all_rows)}건)")

    for r in all_rows:
        r["진료과목_조회기준"] = dept_name

    return all_rows


def main():
    if "여기에" in SERVICE_KEY:
        print("❌ SERVICE_KEY를 먼저 설정해 주세요. (data.go.kr에서 발급받은 인증키)")
        sys.exit(1)

    all_data = []
    for code, name in DEPT_CODES.items():
        all_data.extend(collect_department(code, name))

    if not all_data:
        print("\n수집된 데이터가 없습니다. SERVICE_KEY 또는 dgsbjtCd 값을 확인해 주세요.")
        sys.exit(1)

    df = pd.DataFrame(all_data)

    # 기관코드(ykiho) 기준 중복 제거하되, 두 과목 모두 해당하는 경우 표시를 합쳐줌
    if "ykiho" in df.columns:
        dup_map = (
            df.groupby("ykiho")["진료과목_조회기준"]
            .apply(lambda s: ", ".join(sorted(set(s))))
            .to_dict()
        )
        df = df.drop_duplicates(subset="ykiho", keep="first").copy()
        df["진료과목_조회기준"] = df["ykiho"].map(dup_map)

    # 이름 기반 교차검증 컬럼 추가
    if "yadmNm" in df.columns:
        df["이름기반_키워드매칭"] = df["yadmNm"].apply(
            lambda x: ", ".join([kw for kw in NAME_KEYWORDS if kw in str(x)])
        )

    # 보기 좋은 컬럼 순서로 정리 (존재하는 컬럼만)
    preferred_cols = [
        "yadmNm", "진료과목_조회기준", "clCdNm", "sidoCdNm", "sgguCdNm",
        "addr", "telno", "hospUrl", "estbDd", "drTotCnt",
        "이름기반_키워드매칭", "ykiho", "XPos", "YPos",
    ]
    cols = [c for c in preferred_cols if c in df.columns] + \
           [c for c in df.columns if c not in preferred_cols]
    df = df[cols]

    df.to_excel(OUTPUT_XLSX, index=False)
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")

    print(f"\n✅ 완료! 총 {len(df)}개 기관(중복제거 후)")
    print(f"   - {OUTPUT_XLSX}")
    print(f"   - {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
