import styles from "./loading.module.css";

function KpiSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.line} />
      <div className={styles.value} />
      <div className={styles.lineShort} />
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className={styles.pipe}>
      <div className={styles.pipeContent}>
        <div className={styles.dot} />
        <div className="flex-1">
          <div className={styles.lineShort} />
          <div className={styles.line} />
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className={styles.panel}>
      <div className={styles.lineShort} />
      <div className={styles.panelRows}>
        <div className={styles.line} />
        <div className={styles.line} />
        <div className={styles.lineShort} />
        <div className={styles.line} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className={styles.loading} aria-label="Ładowanie widoku CRM">
      <div className={styles.inner}>
        <section className={styles.kpis}>
          {Array.from({ length: 5 }, (_, index) => (
            <KpiSkeleton key={index} />
          ))}
        </section>
        <section className={styles.pipelines}>
          {Array.from({ length: 4 }, (_, index) => (
            <PipelineSkeleton key={index} />
          ))}
        </section>
        <section className={styles.grid}>
          <PanelSkeleton />
          <PanelSkeleton />
        </section>
      </div>
    </main>
  );
}
