# Deployment Guide

## Local development

1. Copy `.env.example` to `.env`.
2. Set `GEMINI_API_KEY`.
3. Start frontend + backend:
   - `npm run dev:full`

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8787`.

## Vercel

- Vercel uses `api/index.ts` to serve backend API routes.
- Frontend can be deployed as static Vite build.
- Set `GEMINI_API_KEY` in Vercel Project Settings.
- `vercel.json` already rewrites `/api/*` and `/health` to the backend handler.

## Render

- `render.yaml` included for a web service.
- Build command: `npm install && npm run build:server`
- Start command: `npm run start`
- Set `GEMINI_API_KEY` in Render environment settings.

## AWS (ECS/App Runner/Elastic Beanstalk)

- Use the included `Dockerfile`.
- Build image and push to ECR:
  - `docker build -t virtualfit-ai .`
  - `docker tag virtualfit-ai:latest <account>.dkr.ecr.<region>.amazonaws.com/virtualfit-ai:latest`
  - `docker push <account>.dkr.ecr.<region>.amazonaws.com/virtualfit-ai:latest`
- Set container env vars:
  - `GEMINI_API_KEY`
  - `PORT` (optional, defaults to `8787`)
