/**
 * Device auth flow — client side.
 *
 * 1. POST /api/v1/auth/device/ → get device_code + verification_url
 * 2. Open browser for user to approve
 * 3. Poll /api/v1/auth/device/token/ until approved or timeout
 */

const BASE_URL = "https://agentgif.com";
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_ATTEMPTS = 60; // 5 minutes

interface DeviceResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  api_key: string;
  username: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deviceLogin(): Promise<{ apiKey: string; username: string }> {
  // Step 1: Request device code
  const res = await fetch(`${BASE_URL}/api/v1/auth/device/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to start device auth: ${res.status}`);
  }

  const data = (await res.json()) as DeviceResponse;

  // Step 2: Open browser
  console.log(`\nOpen this URL to authenticate:`);
  console.log(`  ${data.verification_url}\n`);
  console.log(`Your code: ${data.user_code}\n`);

  try {
    const open = (await import("open")).default;
    await open(data.verification_url);
  } catch {
    // Browser open failed — user can copy URL manually
  }

  console.log("Waiting for approval...");

  // Step 3: Poll for token
  const interval = (data.interval || 5) * 1000;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(interval);

    try {
      const tokenRes = await fetch(`${BASE_URL}/api/v1/auth/device/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_code: data.device_code }),
      });

      if (tokenRes.status === 200) {
        const token = (await tokenRes.json()) as TokenResponse;
        return { apiKey: token.api_key, username: token.username };
      }

      // 400 = pending, 403 = denied, 410 = expired
      if (tokenRes.status === 403) {
        throw new Error("Authorization denied by user");
      }
      if (tokenRes.status === 410) {
        throw new Error("Device code expired — try again");
      }
      // 400 = still pending, continue polling
    } catch (err) {
      if (err instanceof Error && err.message.includes("denied")) throw err;
      if (err instanceof Error && err.message.includes("expired")) throw err;
      // Network error — continue polling
    }
  }

  throw new Error("Authentication timed out after 5 minutes");
}
