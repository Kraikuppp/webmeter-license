# 🚀 Deploy to Render (Easy Mode with Cascade)

I have prepared a `render.yaml` Blueprint for you. This makes deployment automatic!

## 1. Prepare Database (Neon.tech)
Since Render's free database expires in 90 days, we use **Neon** (Free Forever).

1. Go to [Neon.tech](https://neon.tech) and Sign Up.
2. Create a new Project.
3. Copy the **Connection String** (looks like `postgres://...`).
   - Select **Pooled connection** if available.

## 2. Deploy to Render
1. Push this code to your GitHub/GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your repository.
5. Render will detect `render.yaml`.
6. It will ask for `DATABASE_URL`. **Paste your Neon Connection String here.**
7. Click **Apply**.

## 3. Initialize Database
Once deployed, you need to create the tables.
1. Go to **Neon Dashboard** -> **SQL Editor**.
2. Copy the content of `src/scripts/schema.sql`.
3. Paste and Run it in Neon.

## Done! 🎉
Your API is now live.
- **Admin Secret:** Check Render Dashboard -> Environment Variables -> `ADMIN_API_SECRET`
- **Installer Secret:** Check Render Dashboard -> Environment Variables -> `INSTALLER_SECRET`

## 💡 Tips
- **Cold Start:** On the free plan, the server sleeps after 15 mins of inactivity. Use [UptimeRobot](https://uptimerobot.com/) to ping your `/health` endpoint every 5 minutes to keep it awake.

