# OWEME DOCX templates

Place final `.docx` templates here using the Prisma `DocumentType` names:

- `ASSIGNMENT_AGREEMENT.docx`
- `POWER_OF_ATTORNEY.docx`
- `DEMAND_LETTER.docx`
- `NEGATIVE_RESPONSE_REPLY.docx`
- `LAWSUIT.docx`
- `SETTLEMENT_CONFIRMATION.docx`
- `CLIENT_CONFIRMATION.docx`

Supported MVP tags include:

- `{imie}`
- `{nazwisko}`
- `{adres}`
- `{numer_sprawy}`
- `{numer_lotu}`
- `{data_lotu}`
- `{lotnisko_wylotu}`
- `{lotnisko_przylotu}`
- `{kwota_roszczenia}`
- `{nazwa_linii}`
- `{data_wygenerowania}`
- `{lista_pasazerow}`

Until final templates are added, the generator uses a minimal fallback DOCX
template created in memory.
