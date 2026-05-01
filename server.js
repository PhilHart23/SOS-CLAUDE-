const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const app = express();

// Explicitly allow all origins with full CORS headers
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle OPTIONS preflight for all routes
app.options("*", cors());

app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const PORT = process.env.PORT || 3001;

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "VerifyBase SOS Lookup API" });
});

// Main search endpoint
// POST /search  { searchTerm: "Acme Corp", states: ["TX"] }
app.post("/search", async (req, res) => {
  if (!APIFY_TOKEN) {
    return res.status(500).json({ error: "Server misconfigured: APIFY_TOKEN not set." });
  }

  const { searchTerm, states } = req.body;
  if (!searchTerm || typeof searchTerm !== "string" || !searchTerm.trim()) {
    return res.status(400).json({ error: "searchTerm is required." });
  }

  const input = {
    searchTerms: [searchTerm.trim()],
    states: Array.isArray(states) && states.length > 0 ? states : [],
    maxResultsPerState: 10,
  };

  try {
    // Step 1: Start the actor run
    console.log(`[search] Starting Apify run for: "${searchTerm}"`);
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/lentic_clockss~us-business-entity-search/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }
    );

    if (!runRes.ok) {
      const errBody = await runRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Apify error: ${runRes.status}`;
      console.error("[search] Apify run start failed:", msg);
      return res.status(502).json({ error: msg });
    }

    const runData = await runRes.json();
    const runId = runData?.data?.id;
    if (!runId) return res.status(502).json({ error: "No run ID returned from Apify." });

    console.log(`[search] Run started: ${runId}`);

    // Step 2: Poll until complete (max 2 minutes)
    let attempts = 0;
    let finished = false;
    while (attempts < 40 && !finished) {
      await sleep(3000);
      const statusRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusData = await statusRes.json();
      const status = statusData?.data?.status;
      console.log(`[search] Poll ${attempts + 1}: ${status}`);

      if (status === "SUCCEEDED") {
        finished = true;
      } else if (["FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
        return res.status(502).json({ error: `Apify actor run ${status.toLowerCase()}.` });
      }
      attempts++;
    }

    if (!finished) {
      return res.status(504).json({ error: "Search timed out. Try a more specific query." });
    }

    // Step 3: Fetch results
    const dataRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=50`
    );
    const items = await dataRes.json();
    console.log(`[search] Done — ${items.length} results`);

    return res.json({ results: items });
  } catch (err) {
    console.error("[search] Unexpected error:", err.message);
    return res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

app.listen(PORT, () => {
  console.log(`VerifyBase backend running on port ${PORT}`);
});
