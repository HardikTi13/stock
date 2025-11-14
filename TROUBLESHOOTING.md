# Troubleshooting Guide

## Common Errors and Solutions

### Backend Errors

#### 1. "Cannot find module" errors
**Solution:**
```powershell
cd backend
npm install
```

#### 2. "Port already in use" error
**Solution:**
```powershell
# Find and kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

#### 3. "ALPHAVANTAGE_API_KEY not configured"
**Solution:**
- Add your API key to `backend/.env`:
```
ALPHAVANTAGE_API_KEY=your_key_here
```

#### 4. Socket.IO initialization errors
**Solution:**
- Make sure `server.js` loads before services try to use socket
- Restart the backend server

#### 5. CoinGecko rate limit errors
**Solution:**
- Wait 1-2 minutes between requests
- Increase cache TTL in `.env`:
```
CACHE_TTL_REALTIME=60
CACHE_TTL_HOURLY=300
```

### Frontend Errors

#### 1. "Module not found" errors
**Solution:**
```powershell
cd frontend
npm install
```

#### 2. "Cannot find module 'react-plotly.js'"
**Solution:**
```powershell
cd frontend
npm install react-plotly.js plotly.js
```

#### 3. Firebase authentication errors
**Solution:**
- Check `frontend/.env` has all Firebase config values
- Enable Email/Password auth in Firebase Console

#### 4. "Network Error" or "CORS Error"
**Solution:**
- Make sure backend is running on port 3001
- Check `REACT_APP_API_URL` in `frontend/.env` matches backend URL

#### 5. React Router warnings
**Solution:**
- These are just warnings for future versions, not errors
- Can be ignored or add future flags to Router config

## Quick Fixes

### Restart Everything
```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm start
```

### Clear Cache and Reinstall
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Check Environment Variables
```powershell
# Backend
cd backend
Get-Content .env

# Frontend
cd frontend
Get-Content .env
```

## Still Having Issues?

Please share:
1. Exact error message from terminal
2. Which terminal (backend/frontend)
3. What you were doing when error occurred

