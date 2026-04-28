import { ClaimStatus, Prisma, type PrismaClient } from "@prisma/client";

export type SegmentCondition = {
  field: string;
  operator: string;
  value?: string | number | string[] | boolean | null;
};

export type SegmentRule = {
  id: string;
  operator: "AND" | "OR";
  conditions: SegmentCondition[];
  group_operator: "AND" | "OR";
};

export type SegmentRulesInput = {
  rules: SegmentRule[];
  rootOperator: "AND" | "OR";
};

export const defaultSegments = [
  {
    key: "seg_all_active",
    name: "Wszyscy aktywni subskrybenci",
    description: "Aktywni subskrybenci newslettera z formularzy i importów.",
    rules: [
      {
        id: "default-active",
        operator: "AND",
        group_operator: "AND",
        conditions: [
          { field: "newsletter.status", operator: "equals", value: "ACTIVE" },
        ],
      },
    ],
  },
  {
    key: "seg_clients_active_cases",
    name: "Klienci ze sprawami w toku",
    description: "Klienci CRM z aktywną zgodą marketingową i sprawą w toku.",
    rules: [
      {
        id: "default-active-cases",
        operator: "AND",
        group_operator: "AND",
        conditions: [
          {
            field: "case.status",
            operator: "in",
            value: ["NEW", "QUALIFIED", "COURT_STAGE", "AWAITING_AIRLINE_RESPONSE"],
          },
        ],
      },
    ],
  },
  {
    key: "seg_clients_won_cases",
    name: "Klienci z wygranymi sprawami",
    description: "Klienci CRM ze sprawą zakończoną sukcesem w ostatnich 365 dniach.",
    rules: [
      {
        id: "default-won-cases",
        operator: "AND",
        group_operator: "AND",
        conditions: [
          { field: "case.status", operator: "in", value: ["WON", "SETTLEMENT", "CLOSED_PAID"] },
          { field: "case.closed_at", operator: "within_last_days", value: 365 },
        ],
      },
    ],
  },
  {
    key: "seg_leads_no_case",
    name: "Leady bez sprawy",
    description: "Klienci oznaczeni jako lead bez powiązanych spraw.",
    rules: [
      {
        id: "default-leads",
        operator: "AND",
        group_operator: "AND",
        conditions: [
          { field: "client.status", operator: "equals", value: "LEAD" },
          { field: "case.count", operator: "equals", value: 0 },
        ],
      },
    ],
  },
  {
    key: "seg_new_subscribers",
    name: "Nowi subskrybenci (30 dni)",
    description: "Aktywni subskrybenci zapisani w ostatnich 30 dniach.",
    rules: [
      {
        id: "default-new-subscribers",
        operator: "AND",
        group_operator: "AND",
        conditions: [
          { field: "newsletter.status", operator: "equals", value: "ACTIVE" },
          { field: "newsletter.subscribed_at", operator: "within_last_days", value: 30 },
        ],
      },
    ],
  },
] satisfies Array<{
  key: string;
  name: string;
  description: string;
  rules: SegmentRule[];
}>;

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function asStringArray(value: SegmentCondition["value"]) {
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function conditionToClientWhere(
  condition: SegmentCondition,
): Prisma.ClientWhereInput | null {
  if (condition.field === "client.status") {
    const value = String(condition.value ?? "");
    return condition.operator === "not_equals"
      ? { status: { not: value, mode: "insensitive" } }
      : { status: { equals: value, mode: "insensitive" } };
  }

  if (condition.field === "client.city") {
    const value = String(condition.value ?? "");
    return condition.operator === "contains"
      ? { city: { contains: value, mode: "insensitive" } }
      : { city: { equals: value, mode: "insensitive" } };
  }

  if (condition.field === "client.created_at") {
    if (condition.operator === "within_last_days") {
      return { createdAt: { gte: dateDaysAgo(Number(condition.value ?? 0)) } };
    }
    if (condition.operator === "after") {
      return { createdAt: { gte: new Date(String(condition.value)) } };
    }
    if (condition.operator === "before") {
      return { createdAt: { lte: new Date(String(condition.value)) } };
    }
  }

  if (condition.field === "case.status") {
    const values = asStringArray(condition.value) as ClaimStatus[];
    return { claims: { some: { status: { in: values } } } };
  }

  if (condition.field === "case.closed_at") {
    if (condition.operator === "within_last_days") {
      return {
        claims: { some: { closedAt: { gte: dateDaysAgo(Number(condition.value ?? 0)) } } },
      };
    }
    if (condition.operator === "after") {
      return { claims: { some: { closedAt: { gte: new Date(String(condition.value)) } } } };
    }
  }

  if (condition.field === "case.count") {
    const count = Number(condition.value ?? 0);
    if (condition.operator === "equals" && count === 0) {
      return { claims: { none: {} } };
    }
    if (condition.operator === "greater_than") {
      return { claims: { some: {} } };
    }
  }

  return null;
}

function conditionToSubscriberWhere(
  condition: SegmentCondition,
): Prisma.NewsletterSubscriberWhereInput | null {
  if (condition.field === "newsletter.status") {
    return { status: String(condition.value ?? "ACTIVE") as never };
  }

  if (condition.field === "newsletter.source") {
    return { source: { equals: String(condition.value ?? ""), mode: "insensitive" } };
  }

  if (condition.field === "newsletter.tags") {
    return { tags: { hasSome: asStringArray(condition.value) } };
  }

  if (condition.field === "newsletter.subscribed_at") {
    if (condition.operator === "within_last_days") {
      return { subscribedAt: { gte: dateDaysAgo(Number(condition.value ?? 0)) } };
    }
    if (condition.operator === "after") {
      return { subscribedAt: { gte: new Date(String(condition.value)) } };
    }
  }

  if (condition.field === "newsletter.never_opened") {
    return { openCount: 0 };
  }

  if (condition.field === "newsletter.last_open_at") {
    if (condition.operator === "before") {
      return { lastOpenAt: { lte: new Date(String(condition.value)) } };
    }
    if (condition.operator === "within_last_days") {
      return { lastOpenAt: { gte: dateDaysAgo(Number(condition.value ?? 0)) } };
    }
  }

  return null;
}

function combineWhere<T>(items: T[], operator: "AND" | "OR") {
  if (!items.length) {
    return {};
  }

  return operator === "OR" ? { OR: items } : { AND: items };
}

function buildClientWhere(input: SegmentRulesInput): Prisma.ClientWhereInput {
  const groups = input.rules
    .map((rule) => {
      const conditions = rule.conditions
        .map(conditionToClientWhere)
        .filter(Boolean) as Prisma.ClientWhereInput[];
      return combineWhere(conditions, rule.group_operator);
    })
    .filter((where) => Object.keys(where).length > 0) as Prisma.ClientWhereInput[];

  return {
    marketingConsent: true,
    emailValid: true,
    email: { not: "" },
    ...combineWhere(groups, input.rootOperator),
  };
}

function buildSubscriberWhere(
  input: SegmentRulesInput,
): Prisma.NewsletterSubscriberWhereInput {
  const groups = input.rules
    .map((rule) => {
      const conditions = rule.conditions
        .map(conditionToSubscriberWhere)
        .filter(Boolean) as Prisma.NewsletterSubscriberWhereInput[];
      return combineWhere(conditions, rule.group_operator);
    })
    .filter((where) => Object.keys(where).length > 0) as Prisma.NewsletterSubscriberWhereInput[];

  return {
    status: "ACTIVE",
    email: { not: "" },
    ...combineWhere(groups, input.rootOperator),
  };
}

export async function previewSegment(
  prisma: PrismaClient,
  input: SegmentRulesInput,
) {
  const [clients, subscribers] = await Promise.all([
    prisma.client.findMany({
      where: buildClientWhere(input),
      select: { email: true, firstName: true, lastName: true },
      take: 5000,
    }),
    prisma.newsletterSubscriber.findMany({
      where: buildSubscriberWhere(input),
      select: { email: true, firstName: true, lastName: true },
      take: 5000,
    }),
  ]);

  const recipients = new Map<
    string,
    { email: string; name: string; source: "CRM" | "Newsletter" }
  >();

  clients.forEach((client) => {
    recipients.set(client.email.toLowerCase(), {
      email: client.email,
      name: `${client.firstName} ${client.lastName}`.trim(),
      source: "CRM",
    });
  });
  subscribers.forEach((subscriber) => {
    recipients.set(subscriber.email.toLowerCase(), {
      email: subscriber.email,
      name: `${subscriber.firstName ?? ""} ${subscriber.lastName ?? ""}`.trim(),
      source: "Newsletter",
    });
  });

  return {
    count: recipients.size,
    crmCount: clients.length,
    subscriberCount: subscribers.length,
    sample: Array.from(recipients.values())
      .slice(0, 5)
      .map((recipient) => ({
        ...recipient,
        match_reasons: [`Źródło: ${recipient.source}`, "Spełnia reguły segmentu"],
      })),
  };
}
