"use client";

import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";

import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { AnalyticsToolbar } from "@/components/analytics/AnalyticsToolbar";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { KpiStrip } from "@/components/analytics/KpiStrip";
import { MonthlyCasesBar } from "@/components/analytics/MonthlyCasesBar";
import { PipelineValue } from "@/components/analytics/PipelineValue";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { StatusDonut } from "@/components/analytics/StatusDonut";
import { TopEmployees } from "@/components/analytics/TopEmployees";
import {
  useActivityHeatmap,
  useAnalyticsKpis,
  useAnalyticsRevenue,
  useConversionFunnel,
  useMonthlyCases,
  usePipelineValue,
  useStatusBreakdown,
  useTopEmployees,
} from "@/hooks/useAnalytics";
import type { AnalyticsQueryRange, Period } from "@/lib/analytics/types";
import styles from "./AnalyticsDashboard.module.css";

function toInputDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function defaultCustomRange(): AnalyticsQueryRange {
  const now = new Date();

  return {
    from: toInputDate(subDays(now, 30)),
    to: toInputDate(now),
  };
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>("3m");
  const [customRange, setCustomRange] = useState<AnalyticsQueryRange>(() =>
    defaultCustomRange(),
  );
  const activeRange = useMemo(
    () => (period === "custom" ? customRange : undefined),
    [period, customRange],
  );

  const kpisQuery = useAnalyticsKpis(period, activeRange);
  const revenueQuery = useAnalyticsRevenue(period, activeRange);
  const statusQuery = useStatusBreakdown(period, activeRange);
  const monthlyCasesQuery = useMonthlyCases();
  const funnelQuery = useConversionFunnel(period, activeRange);
  const employeesQuery = useTopEmployees(period, 5, activeRange);
  const pipelineQuery = usePipelineValue();
  const activityQuery = useActivityHeatmap(12);

  function handlePeriodChange(nextPeriod: Period) {
    setPeriod(nextPeriod);

    if (nextPeriod === "custom" && (!customRange.from || !customRange.to)) {
      setCustomRange(defaultCustomRange());
    }
  }

  function handleExport() {
    window.print();
  }

  return (
    <div className={styles.dashboard}>
      <AnalyticsToolbar
        period={period}
        range={customRange}
        onPeriodChange={handlePeriodChange}
        onRangeChange={setCustomRange}
        onExport={handleExport}
      />

      <KpiStrip items={kpisQuery.data?.items} isLoading={kpisQuery.isLoading} />

      <section className={`${styles.grid} analytics-grid`}>
        <RevenueChart
          data={revenueQuery.data}
          isLoading={revenueQuery.isLoading}
        />
        <StatusDonut
          data={statusQuery.data}
          isLoading={statusQuery.isLoading}
        />
        <MonthlyCasesBar
          data={monthlyCasesQuery.data}
          isLoading={monthlyCasesQuery.isLoading}
        />
        <ConversionFunnel
          data={funnelQuery.data}
          isLoading={funnelQuery.isLoading}
        />
        <TopEmployees
          data={employeesQuery.data}
          isLoading={employeesQuery.isLoading}
        />
        <PipelineValue
          data={pipelineQuery.data}
          isLoading={pipelineQuery.isLoading}
        />
        <ActivityHeatmap
          data={activityQuery.data}
          isLoading={activityQuery.isLoading}
        />
      </section>
    </div>
  );
}
