"use client";

import { AirportField } from "../ui/AirportField";
import { InfoNote } from "../ui/InfoNote";
import { RadioList } from "../ui/RadioList";
import { WizardCard } from "../ui/WizardCard";
import { useWizardStore } from "../wizardStore";
import styles from "../Wizard.module.css";

const directOptions = [
  { label: "Tak, bezpośredni", value: true },
  { label: "Nie, miał przesiadkę", value: false },
] as const;

export function Step1Route() {
  const data = useWizardStore((state) => state.data);
  const setData = useWizardStore((state) => state.setData);

  return (
    <>
      <WizardCard title="Gdzie leciałeś?">
        <div className={styles.gridTwo}>
          <AirportField
            label="Lotnisko wylotu"
            placeholder="Wybierz lotnisko"
            value={data.departureAirport}
            onChange={(departureAirport) => setData({ departureAirport })}
          />
          <AirportField
            label="Lotnisko docelowe"
            placeholder="Wybierz lotnisko"
            value={data.destinationAirport}
            onChange={(destinationAirport) => setData({ destinationAirport })}
          />
        </div>
      </WizardCard>

      <WizardCard title="Czy był to lot bezpośredni?">
        <RadioList
          columns
          options={directOptions}
          value={data.isDirect}
          onChange={(isDirect) => setData({ isDirect })}
        />
        <InfoNote>
          Podaj całą trasę — od lotniska wylotu aż do ostatecznego celu podróży.
        </InfoNote>
      </WizardCard>
    </>
  );
}
