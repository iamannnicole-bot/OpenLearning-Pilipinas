// ═══════════════════════════════════════════════════════════════════════════════
// /api/submit-eval.js  ·  Vercel Serverless Function
// Routes the event evaluation form to Google Forms → Google Sheets
//
// ── SETUP STEPS ───────────s───────────────────────────────────────────────────
//
//  1. CREATE YOUR GOOGLE FORM
//     Add one question per field listed in FIELD MAP below.
//     Question type guide:
//       Short answer  → name, email, mobile, title, instName, rating,
//                        valuableSession, takeaway, challenge, comments, help
//       Paragraph     → takeaway, challenge, comments, help  (any of these can
//                        be paragraph for more space — your call)
//       Dropdown      → relevance, lms, learners, timeline, intent, orgType,
//                        attendFuture
//       Checkboxes    → interests  (tick "Allow 'Other' answer" if you like)
//       Short answer  → learnMore  (use "true" / "false" as text)
//
//  2. GET THE ENTRY IDs
//     a. Open your Google Form in a browser.
//     b. Open DevTools → Network tab.
//     c. Click "Preview" on the form, fill one field, submit.
//     d. In the Network tab, look for a request to "formResponse" and inspect
//        the payload — you'll see entry.XXXXXXXXX = value pairs.
//     e. Alternatively: right-click any question input in the preview and
//        inspect its `name` attribute — it will be "entry.XXXXXXXXX".
//     f. Paste each entry ID into the FIELD MAP below.
//
//  3. GET THE FORM ACTION URL
//     a. In the form preview, right-click the Submit button → Inspect.
//     b. Find the parent <form> tag — copy its `action` attribute.
//        It looks like:
//        https://docs.google.com/forms/u/0/d/e/1FAIpQLSe.../formResponse
//     c. Paste it as GOOGLE_FORM_URL below.
//
//  4. DEPLOY
//     Save this file as /api/submit-eval.js in your Vercel project.
//     No environment variables needed — the URL is baked in below.
//     (If you'd rather keep the URL private, move it to a GOOGLE_EVAL_FORM_URL
//     environment variable in your Vercel dashboard and read it with
//     process.env.GOOGLE_EVAL_FORM_URL.)
//
// ═══════════════════════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────────────────────

// Paste your Google Form's formResponse URL here:

const GOOGLE_FORM_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLScMq5KvVS648slKLneEg16KsgqgHUDO-5TGSeCXU4TtmBQsNA/formResponse";

// ── FIELD MAP ─────────────────────────────────────────────────────────────────
// Left side  = data-k value used in index.html
// Right side = entry.XXXXXXXXX from your Google Form
//
// Replace every "entry.PLACEHOLDER_XXXXXXXXX" with the real entry ID
// you captured in setup step 2.
//
// ┌─────────────────┬────────────────────────────────┬───────────────────────────────────────┐
// │ data-k key      │ Google Form question label      │ Google Form entry ID                  │
// ├─────────────────┼────────────────────────────────┼───────────────────────────────────────┤
// │ name            │ Full name                       │ entry.PLACEHOLDER_NAME                │
// │ email           │ Email address                   │ entry.PLACEHOLDER_EMAIL               │
// │ rating          │ Overall rating (1–5)            │ entry.PLACEHOLDER_RATING              │
// │ valuableSession │ Most valuable session           │ entry.PLACEHOLDER_VALUABLE_SESSION    │
// │ takeaway        │ Biggest takeaway                │ entry.PLACEHOLDER_TAKEAWAY            │
// │ relevance       │ Relevance to institution        │ entry.PLACEHOLDER_RELEVANCE           │
// │ interests       │ Topics of interest (checkboxes) │ entry.PLACEHOLDER_INTERESTS           │
// │ challenge       │ Biggest challenge               │ entry.PLACEHOLDER_CHALLENGE           │
// │ attendFuture    │ Would attend future events      │ entry.PLACEHOLDER_ATTEND_FUTURE       │
// │ comments        │ Additional comments             │ entry.PLACEHOLDER_COMMENTS            │
// │ learnMore       │ Opted in to learn more          │ entry.PLACEHOLDER_LEARN_MORE          │
// │ mobile          │ Mobile number (optional)        │ entry.PLACEHOLDER_MOBILE              │
// │ title           │ Job title / position (optional) │ entry.PLACEHOLDER_TITLE               │
// │ instName        │ Institution name (optional)     │ entry.PLACEHOLDER_INST_NAME           │
// │ orgType         │ Organization type (optional)    │ entry.PLACEHOLDER_ORG_TYPE            │
// │ lms             │ Current LMS (optional)          │ entry.PLACEHOLDER_LMS                 │
// │ learners        │ Number of learners (optional)   │ entry.PLACEHOLDER_LEARNERS            │
// │ timeline        │ Implementation timeline (opt.)  │ entry.PLACEHOLDER_TIMELINE            │
// │ intent          │ I would like to… (optional)     │ entry.PLACEHOLDER_INTENT              │
// │ help            │ How can we help? (optional)     │ entry.PLACEHOLDER_HELP                │
// └─────────────────┴────────────────────────────────┴───────────────────────────────────────┘

const FIELD_MAP = {
  name:             "entry.1370393686",
  email:            "entry.589179873",
  rating:           "entry.2145175924",
  valuableSession:  "entry.1812843657",
  takeaway:         "entry.1186003422",
  relevance:        "entry.2104539433",
  interests:        "entry.1502755867",
  challenge:        "entry.1664234364",
  attendFuture:     "entry.577195242",
  comments:         "entry.791289815",
  learnMore:        "entry.1159734676",
  mobile:           "entry.2102680315",
  title:            "entry.1340506671",
  instName:         "entry.2033719170",
  orgType:          "entry.949586048",
  lms:              "entry.1395717713",
  learners:         "entry.2084354816",
  timeline:         "entry.1522523337",
  intent:           "entry.32141127",
  help:             "entry.456685102",
};

// ── HANDLER ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // Basic server-side validation (mirrors the frontend checks)
  const required = ["name", "email", "rating"];
  for (const key of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      return res.status(422).json({ error: `Missing required field: ${key}` });
    }
  }

  // Build the URL-encoded form payload for Google Forms
  const params = new URLSearchParams();

  for (const [key, entryId] of Object.entries(FIELD_MAP)) {
    const value = body[key];

    // Skip undefined / empty optional fields
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      // Checkbox fields (e.g. interests): each selected value needs its own
      // entry parameter.  Google Forms accepts repeated keys for checkboxes.
      for (const item of value) {
        if (item) params.append(entryId, item);
      }
    } else {
      params.append(entryId, String(value).trim());
    }
  }

  // Fire-and-forget POST to Google Forms
  // Google returns a 200 even when the form submission is successful;
  // we don't need to parse the response.
  try {
    const gRes = await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    // Google redirects (302) on success; fetch follows redirects by default.
    // A status < 500 is good enough to consider it accepted.
    if (gRes.status >= 500) {
      console.error("Google Forms returned a server error:", gRes.status);
      // Still return 200 to the client — the form data was valid; we'll
      // investigate on the server side.  Adjust to 502 if you prefer.
    }
  } catch (err) {
    // Network failure submitting to Google — log but don't block the user
    console.error("Failed to reach Google Forms:", err);
  }

  return res.status(200).json({ ok: true });
}

// ── GOOGLE SHEETS COLUMN REFERENCE ───────────────────────────────────────────
//
// When Google Forms is connected to a Sheet (Responses → Link to Sheets),
// each entry maps to a column.  The column header matches the question label
// you gave in the form, not the entry ID.  Suggested column order:
//
//   A  Timestamp (auto)
//   B  Full name
//   C  Email address
//   D  Overall rating (1–5)
//   E  Most valuable session
//   F  Biggest takeaway
//   G  Relevance to institution
//   H  Topics of interest
//   I  Biggest challenge
//   J  Would attend future events
//   K  Additional comments
//   L  Opted in to learn more
//   M  Mobile number
//   N  Job title / position
//   O  Institution name
//   P  Organization type
//   Q  Current LMS
//   R  Number of learners
//   S  Implementation timeline
//   T  I would like to…
//   U  How can we help?
//
// ── CERTIFICATE WORKFLOW NOTE ─────────────────────────────────────────────────
//
// Certificates are NOT issued automatically by this function.
// Recommended approach:
//   1. Filter the Sheet for rows where "Email address" is not blank.
//   2. Use a Google Apps Script or Zapier to trigger certificate generation
//      (e.g. Canva, Certifier, or a custom Google Slides mail-merge)
//      whenever a new row is added.
//   3. The generated certificate PDF is emailed to column C (Email address).
//
// ═══════════════════════════════════════════════════════════════════════════════