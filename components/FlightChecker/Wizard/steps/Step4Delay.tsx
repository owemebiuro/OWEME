"use client";

import { InfoNote } from "../ui/InfoNote";
import { RadioList } from "../ui/RadioList";
import { WizardCard } from "../ui/WizardCard";
import { useWizardStore } from "../wizardStore";

const delayOptions = [
  { label: "3 godziny lub więcej", value: "3plus" },
  { label: "Mniej niż 3 godziny", value: "less3" },
  { label: "Nigdy nie dotarłem", value: "never" },
] as const;

export function Step4Delay() {
  const data = useWizardStore((state) => state.data);
  const setData = useWizardStore((state) => state.setData);
  const destination = data.destinationAirport?.iata ?? "celu";

  return (
    <WizardCard title={`Z jakim opóźnieniem dotarłeś do ${destination}?`}>
      <RadioList
        options={delayOptions}
        value={data.delayHours}
        onChange={(delayHours) => setData({ delayHours })}
      />
      {data.delayHours === "less3" ? (
        <InfoNote>
          EC 261/2004 zwykle wymaga co najmniej 3 godzin opóźnienia przy
          przylocie, ale możesz przejść dalej i zostawić nam sprawę do analizy.
        </InfoNote>
      ) : null}
    </WizardCard>
  );
}
