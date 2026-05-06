import { create } from 'zustand'
import type { ClaimResult, DisruptionType } from '@/types/claim'

export type ClaimTab = 'manual' | 'boarding' | 'delay' | 'cancel'

interface ClaimState {
  activeTab: ClaimTab
  cardTitle: string
  result: ClaimResult | null
  isLoading: boolean
  lastDisruption: DisruptionType | null
  setTab: (tab: ClaimTab, title: string) => void
  setResult: (result: ClaimResult, disruption?: DisruptionType) => void
  setLoading: (value: boolean) => void
  reset: () => void
}

export const useClaimStore = create<ClaimState>((set) => ({
  activeTab: 'manual',
  cardTitle: 'Sprawdź lot po numerze',
  result: null,
  isLoading: false,
  lastDisruption: null,
  setTab: (activeTab, cardTitle) => set({ activeTab, cardTitle, result: null }),
  setResult: (result, disruption) =>
    set((state) => ({ result, lastDisruption: disruption ?? state.lastDisruption ?? 'delay' })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      activeTab: 'manual',
      cardTitle: 'Sprawdź lot po numerze',
      result: null,
      isLoading: false,
      lastDisruption: null,
    }),
}))
