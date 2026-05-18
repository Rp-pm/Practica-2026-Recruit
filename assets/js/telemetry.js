/**
 * UI Telemetry Engine & Performance Monitor
 */

(function () {
    'use strict';

    const endpoint = "https://analytics.rc251.utm.md/api/telemetry";

    const telemetryData = {
        appId: "RC251-UTM-PORTFOLIO",
        timestamp: new Date().toISOString(),

        environment: {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio || 1,
            hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
            deviceMemory: navigator.deviceMemory || 'N/A',
            networkType: navigator.connection?.effectiveType || 'unknown'
        },

        performanceMetrics: {},
        errors: [],
        interactionMetrics: {}
    };

    let firstClickRecorded = false;

    // -----------------------------
    // PERFORMANCE
    // -----------------------------
    function collectPerformanceMetrics() {
        if (!window.performance) return;

        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
            telemetryData.performanceMetrics.ttfb =
                nav.responseStart - nav.requestStart;

            telemetryData.performanceMetrics.domInteractive =
                nav.domInteractive;

            telemetryData.performanceMetrics.loadTime =
                nav.loadEventEnd - nav.startTime;
        }

        const paint = performance.getEntriesByType('paint');
        paint.forEach(p => {
            if (p.name === 'first-paint') {
                telemetryData.performanceMetrics.fp = p.startTime;
            }
            if (p.name === 'first-contentful-paint') {
                telemetryData.performanceMetrics.fcp = p.startTime;
            }
        });
    }

    // -----------------------------
    // ERROR TRACKING
    // -----------------------------
    window.onerror = function (msg, src, line, col, err) {
        telemetryData.errors.push({
            message: msg,
            source: src,
            line,
            column: col,
            stack: err?.stack || null,
            time: new Date().toISOString()
        });

        dispatchTelemetry("error");
    };

    // -----------------------------
    // FIRST CLICK
    // -----------------------------
    function trackFirstInput() {
        window.addEventListener("click", function handler() {
            if (firstClickRecorded) return;
            firstClickRecorded = true;

            const start = performance.now();

            requestAnimationFrame(() => {
                const end = performance.now();

                telemetryData.interactionMetrics.firstInputDelay =
                    end - start;

                telemetryData.interactionMetrics.firstClickTime = start;

                dispatchTelemetry("interaction");
            });

            window.removeEventListener("click", handler);
        });
    }

    // -----------------------------
    // SEND DATA (SAFE)
    // -----------------------------
    function dispatchTelemetry(type) {
        const payload = JSON.stringify({
            type,
            ...telemetryData
        });

        console.log("[TELEMETRIE]", type, telemetryData);

        try {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(endpoint, payload);
            } else {
                fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: payload,
                    keepalive: true
                }).catch(() => {});
            }
        } catch (e) {
            console.warn("Telemetry blocked:", e);
        }
    }

    // -----------------------------
    // INIT
    // -----------------------------
    function init() {
        collectPerformanceMetrics();
        trackFirstInput();

        setTimeout(() => {
            dispatchTelemetry("load");
        }, 500);
    }

    // Safe startup
    if ('requestIdleCallback' in window) {
        requestIdleCallback(init);
    } else {
        window.addEventListener("load", init);
    }

})();