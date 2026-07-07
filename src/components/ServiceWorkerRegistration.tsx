"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        // Approval/compliance posture: do not keep a browser-level page cache.
        // The homepage may contain official Amazon product content, and that
        // content has a strict freshness window. Unregister the old worker and
        // clear its cache for returning visitors.
        navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
            .catch(() => {});

        if ("caches" in window) {
            caches
                .keys()
                .then((keys) =>
                    Promise.all(
                        keys
                            .filter((key) => key.startsWith("productfindai-"))
                            .map((key) => caches.delete(key)),
                    ),
                )
                .catch(() => {});
        }
    }, []);

    return null;
}
