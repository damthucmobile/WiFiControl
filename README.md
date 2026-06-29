# Router Management Web Application

A production-style Next.js 15 router management console with a pluggable adapter architecture for multiple router vendors.

## Features
- Router selection and login form with Zod validation
- Adapter-based access layer for TP-Link, ASUS, OpenWrt, MikroTik, UniFi, Huawei, ZTE, and generic HTTP
- Dashboard with router details, device listing, search, sorting, bulk block/disconnect actions, CSV export, and auto-refresh
- Blocked devices page with unblock actions
- Zustand-backed session and device state
- React Query caching and refresh behavior
- Server-side route handlers with adapter-based access

## Structure
- app/ - Next.js app router pages and API routes
- components/ - shared UI components
- router/ - adapters, core interface, services, and vendor types
- store/ - Zustand state stores
- lib/ - utilities and logger helpers

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes
- The included adapters use documented or supported management mechanisms where available and report unsupported features clearly.
- Passwords are never logged and session state remains in memory on the client.
