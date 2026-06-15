# Deployment Guide for ChemDraw Web

## GitHub Repository Setup

Since the automated GitHub CLI deployment encountered permission issues, here are the manual steps to set up the repository:

### Option 1: Using GitHub Web Interface

1. Go to [GitHub.com](https://github.com/new)
2. Create a new repository named `chemdraw-web`
3. Choose "Public" or "Private" based on your preference
4. Do NOT initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"
6. Follow the instructions to push existing repository:

```bash
cd chemdraw-web
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chemdraw-web.git
git push -u origin main
```

### Option 2: Using GitHub CLI with Correct Permissions

Ensure your GitHub token has repository creation permissions:

```bash
gh auth refresh -h github.com -s repo
gh repo create chemdraw-web --public --source=. --remote=origin --push
```

## Installation & Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment Options

### Vercel (Recommended for React/Vite apps)

1. Push code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Import the GitHub repository
4. Vercel will automatically detect Vite configuration
5. Click "Deploy"

### Netlify

1. Push code to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build command: `pnpm build`
6. Publish directory: `dist`
7. Click "Deploy site"

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t chemdraw-web .
docker run -p 3000:3000 chemdraw-web
```

### Traditional Server (Node.js)

```bash
# Build
pnpm build

# Install serve globally
npm install -g serve

# Serve the dist folder
serve -s dist -l 3000
```

## Environment Configuration

For production deployments, you may want to:

1. Update `staticResourcesUrl` in `src/App.tsx` to point to a CDN or local static files
2. Add environment variables for API endpoints (Phase 4+)
3. Configure CORS headers if using a separate backend

## Performance Optimization

- Ketcher WASM modules are large (~5-10MB)
- Consider using a CDN for static resources
- Enable gzip compression on your server
- Use lazy loading for heavy components

## Troubleshooting

### WASM Module Loading Issues

If you see errors about Indigo WASM not loading:

1. Check that `staticResourcesUrl` is correctly configured
2. Ensure CORS headers are properly set
3. Verify the CDN or static file path is accessible

### Memory Issues

If the application crashes with out-of-memory errors:

1. Ensure WASM objects are properly freed (this is handled in Phase 2)
2. Reduce the number of concurrent operations
3. Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096`

## Next Steps

- Implement Phase 2: Property calculations with RDKit.js
- Add Phase 3: Advanced structures and reactions
- Deploy to production platform
- Monitor performance and user feedback
