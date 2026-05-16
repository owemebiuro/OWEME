"use client";

import { useState } from "react";

import { api } from "@/lib/trpc/hooks";

type Overview = {
  stats: {
    campaigns: number;
    subscribersTotal: number;
    subscribersActive: number;
    crmEligible: number;
  };
  campaigns: NewsletterCampaignRow[];
  segments: NewsletterSegmentRow[];
  defaultSegments: DefaultNewsletterSegmentRow[];
};

type NewsletterPanelProps = {
  overview: NonNullable<Overview>;
};

type NewsletterCampaignRow = {
  id: string;
  name: string;
  status: string;
  subject: string;
  recipientCount: number;
  updatedAt: string | Date | null;
};

type NewsletterSubscriberRow = {
  id: string;
  email: string;
  source: string | null;
  status: string;
  createdAt: string | Date | null;
};

type NewsletterSegmentRow = {
  id: string;
  name: string;
  description: string | null;
  isDynamic: boolean;
  recipientCount: number | null;
};

type DefaultNewsletterSegmentRow = {
  key: string;
  name: string;
  description: string;
};

type NewsletterSegmentListData = {
  dbSegments: NewsletterSegmentRow[];
  defaultSegments: DefaultNewsletterSegmentRow[];
};

type SegmentRow = NewsletterSegmentRow | DefaultNewsletterSegmentRow;

const tabs = ["Kampanie", "Subskrybenci", "Segmenty", "Szablony", "Ustawienia"] as const;
type Tab = (typeof tabs)[number];

const statusLabels: Record<string, string> = {
  DRAFT: "Robocza",
  SCHEDULED: "Zaplanowana",
  SENDING: "Wysyłanie",
  SENT: "Wysłana",
  PAUSED: "Wstrzymana",
  CANCELLED: "Anulowana",
};

const defaultRules = [
  {
    id: "rule-active-subscribers",
    operator: "AND" as const,
    group_operator: "AND" as const,
    conditions: [
      { field: "newsletter.status", operator: "equals", value: "ACTIVE" },
    ],
  },
];

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function metric(label: string, value: string | number, detail: string) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-950">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

function getSegmentKey(segment: SegmentRow) {
  return "key" in segment ? segment.key : segment.id;
}

export function NewsletterPanel({ overview }: NewsletterPanelProps) {
  const utils = api.useUtils();
  const [activeTab, setActiveTab] = useState<Tab>("Kampanie");
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [testEmailByCampaign, setTestEmailByCampaign] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const campaigns = api.newsletter.listCampaigns.useQuery();
  const subscribers = api.newsletter.listSubscribers.useQuery(undefined, {
    enabled: activeTab === "Subskrybenci",
  });
  const segments = api.newsletter.listSegments.useQuery(undefined, {
    enabled: activeTab === "Segmenty" || activeTab === "Kampanie",
  });
  const preview = api.newsletter.previewSegment.useMutation();
  const createCampaign = api.newsletter.createCampaign.useMutation({
    onSuccess: async () => {
      setCampaignName("");
      setCampaignSubject("");
      setMessage("Kampania robocza została utworzona.");
      await utils.newsletter.listCampaigns.invalidate();
    },
  });
  const createSubscriber = api.newsletter.createSubscriber.useMutation({
    onSuccess: async () => {
      setSubscriberEmail("");
      setMessage("Subskrybent został zapisany.");
      await utils.newsletter.listSubscribers.invalidate();
    },
  });
  const createSegment = api.newsletter.createSegment.useMutation({
    onSuccess: async () => {
      setSegmentName("");
      setMessage("Segment został zapisany.");
      await utils.newsletter.listSegments.invalidate();
    },
  });
  const sendTest = api.newsletter.sendTest.useMutation({
    onSuccess: (result) => {
      setMessage(
        result.sent
          ? "Email testowy został wysłany."
          : "Test zapisany, ale Resend nie wysłał wiadomości. Sprawdź RESEND_API_KEY.",
      );
    },
  });

  const segmentData = segments.data as NewsletterSegmentListData | undefined;
  const allSegments = [
    ...(segmentData?.dbSegments ?? overview.segments),
    ...(segmentData?.defaultSegments ?? overview.defaultSegments),
  ];
  const subscriberRows = (subscribers.data ?? []) as NewsletterSubscriberRow[];
  const campaignRows = (campaigns.data ?? overview.campaigns) as NewsletterCampaignRow[];

  async function handlePreviewDefault() {
    const result = await preview.mutateAsync({
      rules: defaultRules,
      rootOperator: "AND",
    });
    setMessage(`Podgląd segmentu: ${result.count} odbiorców.`);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Newsletter
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Kampanie, segmenty i subskrybenci z wymuszoną zgodą marketingową dla klientów CRM.
          </p>
        </div>
        <div className="rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-4 py-3 text-sm text-[var(--ember-lo)]">
          Wysyłka masowa jest przygotowana jako workflow. Ten etap obsługuje drafty,
          segmenty, testy Resend i listy odbiorców.
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {metric("Aktywni subskrybenci", overview.stats.subscribersActive, "newsletter_subscribers")}
        {metric("Klienci ze zgodą", overview.stats.crmEligible, "marketingConsent + emailValid")}
        {metric("Kampanie", campaignRows.length, "robocze i zaplanowane")}
        {metric("Segmenty", allSegments.length, "systemowe i własne")}
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-10 rounded-md px-4 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {message}
        </p>
      ) : null}

      {activeTab === "Kampanie" ? (
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              createCampaign.mutate({
                name: campaignName,
                subject: campaignSubject,
                previewText: "Wiadomość przygotowana w OWEME CRM.",
                contentHtml:
                  "<h1>Newsletter OWEME</h1><p>Szanowny Kliencie, przygotowaliśmy aktualizację prawną.</p>",
              });
            }}
          >
            <h2 className="text-base font-semibold text-neutral-950">Nowa kampania</h2>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Nazwa wewnętrzna
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                required
              />
            </label>
            <label className="mt-3 block text-sm font-medium text-neutral-700">
              Temat wiadomości
              <input
                value={campaignSubject}
                onChange={(event) => setCampaignSubject(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                required
              />
            </label>
            <button
              type="submit"
              disabled={createCampaign.isPending}
              className="mt-4 h-10 w-full rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              Utwórz draft
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Kampania</th>
                  <th className="px-4 py-3">Odbiorcy</th>
                  <th className="px-4 py-3">Aktualizacja</th>
                  <th className="px-4 py-3">Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {campaignRows.map((campaign) => (
                  <tr key={campaign.id} className="align-top hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                        {statusLabels[campaign.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-950">{campaign.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">{campaign.subject}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{campaign.recipientCount}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(campaign.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-72 gap-2">
                        <input
                          type="email"
                          value={testEmailByCampaign[campaign.id] ?? ""}
                          onChange={(event) =>
                            setTestEmailByCampaign((current) => ({
                              ...current,
                              [campaign.id]: event.target.value,
                            }))
                          }
                          placeholder="test@email.pl"
                          className="h-9 flex-1 rounded-md border border-neutral-200 px-2 text-xs outline-none focus:border-neutral-950"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            sendTest.mutate({
                              id: campaign.id,
                              email: testEmailByCampaign[campaign.id] ?? "",
                            })
                          }
                          className="h-9 rounded-md border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:border-neutral-400"
                        >
                          Wyślij
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "Subskrybenci" ? (
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              createSubscriber.mutate({
                email: subscriberEmail,
                source: "manual",
                tags: ["manual"],
                status: "ACTIVE",
              });
            }}
          >
            <h2 className="text-base font-semibold text-neutral-950">Dodaj subskrybenta</h2>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Email
              <input
                type="email"
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                required
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              Dodanie ręczne zakłada potwierdzoną zgodę marketingową. Rekordy wypisane,
              bounced i complained są bezwzględnie wykluczane z wysyłek.
            </p>
            <button
              type="submit"
              disabled={createSubscriber.isPending}
              className="mt-4 h-10 w-full rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              Zapisz
            </button>
          </form>

          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Źródło</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data zapisu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subscriberRows.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-neutral-950">{subscriber.email}</td>
                    <td className="px-4 py-3 text-neutral-600">{subscriber.source ?? "-"}</td>
                    <td className="px-4 py-3">{subscriber.status}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(subscriber.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "Segmenty" ? (
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              createSegment.mutate({
                name: segmentName,
                description: "Aktywni subskrybenci newslettera.",
                rules: defaultRules,
                rootOperator: "AND",
                isDynamic: true,
              });
            }}
          >
            <h2 className="text-base font-semibold text-neutral-950">Segment startowy</h2>
            <label className="mt-4 block text-sm font-medium text-neutral-700">
              Nazwa segmentu
              <input
                value={segmentName}
                onChange={(event) => setSegmentName(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                required
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handlePreviewDefault}
                className="h-10 flex-1 rounded-md border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
              >
                Oblicz
              </button>
              <button
                type="submit"
                disabled={createSegment.isPending}
                className="h-10 flex-1 rounded-md bg-neutral-950 px-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                Zapisz
              </button>
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {allSegments.map((segment) => (
              <article
                key={getSegmentKey(segment)}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-950">{segment.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-neutral-600">
                      {segment.description}
                    </p>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                    {"isDynamic" in segment && !segment.isDynamic ? "Statyczny" : "Dynamiczny"}
                  </span>
                </div>
                {"recipientCount" in segment ? (
                  <p className="mt-3 text-sm font-semibold text-neutral-950">
                    {segment.recipientCount ?? "-"} odbiorców
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "Szablony" ? (
        <section className="grid gap-3 md:grid-cols-3">
          {[
            "Aktualizacja prawna",
            "Aktualizacja sprawy",
            "Newsletter miesięczny",
            "Przypomnienie o terminie",
            "Reaktywacja nieaktywnych",
            "Pusty szablon",
          ].map((template) => (
            <article key={template} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="aspect-[4/3] rounded-md border border-neutral-200 bg-neutral-50" />
              <h3 className="mt-3 font-semibold text-neutral-950">{template}</h3>
              <p className="mt-1 text-sm text-neutral-500">Wbudowany układ email z obowiązkową stopką.</p>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "Ustawienia" ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-950">Ustawienia newslettera</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-neutral-700">
              Nazwa nadawcy
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3" defaultValue="Kancelaria OWEME" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Email nadawcy
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3" defaultValue="newsletter@oweme.pl" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Reply-To
              <input className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3" defaultValue="kontakt@oweme.pl" />
            </label>
          </div>
          <p className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            Produkcyjna wysyłka wymaga `RESEND_API_KEY` i zweryfikowanego `RESEND_FROM_EMAIL`.
          </p>
        </section>
      ) : null}
    </div>
  );
}
