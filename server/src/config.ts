// server/src/config.ts
export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  apiKey: process.env.API_KEY ?? '',
}
