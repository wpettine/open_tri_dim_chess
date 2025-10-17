# Environment Variables Setup

## Local Development

For local development, no environment variables are needed. The app will automatically use local assets from the `/public` folder.

If you want to test with the CDN locally, create a `.env.local` file (ignored by git):

```bash
VITE_ASSET_CDN_URL=https://pub-c1e064438dc14d9482c4a25803834822.r2.dev
```

## Vercel Deployment

The CDN URL is automatically configured through the `.env.production` file.

Alternatively, you can set it in the Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `VITE_ASSET_CDN_URL`
   - **Value**: `https://pub-c1e064438dc14d9482c4a25803834822.r2.dev`
   - **Environment**: Production

## How It Works

- **Development** (`npm run dev`): Uses local files from `/public/models/`
- **Production** (`npm run build`): 
  - Models are excluded from the build
  - App loads models from Cloudflare R2 CDN
  - Reduces deployment size from 113MB to 1.4MB

## Asset URLs

Assets are automatically resolved based on the environment:

```typescript
// In development: /models/chess/basic/pawn.gltf (local)
// In production: https://pub-c1e064438dc14d9482c4a25803834822.r2.dev/models/chess/basic/pawn.gltf (CDN)
```

The `getAssetUrl()` function in `src/config/assets.ts` handles this automatically.

