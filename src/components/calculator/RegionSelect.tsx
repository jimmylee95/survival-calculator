'use client'

import { useState } from 'react'

const ACCENT = '#1A1F5E'

export const SIDO_LIST = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
] as const

export const DISTRICTS: Record<string, string[]> = {
  서울: [
    '강남구', '서초구', '마포구', '용산구', '성동구', '강서구', '송파구',
    '영등포구', '중구', '종로구', '동대문구', '성북구', '강북구', '도봉구',
    '노원구', '은평구', '관악구', '동작구', '금천구', '구로구', '양천구',
    '광진구', '중랑구', '강동구', '서대문구',
  ],
  경기: [
    '수원시', '성남시', '고양시', '용인시', '부천시', '안산시', '안양시',
    '남양주시', '화성시', '평택시', '의정부시', '시흥시', '파주시', '김포시',
    '광명시', '광주시', '군포시', '이천시', '양주시', '오산시', '구리시',
    '안성시', '포천시', '의왕시', '하남시', '여주시', '동두천시', '과천시',
  ],
  인천: [
    '중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구',
    '강화군', '옹진군',
  ],
  부산: [
    '중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구',
    '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군',
  ],
  대구: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  대전: ['중구', '동구', '서구', '유성구', '대덕구'],
  광주: ['동구', '서구', '남구', '북구', '광산구'],
  울산: ['중구', '남구', '동구', '북구', '울주군'],
  세종: [
    '조치원읍', '한솔동', '새롬동', '도담동', '아름동',
    '종촌동', '고운동', '보람동', '대평동', '소담동',
  ],
  강원: [
    '춘천시', '원주시', '강릉시', '동해시', '속초시', '삼척시', '태백시',
    '평창군', '홍천군', '횡성군', '영월군', '정선군', '철원군', '인제군',
    '고성군', '양양군', '양구군', '화천군',
  ],
  충북: [
    '청주시', '충주시', '제천시', '보은군', '옥천군', '영동군',
    '진천군', '괴산군', '음성군', '단양군', '증평군',
  ],
  충남: [
    '천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시',
    '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군',
  ],
  전북: [
    '전주시', '군산시', '익산시', '정읍시', '남원시', '김제시',
    '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군',
  ],
  전남: [
    '목포시', '여수시', '순천시', '나주시', '광양시',
    '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군',
    '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군',
    '완도군', '진도군', '신안군',
  ],
  경북: [
    '포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시',
    '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군',
    '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군',
    '울진군', '울릉군',
  ],
  경남: [
    '창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시',
    '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군',
    '산청군', '함양군', '거창군', '합천군',
  ],
  제주: ['제주시', '서귀포시'],
}

export function RegionSelect({
  region,
  district,
  onChange,
  onNext,
}: {
  region:   string
  district: string
  onChange: (region: string, district: string) => void
  onNext:   () => void
}) {
  const [selectedSido, setSelectedSido] = useState(region || '')

  function handleSido(sido: string) {
    setSelectedSido(sido)
    // 시/도 변경 시 이전 시/군/구 초기화
    onChange(sido, '')
  }

  function handleDistrict(d: string) {
    onChange(selectedSido, d)
    setTimeout(onNext, 220)
  }

  return (
    <div>
      {/* 시/도 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', margin: '0 0 10px', letterSpacing: '0.3px' }}>
          시 / 도
        </p>
        <div style={{
          display: 'flex', gap: 8,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '2px 0 6px',
          scrollbarWidth: 'none',
        }}>
          {SIDO_LIST.map(sido => {
            const sel = sido === selectedSido
            return (
              <button
                key={sido}
                type="button"
                onClick={() => handleSido(sido)}
                style={{
                  flexShrink:   0,
                  padding:      '9px 16px',
                  borderRadius: 22,
                  border:       `1.5px solid ${sel ? ACCENT : '#E2E8F0'}`,
                  background:   sel ? ACCENT : '#fff',
                  color:        sel ? '#fff' : '#475569',
                  fontSize:     13,
                  fontWeight:   700,
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  transition:   'all 0.15s',
                }}
              >
                {sido}
              </button>
            )
          })}
        </div>
      </div>

      {/* 시/군/구 */}
      {selectedSido && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', margin: '0 0 10px', letterSpacing: '0.3px' }}>
            시 / 군 / 구
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {(DISTRICTS[selectedSido] ?? []).map(d => {
              const sel = d === district && selectedSido === region
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDistrict(d)}
                  style={{
                    padding:      '12px 6px',
                    minHeight:    44,
                    borderRadius: 12,
                    border:       `1.5px solid ${sel ? ACCENT : '#E2E8F0'}`,
                    background:   sel ? `${ACCENT}0F` : '#fff',
                    color:        sel ? ACCENT : '#1A1F5E',
                    fontSize:     13,
                    fontWeight:   800,
                    cursor:       'pointer',
                    textAlign:    'center',
                    wordBreak:    'keep-all',
                    transition:   'all 0.15s',
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
