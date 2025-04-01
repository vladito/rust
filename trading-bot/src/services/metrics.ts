import { Metrics } from '../config/types';
import { logger } from './logger';

export class MetricsService {
    private metrics: Metrics;
    private readonly metricsUpdateInterval: number = 60000; // 1 minute

    constructor() {
        this.metrics = {
            tradesExecuted: 0,
            successfulTrades: 0,
            failedTrades: 0,
            averageLatency: 0,
            profitLoss: 0
        };

        setInterval(() => this.logMetrics(), this.metricsUpdateInterval);
    }

    public incrementTradesExecuted(): void {
        this.metrics.tradesExecuted++;
    }

    public incrementSuccessfulTrades(): void {
        this.metrics.successfulTrades++;
    }

    public incrementFailedTrades(): void {
        this.metrics.failedTrades++;
    }

    public updateProfitLoss(amount: number): void {
        this.metrics.profitLoss += amount;
    }

    public updateLatency(latency: number): void {
        this.metrics.averageLatency = 
            (this.metrics.averageLatency * this.metrics.tradesExecuted + latency) / 
            (this.metrics.tradesExecuted + 1);
    }

    private logMetrics(): void {
        logger.info('Current Metrics', { metrics: this.metrics });
    }

    public getMetrics(): Metrics {
        return { ...this.metrics };
    }
}
