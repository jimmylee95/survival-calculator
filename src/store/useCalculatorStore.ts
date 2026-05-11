import { create } from 'zustand'
import {
  calculateBusinessRunway,
  calculateFreelancerRunway,
  type BusinessInput,
  type FreelancerInput,
  type CalcResult,
} from '@/utils/calculate'
import { defaultStorage, type StorageAdapter } from './storage'

// ── 저장 대상 상태 (storage에 persist될 필드) ─────────────
interface PersistedState {
  mode:            'business' | 'freelancer'
  businessInput:   BusinessInput
  freelancerInput: FreelancerInput
}

// ── 전체 스토어 타입 ──────────────────────────────────────
interface CalculatorState extends PersistedState {
  result:      CalcResult | null
  lastUpdated: Date | null
  _hydrated:   boolean // localStorage 로딩 완료 여부

  // 액션
  setMode:               (mode: 'business' | 'freelancer') => void
  updateBusinessInput:   (partial: Partial<BusinessInput>) => void
  updateFreelancerInput: (partial: Partial<FreelancerInput>) => void
  calculate:             () => void
  reset:                 () => void

  // 내부 — 어댑터 교체용
  _setStorage: (adapter: StorageAdapter) => void
  _hydrate:    () => Promise<void>
}

// ── 기본값 ────────────────────────────────────────────────
const DEFAULT_BUSINESS: BusinessInput = {
  balance:         0,
  monthlyRevenue:  0,
  fixedCost:       0,
  loanInterest:    0,
  industryType:    'restaurant',
}

const DEFAULT_FREELANCER: FreelancerInput = {
  assets:          0,
  salary:          0,
  monthlyExpense:  0,
  loanInterest:    0,
  sideIncome:      0,
  targetAmount:    0,
  jobType:         '',
}

const DEFAULT_PERSISTED: PersistedState = {
  mode:            'business',
  businessInput:   DEFAULT_BUSINESS,
  freelancerInput: DEFAULT_FREELANCER,
}

// ── 스토어 ────────────────────────────────────────────────
let _storage: StorageAdapter = defaultStorage

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  // 초기 상태
  ...DEFAULT_PERSISTED,
  result:      null,
  lastUpdated: null,
  _hydrated:   false,

  // ── setMode ─────────────────────────────────────────────
  setMode: (mode) => {
    set({ mode })
    _persist(get)
  },

  // ── updateBusinessInput ──────────────────────────────────
  updateBusinessInput: (partial) => {
    set(s => ({ businessInput: { ...s.businessInput, ...partial } }))
    _persist(get)
  },

  // ── updateFreelancerInput ────────────────────────────────
  updateFreelancerInput: (partial) => {
    set(s => ({ freelancerInput: { ...s.freelancerInput, ...partial } }))
    _persist(get)
  },

  // ── calculate ────────────────────────────────────────────
  calculate: () => {
    const { mode, businessInput, freelancerInput } = get()
    const result = mode === 'business'
      ? calculateBusinessRunway(businessInput)
      : calculateFreelancerRunway(freelancerInput)
    set({ result, lastUpdated: new Date() })
    import("@/lib/supabase/data").then(({ saveCalculation }) => { saveCalculation({ mode, input: mode === "business" ? businessInput : freelancerInput, result }).catch(() => {}) }).catch(() => {})
    _persist(get)
  },

  // ── reset ────────────────────────────────────────────────
  reset: () => {
    set({
      ...DEFAULT_PERSISTED,
      result:      null,
      lastUpdated: null,
    })
    _storage.clear()
  },

  // ── 어댑터 교체 (Supabase 전환 시 사용) ────────────────
  _setStorage: (adapter) => {
    _storage = adapter
  },

  // ── localStorage → store 하이드레이션 ──────────────────
  _hydrate: async () => {
    const saved = await _storage.load() as Partial<PersistedState> | null
    if (saved) {
      set({
        mode:            saved.mode            ?? DEFAULT_PERSISTED.mode,
        businessInput:   saved.businessInput   ?? DEFAULT_BUSINESS,
        freelancerInput: saved.freelancerInput ?? DEFAULT_FREELANCER,
      })
    }
    set({ _hydrated: true })
  },
}))

// ── persist 헬퍼 ─────────────────────────────────────────
function _persist(get: () => CalculatorState) {
  const { mode, businessInput, freelancerInput } = get()
  _storage.save({ mode, businessInput, freelancerInput })
}

// ── 앱 시작 시 자동 하이드레이션 ─────────────────────────
// Next.js SSR 환경에서는 클라이언트에서만 실행
if (typeof window !== 'undefined') {
  useCalculatorStore.getState()._hydrate()
}
