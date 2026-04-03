Firebase App Hosting（雲端）→ 自動使用 Application Default Credentials（Google 基礎設施內建，不需要私鑰）→ 走 initializeApp() 那條 else

const { initializeApp, getApps } = await import("/node_modules/firebase/app/dist/esm/index.esm2017.js")

npm run dev

firebase deploy --only functions

Invoke-WebRequest -Uri "https://us-central1-tzai-space-pro.cloudfunctions.net/getAllEvents"

Invoke-WebRequest -Method POST -Uri http://localhost:3000/api/migrate
