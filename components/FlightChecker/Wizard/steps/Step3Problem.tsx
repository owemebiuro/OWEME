"use client";

import { RadioList } from "../ui/RadioList";
import { WizardCard } from "../ui/WizardCard";
import { useWizardStore } from "../wizardStore";

const disruptionOptions = [
  { label: "Mój lot był opóźniony", value: "delay" },
  { label: "Mój lot został odwołany", value: "cancel" },
  { label: "Odmówiono mi wejścia na pokład", value: "denied" },
] as const;

export function Step3Problem() {
  const disruption = useWizardStore((state) => state.data.disruption);
  const setData = useWizardStore((state) => state.setData);

  return (
    <WizardCard title="Co się stało?">
      <RadioList
        options={disruptionOptions}
        value={disruption}
        onChange={(nextDisruption) => setData({ disruption: nextDisruption })}
      />
    </WizardCard>
  );
}
