# Bolibro Realty Backend

## Railway Deployment Instructions

### Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli)
- Node.js and npm

### Steps to Deploy

1. Install Railway CLI:

```
npm i -g @railway/cli
```

2. Login to Railway:

```
railway login
```

3. Initialize your project:

```
cd server
railway init
```

4. Link to an existing project (if you've already created one in Railway dashboard):

```
railway link
```

5. Add your environment variables from `.env` to Railway:

```
railway vars set PORT=3001
railway vars set DATABASE_URL="your-database-url"
railway vars set SUPABASE_URL="your-supabase-url"
railway vars set SUPABASE_ANON_KEY="your-anon-key"
railway vars set SUPABASE_SERVICE_KEY="your-service-key"
railway vars set JWT_SECRET="your-jwt-secret"
```

6. Deploy your application:

```
railway up
```

7. Open your deployed application:

```
railway open
```

### Important Notes

- Make sure your `DATABASE_URL` is properly set in Railway
- Use the pooler connection for better performance
- Keep your service keys secure and don't expose them in public repositories
- If you need to run database migrations during deployment, add a postinstall script to your package.json:
  ```
  "postinstall": "npx prisma generate && npx prisma migrate deploy"
  ```

### Monitoring and Logs

- View logs: `railway logs`
- Check service status: `railway status`
 