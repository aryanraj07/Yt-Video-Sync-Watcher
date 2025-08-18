# YT Video Watcher in Sync

This project is to wactch videos together with your friends

## Flow of login and register

Login: api.post("/users/login") → backend sets accessToken & refreshToken in HTTP-only cookies → you store only user info in localStorage (no tokens).

API call: api.get("/users/profile") → if access token expired → interceptor runs → refresh endpoint called → cookies updated → retry request.

Logout: call backend logout endpoint → clear cookies → remove localStorage user data.
