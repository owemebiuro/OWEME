const REASON_MAP: Record<string, string> = {
  delay: "opóźnienie lotu",
  cancelled: "odwołanie lotu",
  denied: "odmowa wejścia na pokład / overbooking",
  baggage: "zniszczony lub zaginiony bagaż",
};

export async function POST(request: Request) {
  const { flightNum, reason } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const reasonLabel = REASON_MAP[reason] ?? "opóźnienie lotu";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system:
        'Jesteś ekspertem od praw pasażerów lotniczych (WE 261/2004, Konwencja Montrealska). Odpowiedz TYLKO w formacie JSON: {"eligible":true/false,"compensation_eur":liczba_lub_null,"title":"nagłówek max 7 słów po polsku","explanation":"1-2 zdania po polsku"}',
      messages: [
        {
          role: "user",
          content: `Lot ${flightNum}, powód: ${reasonLabel}. Czy pasażer kwalifikuje się do odszkodowania?`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "Upstream error" }, { status: 502 });
  }

  const data = await res.json();
  const text = (data.content ?? [])
    .map((item: { text?: string }) => item.text ?? "")
    .join("");

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Parse error" }, { status: 500 });
  }
}
