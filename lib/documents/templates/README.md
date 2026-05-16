# OWEME DOCX templates

Place final `.docx` templates here using the Prisma `DocumentType` names:

- `ASSIGNMENT_AGREEMENT.docx`
- `POWER_OF_ATTORNEY.docx`
- `DEMAND_LETTER.docx`
- `NEGATIVE_RESPONSE_REPLY.docx`
- `LAWSUIT.docx`
- `SETTLEMENT_CONFIRMATION.docx`
- `CLIENT_CONFIRMATION.docx`

Templates can use standard docxtemplater tags like `{numer_sprawy}` or Word
mail-merge style tags like `«NUMER_SPRAWY»`. The generator detects those
delimiters automatically.

Common lowercase tags:

- `{imie}`, `{nazwisko}`, `{imie_nazwisko}`
- `{adres}`, `{email}`, `{telefon}`, `{pesel_nip}`, `{numer_dokumentu}`
- `{numer_sprawy}`, `{numer_pisma}`, `{data_sporzadzenia}`
- `{numer_lotu}`, `{data_lotu}`, `{lotnisko_wylotu}`, `{lotnisko_przylotu}`
- `{lotnisko_wylotu_nazwa}`, `{lotnisko_przylotu_nazwa}`
- `{planowa_godzina_odlotu}`, `{planowa_godzina_przylotu}`, `{faktyczna_godzina_przylotu}`
- `{nazwa_linii}`, `{kod_iata_linii}`, `{adres_linii}`, `{kod_pocztowy_linii}`, `{miasto_linii}`, `{kraj_linii}`
- `{email_reklamacyjny_linii}`, `{rejestr_linii}`
- `{opoznienie}`, `{opoznienie_minuty}`, `{dystans_trasy_km}`
- `{kwota_roszczenia}`, `{kwota_roszczenia_eur}`, `{kwota_roszczenia_pln}`
- `{prog_art7}`, `{typ_zdarzenia}`, `{okolicznosci_zdarzenia}`
- `{numer_umowy_cesji}`, `{data_umowy_cesji}`, `{numer_rezerwacji}`
- `{termin_zaplaty}`, `{numer_rachunku_oweme}`, `{tytul_przelewu}`
- `{lista_pasazerow}`, `{inne_zalaczniki}`, `{data_wygenerowania}`

Uppercase tags supported by `DEMAND_LETTER.docx`:

- `«NUMER_PISMA»`, `«DATA_SPORZADZENIA»`, `«NUMER_SPRAWY»`
- `«NAZWA_LINII_LOTNICZEJ»`, `«ADRES_LINII_LOTNICZEJ»`
- `«KOD_POCZTOWY_LINII»`, `«MIASTO_LINII»`, `«KRAJ_SIEDZIBY_LINII»`
- `«IATA_CODE»`, `«EMAIL_REKLAMACYJNY_LINII»`, `«REJESTR_LINII»`
- `«NR_LOTU»`, `«DATA_LOTU»`
- `«PORT_ODLOTU_IATA»`, `«PORT_ODLOTU_NAZWA»`
- `«PORT_PRZYLOTU_IATA»`, `«PORT_PRZYLOTU_NAZWA»`
- `«PLANOWA_GODZINA_ODLOTU»`, `«PLANOWA_GODZINA_PRZYLOTU»`
- `«FAKTYCZNA_GODZINA_PRZYLOTU»`, `«WYMIAR_OPOZNIENIA_MINUT»`
- `«DYSTANS_TRASY_KM»`, `«TYP_ZDARZENIA»`
- `«OKOLICZNOSCI_ZDARZENIA»`, `«OKLICZNOSCI_ZDARZENIA»`
- `«NR_REZERWACJI»`, `«NUMER_UMOWY_CESJI»`, `«DATA_UMOWY_CESJI»`
- `«IMIE_NAZWISKO_KLIENTA»`, `«PROG_ART7»`
- `«KWOTA_ODSZKODOWANIA_EUR»`, `«KWOTA_ODSZKODOWANIA_PLN»`
- `«TERMIN_ZAPLATY»`, `«NUMER_RACHUNKU_OWEME»`
- `«TYTUL_PRZELEWU»`, `«INNE_ZALACZNIKI»`

Airline name, address, postal code, city, country and registry data are filled
from the CRM airline list imported into the `Airline` table. Payload values still
win when they are present, so a specific case can override template data.
Complaint email can also be read from airline contact data.
`«NUMER_RACHUNKU_OWEME»` uses the optional `OWEME_BANK_ACCOUNT` environment
variable. `«KWOTA_ODSZKODOWANIA_PLN»` is filled only when the claim already has
a payout with an EUR/PLN rate or a payload value.

Until final templates are added, the generator uses a minimal fallback DOCX
template created in memory.
