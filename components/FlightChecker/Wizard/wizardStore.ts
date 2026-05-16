import { create } from "zustand";

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  flag: string;
}

export interface Airline {
  iata: string;
  name: string;
}

export interface PassengerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  termsAgreed: true;
  newsletter?: boolean;
}

export interface ClaimResult {
  eligible: boolean;
  amount?: number;
  currency?: "EUR";
  reason?: string;
}

export interface WizardData {
  departureAirport: Airport | null;
  destinationAirport: Airport | null;
  isDirect: boolean | null;
  flightDate: string | null;
  airline: Airline | null;
  flightNumber: string | null;
  disruption: "delay" | "cancel" | "denied" | null;
  delayHours: "3plus" | "less3" | "never" | null;
  passenger: PassengerData | null;
}

interface WizardStore {
  currentStep: number;
  data: WizardData;
  result: ClaimResult | null;
  isLoading: boolean;
  setStep: (n: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setData: (partial: Partial<WizardData>) => void;
  setResult: (result: ClaimResult) => void;
  setLoading: (value: boolean) => void;
  canProceed: () => boolean;
  reset: () => void;
}

export const initialWizardData: WizardData = {
  departureAirport: null,
  destinationAirport: null,
  isDirect: null,
  flightDate: null,
  airline: null,
  flightNumber: null,
  disruption: null,
  delayHours: null,
  passenger: null,
};

function clampStep(step: number) {
  return Math.min(5, Math.max(0, step));
}

function isFlightNumberValid(value: string | null) {
  return Boolean(value && /^\d{1,4}$/.test(value));
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  currentStep: 0,
  data: initialWizardData,
  result: null,
  isLoading: false,
  setStep: (currentStep) => set({ currentStep: clampStep(currentStep) }),
  nextStep: () => {
    const { currentStep, data } = get();

    if (currentStep === 2 && data.disruption !== "delay") {
      set({ currentStep: 4 });
      return;
    }

    set({ currentStep: clampStep(currentStep + 1) });
  },
  prevStep: () => {
    const { currentStep, data } = get();

    if (currentStep === 4 && data.disruption !== "delay") {
      set({ currentStep: 2 });
      return;
    }

    set({ currentStep: clampStep(currentStep - 1) });
  },
  setData: (partial) =>
    set((state) => ({
      data: {
        ...state.data,
        ...partial,
        delayHours:
          partial.disruption && partial.disruption !== "delay"
            ? null
            : partial.delayHours === undefined
              ? state.data.delayHours
              : partial.delayHours,
      },
    })),
  setResult: (result) => set({ result }),
  setLoading: (isLoading) => set({ isLoading }),
  canProceed: () => {
    const { currentStep, data, result } = get();

    if (currentStep === 0) {
      return Boolean(
        data.departureAirport && data.destinationAirport && data.isDirect !== null,
      );
    }

    if (currentStep === 1) {
      return Boolean(
        data.flightDate && data.airline && isFlightNumberValid(data.flightNumber),
      );
    }

    if (currentStep === 2) {
      return Boolean(data.disruption);
    }

    if (currentStep === 3) {
      return data.disruption !== "delay" || Boolean(data.delayHours);
    }

    if (currentStep === 4) {
      return Boolean(data.passenger);
    }

    return Boolean(result);
  },
  reset: () =>
    set({
      currentStep: 0,
      data: initialWizardData,
      result: null,
      isLoading: false,
    }),
}));
