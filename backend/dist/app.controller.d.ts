import { DataSource } from 'typeorm';
import { AppService } from './app.service.js';
export declare class AppController {
    private readonly appService;
    private readonly dataSource;
    constructor(appService: AppService, dataSource: DataSource);
    getHello(): string;
    health(): {
        status: string;
        message: string;
    };
    databaseHealth(): Promise<{
        status: string;
        message: string;
    }>;
}
