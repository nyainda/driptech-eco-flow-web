import { useEffect } from 'react';

interface WebVitalsMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

export const useWebVitals = (onMetric?: (metric: WebVitalsMetric) => void) => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // LCP Observer
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;

            const value = lastEntry.renderTime || lastEntry.loadTime;
            const metric: WebVitalsMetric = {
                name: 'LCP',
                value,
                rating: value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor',
                delta: value,
                id: lastEntry.id || 'lcp'
            };

            console.log('📊 LCP:', {
                value: `${(value / 1000).toFixed(2)}s`,
                rating: metric.rating,
                element: lastEntry.element,
                url: lastEntry.url || 'N/A'
            });

            onMetric?.(metric);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // FCP Observer
        const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                if (entry.name === 'first-contentful-paint') {
                    const value = entry.startTime;
                    const metric: WebVitalsMetric = {
                        name: 'FCP',
                        value,
                        rating: value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor',
                        delta: value,
                        id: 'fcp'
                    };

                    console.log('📊 FCP:', {
                        value: `${(value / 1000).toFixed(2)}s`,
                        rating: metric.rating
                    });

                    onMetric?.(metric);
                }
            });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    const metric: WebVitalsMetric = {
                        name: 'CLS',
                        value: clsValue,
                        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
                        delta: entry.value,
                        id: 'cls'
                    };

                    console.log('📊 CLS:', {
                        value: clsValue.toFixed(3),
                        rating: metric.rating
                    });

                    onMetric?.(metric);
                }
            }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        return () => {
            lcpObserver.disconnect();
            fcpObserver.disconnect();
            clsObserver.disconnect();
        };
    }, [onMetric]);
};

export default useWebVitals;
