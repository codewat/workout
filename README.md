# Workoutwork 🏋️‍♂️

A modern, fast Workout Routine Builder & Interval Rest Timer web application built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**.

Inspired by native fitness apps, designed for personal use, portfolio demonstrations, and seamless deployment on **Vercel**.

---

## ✨ Features

- **Routine Builder**:
  - Add / delete workout sets.
  - Support for **Supersets 🔥** (multiple exercises in a single set).
  - Quick templates (Push Day, Pull Day, Leg Day).
  - Auto-saved locally in browser storage (`localStorage`).
- **Active Workout Session & Timer**:
  - Sticky countdown rest timer (30s, 1m, 2m, 3m presets).
  - **Screen Wake Lock API**: Keeps your mobile phone screen awake while working out.
  - **Audio & Haptic Feedback**: Beep alerts at 3-2-1 countdown, chime alarm on time's up, and mobile vibration support.
  - Big red alert dismissal button when timer expires.
  - Clickable exercise cards that turn emerald green with checkmarks as you complete sets.
  - Celebration confetti 🎉 on workout completion.

---

## 🚀 Running Locally

```bash
# 1. Go to the project directory
cd /Users/oninninoonin/Downloads/apps/workout

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ How to Deploy to Vercel

### Method 1: Via GitHub (Recommended)
1. Create a new repository on GitHub (e.g. `workout-app`).
2. Push this project to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/workout-app.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
4. Import your GitHub repository.
5. Click **"Deploy"** — Vercel will automatically detect Next.js and give you a live link (`your-app.vercel.app`)!

### Method 2: Via Vercel CLI
```bash
# Install and run Vercel CLI
npx vercel
```
Follow the simple terminal prompts to log in and deploy.
