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

    /* =========================
       STATE MANAGEMENT (WEB STORAGE)
    ========================= */

    const optOut = localStorage.getItem("utm_optout");
    let telemetryDisabled = false;

    if (optOut === "true") {
        console.log("🚫 Telemetrie dezactivată (GDPR)");
        telemetryDisabled = true;
    }

    // -------------------------
    // VISITS (localStorage safe)
    // -------------------------
    let visitCount;

    try {
        visitCount = parseInt(localStorage.getItem("utm_telemetry_visits"), 10);

        if (isNaN(visitCount)) {
            visitCount = 0;
        }

        visitCount += 1;

    } catch (e) {
        visitCount = 1;
    }

    localStorage.setItem("utm_telemetry_visits", visitCount);

    // -------------------------
    // SESSION START (timestamp fix)
    // -------------------------
    let sessionStartTime = sessionStorage.getItem("utm_session_start_time");

    if (!sessionStartTime) {
        sessionStartTime = Date.now();
        sessionStorage.setItem("utm_session_start_time", sessionStartTime);
    }

    // -------------------------
    // SESSION HISTORY (safe parse)
    // -------------------------
    let sessionHistory = [];

    try {
        sessionHistory = JSON.parse(localStorage.getItem("utm_session_durations")) || [];
        if (!Array.isArray(sessionHistory)) sessionHistory = [];
    } catch (e) {
        sessionHistory = [];
    }

    telemetryData.userProfile = {
        historicalVisits: visitCount,
        sessionStartedAt: sessionStartTime,
        isNewUser: visitCount === 1,
        sessionHistory: sessionHistory
    };

    /* =========================
       PERFORMANCE
    ========================= */

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

    /* =========================
       ERROR TRACKING
    ========================= */

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

    /* =========================
       FIRST CLICK
    ========================= */

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

    /* =========================
       SEND DATA
    ========================= */

    function dispatchTelemetry(type) {

        if (telemetryDisabled) return;

        const payload = JSON.stringify({
            type,
            ...telemetryData
        });

        console.log("[TELEMETRIE]", type, telemetryData);

        try {
            navigator.sendBeacon?.(endpoint, payload);
        } catch (e) {
            console.warn("Telemetry error:", e);
        }
    }

    /* =========================
       INIT
    ========================= */

    function init() {
        collectPerformanceMetrics();
        trackFirstInput();

        console.group("📊 WEB STORAGE STATE");
        console.log("Visits:", visitCount);
        console.log("Session start:", sessionStartTime);
        console.groupEnd();

        setTimeout(() => {
            dispatchTelemetry("load");
        }, 500);
    }

    /* =========================
       START
    ========================= */

    if ('requestIdleCallback' in window) {
        requestIdleCallback(init);
    } else {
        window.addEventListener("load", init);
    }

    /* =========================
       SESSION DURATION + HISTORY
    ========================= */

    window.addEventListener("beforeunload", () => {

        try {
            const start = Number(sessionStartTime);
            const end = Date.now();

            const durationSec = Math.floor((end - start) / 1000);

            let history = [];

            try {
                history = JSON.parse(localStorage.getItem("utm_session_durations")) || [];
                if (!Array.isArray(history)) history = [];
            } catch (e) {
                history = [];
            }

            history.push(durationSec);

            localStorage.setItem(
                "utm_session_durations",
                JSON.stringify(history)
            );

            const avg =
                history.reduce((a, b) => a + b, 0) / history.length;

            console.log("⏱ Durată sesiune:", durationSec);
            console.log("📊 Media sesiunilor:", avg.toFixed(2));

        } catch (e) {
            console.warn("Corrupted storage → reset");
            localStorage.removeItem("utm_session_durations");
        }
    });

})();