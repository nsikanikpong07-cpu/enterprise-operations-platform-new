export const appConfig = () => {
    const port = Number.parseInt(process.env.PORT ?? '3000', 10);
    const pgPort = Number.parseInt(process.env.PGPORT ?? '5432', 10);
    return {
        nodeEnv: process.env.NODE_ENV ?? 'development',
        port: Number.isNaN(port) ? 3000 : port,
        database: {
            host: process.env.PGHOST ?? 'localhost',
            port: Number.isNaN(pgPort) ? 5432 : pgPort,
            username: process.env.PGUSER ?? 'enterprise_app',
            password: process.env.PGPASSWORD ?? '',
            database: process.env.PGDATABASE ?? 'enterprise_operations',
            url: process.env.DATABASE_URL,
        },
    };
};
//# sourceMappingURL=app.config.js.map