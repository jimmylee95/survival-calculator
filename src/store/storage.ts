// ── StorageAdapter 인터페이스 ────────────────────────────
// 나중에 SupabaseAdapter로 교체만 하면 됨
export interface StorageAdapter {
  save(data: unknown): Promise<void>
  load(): Promise<unknown>
  clear(): Promise<void>
}

// ── LocalStorageAdapter ──────────────────────────────────
const STORAGE_KEY = 'survival-calc-v1'

export class LocalStorageAdapter implements StorageAdapter {
  async save(data: unknown): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // 저장 실패 시 무시 (용량 초과 등)
    }
  }

  async load(): Promise<unknown> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }
}

// ── SupabaseAdapter (추후 교체용 스켈레톤) ───────────────
// export class SupabaseAdapter implements StorageAdapter {
//   constructor(private userId: string) {}
//
//   async save(data: unknown): Promise<void> {
//     await supabase.from('calculator_state')
//       .upsert({ user_id: this.userId, data, updated_at: new Date() })
//   }
//
//   async load(): Promise<unknown> {
//     const { data } = await supabase.from('calculator_state')
//       .select('data').eq('user_id', this.userId).single()
//     return data?.data ?? null
//   }
//
//   async clear(): Promise<void> {
//     await supabase.from('calculator_state')
//       .delete().eq('user_id', this.userId)
//   }
// }

export const defaultStorage = new LocalStorageAdapter()
