import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Load .env manually (more reliable than dotenv in monorepo contexts)
const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps', 'api', '.env'),
  resolve(__dirname, '..', '..', '.env'),
];
let envLoaded = false;
for (const p of envPaths) {
  if (existsSync(p)) {
    const content = readFileSync(p, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
    envLoaded = true;
    console.log(`[env] Loaded .env from: ${p}`);
    break;
  }
}
if (!envLoaded) {
  console.log(`[env] No .env found. Tried: ${envPaths.join(', ')}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const port = process.env.API_PORT || 3002;
  const host = process.env.API_HOST || '0.0.0.0';

  const corsOrigins = (process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5175']
  ).map((o) => o.trim()).filter(Boolean);

  // İzinli alan adı kalıpları: Vercel önizlemeleri + üretim alan adları (web ve müşteri portalı)
  const allowedHostPatterns = [/(^|\.)vercel\.app$/, /(^|\.)otoservisapp\.com$/];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Origin göndermeyen istemciler (curl, sunucu-sunucu, keep-alive pingleri)
      if (!origin) return callback(null, true);
      const normalized = origin.trim();
      // Electron masaüstü uygulaması file:// üzerinden çalışırken Origin: "null" gönderir
      if (normalized === 'null') return callback(null, true);
      if (corsOrigins.includes(normalized)) return callback(null, true);
      try {
        const { protocol, hostname } = new URL(normalized);
        if (protocol === 'https:' && allowedHostPatterns.some((p) => p.test(hostname))) {
          return callback(null, true);
        }
      } catch {
        // Geçersiz origin biçimi: izin verme
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port, host);
  console.log(`OtoServis API running on http://${host}:${port}`);
}

bootstrap();
