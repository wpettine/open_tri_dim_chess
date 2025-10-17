# Deployment Guide

## Overview

This app is configured to deploy to Vercel with assets (3D models) served from Cloudflare R2 CDN.

**Why CDN?** The 3D chess models are ~111MB, exceeding Vercel's 100MB deployment limit. By hosting models on Cloudflare R2, the deployment is only 1.4MB.

## Quick Deploy

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Configure Cloudflare R2 CDN for model assets"
   git push origin main
   ```

2. **Vercel will automatically deploy** (if already connected to GitHub)
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Watch the deployment progress
   - Once complete, your app will be live!

## First-Time Setup

If you haven't connected Vercel yet:

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select `wpettine/open_tri_dim_chess`
   - Vercel auto-detects Vite configuration

3. **Deploy**
   - Click "Deploy" (no manual configuration needed)
   - Environment variables are set in `vercel.json`
   - Wait ~1-2 minutes for build

4. **Get Your URL**
   - Copy the deployment URL (e.g., `https://open-tri-dim-chess.vercel.app`)
   - Share with beta testers!

## How It Works

### Development (`npm run dev`)
- Uses local assets from `/public/models/`
- No CDN configuration needed
- Models load from localhost

### Production (`npm run build` + Vercel)
- Vite plugin excludes models from `dist/` folder
- Models load from Cloudflare R2: `https://pub-c1e064438dc14d9482c4a25803834822.r2.dev`
- Deployment size: 1.4MB (vs 113MB)
- Environment variable `VITE_ASSET_CDN_URL` set in `vercel.json`

### Code Changes
The `getAssetUrl()` helper in `src/config/assets.ts` automatically handles URL resolution:
- Dev: `/models/chess/basic/pawn.gltf` (local)
- Prod: `https://pub-c1e064438dc14d9482c4a25803834822.r2.dev/models/chess/basic/pawn.gltf` (CDN)

## Cloudflare R2 Setup

Your R2 bucket is already configured:
- **Bucket**: `chess-game-assets` (or similar)
- **Public URL**: https://pub-c1e064438dc14d9482c4a25803834822.r2.dev
- **Structure**: Mirrors `/public` directory structure

Current structure:
```
models/
└── chess/
    └── basic/
        ├── pawn.gltf + pawn.bin
        ├── rook.gltf + rook.bin
        ├── knight.gltf + knight.bin
        ├── bishop.gltf + bishop.bin
        ├── queen.gltf + queen.bin
        └── king.gltf + king.bin
fonts/
└── microgrammanormal.ttf (optional, currently served from Vercel)
```

## Updating Models

To update 3D models:

1. **Update local files** in `/public/models/`
2. **Upload to R2**:
   - Via Cloudflare Dashboard, or
   - Use Wrangler CLI: `wrangler r2 object put chess-game-assets/models/chess/basic/pawn.gltf --file=./public/models/chess/basic/pawn.gltf`
3. **Redeploy** (or just push to GitHub)

## Custom Domain (Optional)

In Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration steps
4. Free SSL included

## Troubleshooting

### Models not loading on Vercel

1. Check R2 bucket is publicly accessible
2. Verify URL in browser: https://pub-c1e064438dc14d9482c4a25803834822.r2.dev/models/chess/basic/pawn.gltf
3. Check browser console for CORS errors
4. Ensure `vercel.json` has correct CDN URL

### Build fails on Vercel

1. Check build logs in Vercel dashboard
2. Verify `package.json` dependencies are correct
3. Ensure Node version matches: `"engines": { "node": ">=20.19.0" }`

### Works locally but not in production

1. Test with CDN locally:
   ```bash
   # Create .env.local (gitignored)
   echo "VITE_ASSET_CDN_URL=https://pub-c1e064438dc14d9482c4a25803834822.r2.dev" > .env.local
   npm run build
   npm run preview
   ```
2. Check browser network tab for 404s

## Future: Firebase Integration

When adding multiplayer with Firebase:

1. Add Firebase to `package.json`:
   ```bash
   npm install firebase
   ```

2. Add Firebase config to Vercel Environment Variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - etc.

3. Initialize Firebase in your app

4. **No hosting changes needed!** Vercel + Firebase work seamlessly together.

## Cost Summary

- **Vercel Hosting**: Free (Hobby tier)
- **Cloudflare R2**: Free (10GB storage, unlimited egress on free tier)
- **Custom Domain**: Free on Vercel
- **Total**: $0/month 🎉

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Cloudflare R2: https://developers.cloudflare.com/r2/

