import { HealthCheck } from '../config/types';
import { logger } from './logger';
import os from 'os';

export class HealthService {
    private health: HealthCheck;
    private readonly healthCheckInterval: number = 30000; // 30 seconds

    constructor() {
        this.health = {
            lastPing: new Date(),
            wsConnected: false,
            activeTokens: 0,
            cpuUsage: 0,
            memoryUsage: 0
        };

        setInterval(() => this.updateHealth(), this.healthCheckInterval);
    }

    public updateWSStatus(connected: boolean): void {
        this.health.wsConnected = connected;
        this.health.lastPing = new Date();
    }

    public updateActiveTokens(count: number): void {
        this.health.activeTokens = count;
    }

    private async updateHealth(): Promise<void> {
        try {
            this.health.cpuUsage = os.loadavg()[0];
            this.health.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            
            if (this.shouldAlert()) {
                await this.sendAlert();
            }

            logger.info('Health Check', { health: this.health });
        } catch (error) {
            logger.error('Health check update failed', { error });
        }
    }

    private shouldAlert(): boolean {
        return (
            this.health.cpuUsage > 80 ||
            this.health.memoryUsage > 1024 ||
            !this.health.wsConnected ||
            Date.now() - this.health.lastPing.getTime() > 60000
        );
    }

    private async sendAlert(): Promise<void> {
        // Implement alert notification (email, Slack, etc.)
        logger.warn('System alert triggered', { health: this.health });
    }

    public getHealth(): HealthCheck {
        return { ...this.health };
    }
}
