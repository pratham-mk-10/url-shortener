# Manual QA Checklist

Go through these deliberately. For each, note the EXPECTED behavior before you try it — that way you can tell "working" from "looks working but isn't."

## Auth
- [ ] Register with a new email → lands on Dashboard, shows correct email
- [ ] Register with an email that already exists → should show an error (409), NOT silently succeed
- [ ] Register with a weak/missing password → should this be rejected? (currently NOT validated — worth deciding if you want a minimum length)
- [ ] Login with correct credentials → works
- [ ] Login with wrong password → shows "Invalid credentials" (just fixed)
- [ ] Login with an email that was never registered → shows "Invalid credentials" (just fixed)
- [ ] Log out → redirects to /login, and manually going back to /dashboard should bounce you back to /login
- [ ] Refresh the page while logged in → stays logged in (session restore)
- [ ] Wait 15+ minutes while logged in, then do something → access token should silently refresh, you shouldn't get logged out (harder to test patiently, but worth knowing WHY it should work: refresh-on-401 interceptor)

## URL Creation
- [ ] Create a URL with a valid link → appears in the list immediately
- [ ] Try creating a URL with garbage text (not a URL) → should show a 400 validation error
- [ ] Try creating a URL while logged out (e.g. hit the API directly) → should be rejected (401)
- [ ] Create 11 URLs within 60 seconds → the 11th should be rate-limited (429) — this exercises the rate limiter we built

## Redirect
- [ ] Visit a real short URL → redirects to the correct long URL
- [ ] Visit a shortCode that doesn't exist (e.g. `/zzzzzzz`) → 404
- [ ] Visit the SAME short URL twice in a row → both should redirect correctly (tests the cache hit path, not just cache miss)

## Analytics & Real-time
- [ ] Click a short URL, then check the dashboard (same tab, no manual refresh) → click count updates live
- [ ] Click a short URL from an incognito/different browser (simulating a different visitor) → the ORIGINAL owner's dashboard should still update — but a DIFFERENT logged-in user's dashboard should NOT see it (tests Socket.io room isolation)
- [ ] Try viewing another user's analytics by guessing their shortCode (if you have two test accounts) → should be 403, not show their data (IDOR check)
- [ ] Click a short URL from your phone (if on the same network) vs a laptop → device breakdown chart should distinguish mobile vs desktop

## Things that are EASY to think work but might not
- Two browser tabs logged in as the SAME user, both on /dashboard → does clicking a link update BOTH tabs live? (tests whether the socket room correctly includes multiple connections for one user)
- Logging in, then logging out, then logging back in AS A DIFFERENT USER in the same browser tab (no page reload in between) → does the dashboard correctly show the new user's own URLs, not leftover state from the previous user?
- Creating a URL, then immediately hard-refreshing before the create request even finishes → does anything break?

## How to actually test these systematically (not just clicking around)
Two options, both legitimate:
1. **Manual, deliberate** — pick one item above, form a hypothesis about what SHOULD happen, then do it and compare. This is what caught the login bug.
2. **Ask me to write an automated test for a specific flow** — I can script it with Playwright (like I did for the auth flow and dashboard live-update tests) so it's repeatable instead of manual every time. Good candidates: the rate-limiter test, the cross-user isolation test, and the IDOR check — these are exactly the kind of thing that's easy to accidentally break later without noticing.
