"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  }

  if (sent) {
    return (
      <p style={{ fontSize: 13, color: "var(--orange)", fontWeight: 600, marginTop: 12 }}>
        Dziękujemy! Potwierdzenie wysłane na {email}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
        }}
      >
        <input
          type="email"
          placeholder="twoj@email.pl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1,
            height: 38,
            border: "0.5px solid var(--border)",
            borderRadius: 10,
            padding: "0 12px",
            fontSize: 13,
            background: "var(--bg)",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            height: 38,
            padding: "0 16px",
            background: "var(--orange)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          OK
        </button>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
        Bez spamu. Wypisz się w każdej chwili.
      </p>
    </form>
  );
}
