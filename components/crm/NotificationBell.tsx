"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./NotificationBell.module.css";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  taskId: string | null;
  claimId: string | null;
  priority: string | null;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) {
    return "przed chwilą";
  }

  if (minutes < 60) {
    return `${minutes} min temu`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} godz. temu`;
  }

  return `${Math.floor(hours / 24)} dni temu`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/notifications", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: NotificationsResponse | null) => {
        if (!cancelled) {
          setNotifications(payload?.notifications ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(notification: NotificationItem) {
    const response = await fetch(`/api/notifications/${notification.id}/read`, {
      method: "POST",
    });
    const payload = (await response.json()) as { href?: string };

    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
    setOpen(false);
    router.push(payload.href ?? "/crm/tasks");
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", {
      method: "POST",
    });
    setNotifications([]);
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        aria-label="Powiadomienia"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
        {notifications.length ? (
          <span className={styles.badge}>{notifications.length}</span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.head}>
              <p className={styles.title}>Powiadomienia</p>
              {notifications.length ? (
                <button
                  type="button"
                  className={styles.readAll}
                  onClick={() => void markAllRead()}
                >
                  Oznacz wszystkie
                </button>
              ) : null}
            </div>

            <div className={styles.list}>
              {notifications.length ? (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={styles.item}
                    onClick={() => void markRead(notification)}
                  >
                    <p className={styles.itemTitle}>{notification.title}</p>
                    <p className={styles.body}>{notification.body}</p>
                    <p className={styles.time}>
                      {relativeTime(notification.createdAt)}
                    </p>
                  </button>
                ))
              ) : (
                <p className={styles.empty}>Brak nowych powiadomień</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
