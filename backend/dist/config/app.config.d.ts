export interface AppConfig {
    nodeEnv: string;
    port: number;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        url?: string;
    };
}
export declare const appConfig: () => AppConfig;
