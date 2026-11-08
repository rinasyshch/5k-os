-- Seed data: 90-day roadmap + initial tasks
-- All tasks seeded as pending, never completed
-- No fake leads, payments, or clients

-- ============================================================
-- ROADMAP WEEKS (Nov 6, 2026 – Feb 3, 2027)
-- ============================================================
insert into roadmap_weeks (week_number, start_date, end_date, objective, outreach_target, revenue_target_cumulative_usd) values
  (1,  '2026-11-06', '2026-11-12', 'Foundation + First Outreach — define offer, prep sales portfolio, send first 10 messages on Day 1-2', 10, 0),
  (2,  '2026-11-13', '2026-11-19', 'Market Validation — qualify leads, 20+ outreach, first replies', 20, 0),
  (3,  '2026-11-20', '2026-11-26', 'Pipeline Building — first discovery calls, Upwork profile live', 25, 0),
  (4,  '2026-11-27', '2026-12-03', 'Proposals — submit first proposals, follow up aggressively', 25, 350),
  (5,  '2026-12-04', '2026-12-10', 'Conversion Sprint — close first deal, collect deposit', 20, 700),
  (6,  '2026-12-11', '2026-12-17', 'First Delivery + New Pipeline', 20, 1400),
  (7,  '2026-12-18', '2026-12-24', 'Delivery + Outreach (holiday season — target US/EU pre-holiday)', 15, 1800),
  (8,  '2026-12-25', '2026-12-31', 'Year-end sprint — follow ups, Upwork year-end demand', 15, 2000),
  (9,  '2027-01-01', '2027-01-07', 'New Year Pipeline — fresh outreach, new-year-launch brands', 25, 2500),
  (10, '2027-01-08', '2027-01-14', 'Last safe signing date ~Jan 12 — push to close', 25, 3000),
  (11, '2027-01-15', '2027-01-21', 'Delivery + Invoicing — ensure payments received in window', 15, 3800),
  (12, '2027-01-22', '2027-01-28', 'Final push — only receivable-within-window deals', 10, 4500),
  (13, '2027-01-29', '2027-02-03', 'Sprint finish — collect outstanding, final tally (partial week)', 5, 5000)
on conflict (week_number) do nothing;

-- ============================================================
-- MILESTONES
-- ============================================================
insert into milestones (id, title, week_number, area, status) values
  (uuid_generate_v4(), 'Commercial offers defined and documented', 1, 'Branding & Design', 'pending'),
  (uuid_generate_v4(), 'Sales portfolio PDF ready', 1, 'Branding & Design', 'pending'),
  (uuid_generate_v4(), 'First 10 outreach messages sent', 1, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), 'Upwork profile live with portfolio', 3, 'Freelance Platforms', 'pending'),
  (uuid_generate_v4(), 'Contra profile live', 3, 'Freelance Platforms', 'pending'),
  (uuid_generate_v4(), '30 qualified prospects in CRM', 3, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), 'First discovery call completed', 4, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), 'First proposal sent', 4, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), 'First deposit received ($350+)', 5, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), '3 UGC samples created', 3, 'UGC', 'pending'),
  (uuid_generate_v4(), 'UGC platform eligibility verified', 3, 'UGC', 'pending'),
  (uuid_generate_v4(), 'AI product: free tier launched', 6, 'Start-up/Product', 'pending'),
  (uuid_generate_v4(), 'AI product: paid tier launched ($20-30/mo)', 10, 'Start-up/Product', 'pending'),
  (uuid_generate_v4(), '$1,000 received', 5, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), '$2,500 received', 9, 'Client Acquisition', 'pending'),
  (uuid_generate_v4(), '$5,000 received — GOAL', 13, 'Client Acquisition', 'pending')
on conflict do nothing;

-- ============================================================
-- TASKS — BRANDING & DESIGN
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Define and document commercial offers',
    'Write out 3 offers: Brand Identity Starter ($700-1200), Creative Design Sprint ($350), UGC video ($50-150). Include scope, deliverables, timeline, deposit policy (50% upfront), usage rights.',
    'Branding & Design', 'High', 1, 90,
    'Google Doc or Notion page with 3 offers, scope, pricing, delivery time, what is included/excluded, deposit terms',
    'user'
  ),
  (
    'Select 3–5 portfolio projects for sales PDF',
    'Review existing work. Pick projects most relevant to target clients (consumer brands, startups, food/beverage/beauty). Prioritize variety: identity + packaging + application.',
    'Branding & Design', 'High', 1, 60,
    '3–5 projects selected with rationale for each',
    'user'
  ),
  (
    'Build targeted sales portfolio PDF',
    'Time-boxed to 6 hours max. Focus on showing process and strategic thinking, not just pretty visuals. Include a brief intro slide about KBA positioning.',
    'Branding & Design', 'High', 1, 360,
    'PDF exported, shareable link created (Dribbble/Behance/Notion/Google Drive)',
    'user'
  ),
  (
    'Write proposal template',
    'Create a reusable proposal template: intro, understanding of their need, proposed scope, deliverables, timeline, pricing, deposit terms, next steps.',
    'Branding & Design', 'High', 1, 90,
    'Template ready to personalize in <15 minutes per prospect',
    'user'
  ),
  (
    'Define client onboarding process',
    'What happens after a client signs? Deposit invoice → kickoff brief → timeline → delivery → revision rounds → final delivery → invoice balance.',
    'Branding & Design', 'Medium', 2, 60,
    'Written process document, invoice template ready',
    'user'
  ),
  (
    'Set up invoice template + payment methods',
    'Create invoice template (PDF). Check Wise, PayPal, and Stripe for Korean freelancer eligibility. IMPORTANT: Verify Korean freelance tax status with an accountant before accepting large payments.',
    'Operations', 'High', 1, 90,
    'Invoice template created. At least one international payment method confirmed working. Tax status note added.',
    'user'
  );

-- ============================================================
-- TASKS — CLIENT ACQUISITION
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Research 20 qualified prospects — venture studios + serial entrepreneurs',
    'Target: serial entrepreneurs launching consumer brands, venture studios, startup studios/incubators. Use Kickstarter, Wefunder, Republic, Product Hunt, BevNET/NOSH, LinkedIn. For each: company name, website, evidence of branding need, source URL, verification date.',
    'Client Acquisition', 'High', 1, 180,
    '20 prospects added to CRM with evidence URL and verification date. No invented data.',
    'user'
  ),
  (
    'Research 10 qualified prospects — agencies looking for branding subcontractors',
    'Find creative agencies (branding, packaging, marketing) that might outsource design work. Check Upwork, LinkedIn, agency directories.',
    'Client Acquisition', 'High', 2, 120,
    '10 agency prospects in CRM',
    'user'
  ),
  (
    'Write 3 personalized outreach templates',
    'Template A: venture studio / serial entrepreneur launching a new brand. Template B: startup with branding that looks DIY / needs upgrade. Template C: agency looking for freelance branding partner. Each: 3-5 sentences, specific to their context, clear ask.',
    'Client Acquisition', 'High', 1, 90,
    '3 templates written, stored in notes',
    'user'
  ),
  (
    'Send first 10 outreach messages (Day 1–2)',
    'Portfolio does not need to be perfect. Send now with what you have. Use Template A for best-fit prospects. Log each in CRM with date.',
    'Client Acquisition', 'High', 1, 60,
    '10 outreach messages sent, all logged in CRM with outreach_date',
    'user'
  ),
  (
    'Send outreach: Week 2 batch (20 messages)',
    'Continue systematic outreach. Personalize each message based on company context. Follow up with week 1 non-replies after 5 days.',
    'Client Acquisition', 'High', 2, 120,
    '20 new outreach sent, week 1 follow-ups logged',
    'user'
  ),
  (
    'Set up and schedule weekly follow-up ritual',
    'Every Tuesday and Thursday: check CRM for contacts due a follow-up. Send short, specific follow-up messages. Never send generic "just checking in".',
    'Client Acquisition', 'High', 1, 30,
    'Recurring task created. First follow-up batch done.',
    'user'
  ),
  (
    'First discovery call prep',
    'Prepare a discovery call framework: questions about their brand situation, timeline, budget range, decision process. Prepare a 2-minute intro about KBA.',
    'Client Acquisition', 'Medium', 2, 45,
    'Discovery call framework written. Ready for first call.',
    'user'
  ),
  (
    'Check sources: launchlab.studio, revurge.com',
    'These are watchlist entries to verify — check if they are real businesses with branding needs. Add to Opportunities if confirmed with source URL and evidence.',
    'Client Acquisition', 'Medium', 1, 30,
    'Both checked. Added to Opportunities or discarded with reason.',
    'user'
  );

-- ============================================================
-- TASKS — FREELANCE PLATFORMS
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Review Upwork eligibility and fee structure for Korean freelancers',
    'Check: can I open an account from South Korea, what payment methods are available, what are the fees, is there a Connects system, how to price on the platform.',
    'Freelance Platforms', 'High', 1, 60,
    'Written notes on eligibility, fees, payment options. Decision: proceed or skip.',
    'user'
  ),
  (
    'Create Upwork profile',
    'Title, overview, hourly rate, portfolio samples (image/PDF), certifications if any. Focus on Brand Identity and Packaging for target clients.',
    'Freelance Platforms', 'High', 2, 120,
    'Profile live, 100% complete, portfolio uploaded, first saved search set up',
    'user'
  ),
  (
    'Create Contra profile',
    'Contra is portfolio-forward — make it look great. Add projects, services, pricing. Set up saved search for branding projects.',
    'Freelance Platforms', 'High', 2, 90,
    'Profile live, services listed, portfolio uploaded',
    'user'
  ),
  (
    'Apply to 5 Upwork branding/identity projects',
    'Find 5 relevant active projects. Write personalized proposals. Track each application in CRM with platform tag.',
    'Freelance Platforms', 'High', 2, 120,
    '5 Upwork proposals submitted and logged in CRM',
    'user'
  ),
  (
    'Evaluate Fiverr — decision only',
    'Research: is Fiverr viable for high-value branding work? Compare average project values, client quality, algorithm. Decide: add or skip.',
    'Freelance Platforms', 'Low', 3, 45,
    'Written decision with reasoning. If yes: profile created. If no: documented why.',
    'user'
  ),
  (
    'Set up 3 Upwork saved searches for target job types',
    'Saved searches: brand identity design, packaging design, brand strategy + design. Set to email alerts.',
    'Freelance Platforms', 'Medium', 2, 20,
    '3 saved searches active with notifications',
    'user'
  );

-- ============================================================
-- TASKS — UGC
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Define UGC offering and terms',
    'What do you offer: short vertical video (15-30s or 30-60s?), how many revisions, usage rights duration, exclusivity, raw footage included? Set a price hypothesis ($50-$150).',
    'UGC', 'Medium', 2, 60,
    'UGC offer defined in writing with scope, pricing, usage rights',
    'user'
  ),
  (
    'Create 3 UGC portfolio samples',
    'Create 3 short vertical videos as spec work (no client needed). Show different styles: lifestyle, product demo, testimonial-style. Use phone, natural light.',
    'UGC', 'Medium', 2, 180,
    '3 videos created, edited, exported. Posted on portfolio or private link.',
    'user'
  ),
  (
    'Check eligibility from South Korea: Collabstr, Backstage, Cohley (not "Choley")',
    'For each platform: can creators from South Korea join, are there paid (not barter) opportunities, what is the minimum following required, how do payments work.',
    'UGC', 'Medium', 2, 60,
    'Written eligibility notes for each platform. At least one confirmed as viable.',
    'user'
  ),
  (
    'Create Collabstr or Backstage profile (whichever is eligible)',
    'Upload UGC samples, set rate, add niche tags.',
    'UGC', 'Medium', 3, 60,
    'Profile live with UGC portfolio',
    'user'
  ),
  (
    'Set up X/Twitter saved search for UGC opportunities',
    'Saved searches: "looking for UGC creator", "UGC creator needed", "need content creator". Check daily. Reply or DM relevant posts.',
    'UGC', 'Low', 2, 20,
    '2–3 saved searches set up, first relevant opportunity noted',
    'user'
  ),
  (
    'Test selling a small digital product via Instagram',
    'Ideas: brand mood board template, IG story design pack, mini brand kit Canva template. Post once to gauge interest. Price: $15-29.',
    'UGC', 'Low', 4, 120,
    'Product created, posted on Instagram, link to purchase ready',
    'user'
  );

-- ============================================================
-- TASKS — START-UP / PRODUCT
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Define AI product scope and waitlist setup',
    'The Instagram content tool for creators: what exactly does it do in MVP? Set up a waitlist (Typeform or simple landing page). Max 15% of weekly hours.',
    'Start-up/Product', 'Medium', 2, 90,
    'Product MVP scope defined in 1 page. Waitlist link live.',
    'user'
  ),
  (
    'Launch free tier of AI product',
    'Ship something usable. Done is better than perfect. At least 5 test users.',
    'Start-up/Product', 'Medium', 6, 240,
    'Free tier live, link shareable, at least 5 sign-ups',
    'user'
  ),
  (
    'Launch paid tier of AI product ($20-30/month)',
    'Add payment (Stripe or Lemon Squeezy). Announce to waitlist.',
    'Start-up/Product', 'Medium', 10, 180,
    'Paid tier live, at least 1 paying subscriber',
    'user'
  );

-- ============================================================
-- TASKS — OPERATIONS
-- ============================================================
insert into tasks (title, description, area, priority, week_number, estimated_minutes, done_criteria, source) values
  (
    'Generate AGENT_TOKEN and add to .env.local',
    'Run: openssl rand -hex 32. Add as AGENT_TOKEN in .env.local and in Vercel environment variables.',
    'Operations', 'High', 1, 15,
    'Token in .env.local and Vercel. Test: curl -H "Authorization: Bearer TOKEN" /api/agent/snapshot returns JSON.',
    'user'
  ),
  (
    'Set up morning agent in Claude Code Scheduled Tasks',
    'Claude Code Desktop → Scheduled → New task → folder: Desktop/5k → name: morning-agent → Daily 08:30 → instructions: kit/agents/morning-agent.md. Click Run now to test.',
    'Operations', 'High', 1, 30,
    'Morning agent scheduled. Test run successful. Permissions granted (allow curl, WebSearch, WebFetch).',
    'user'
  ),
  (
    'Set up weekly review agent',
    'Same as morning agent but: name: weekly-review-agent → Weekly, Sunday 20:00 → instructions: kit/agents/weekly-review-agent.md.',
    'Operations', 'Medium', 2, 20,
    'Weekly agent scheduled.',
    'user'
  ),
  (
    'Create Claude Project "5K Coach"',
    'claude.ai → New Project → Instructions: paste content of kit/agents/coach_persona.md. Use the "Copy context for Claude" button in the app to paste context before each session.',
    'Operations', 'Medium', 1, 20,
    'Project created with coach persona instructions.',
    'user'
  ),
  (
    'First Weekly Review (Week 1)',
    'Complete the weekly review form: planned vs done, outreach count, replies, revenue, time allocation, lessons. The app auto-computes stats.',
    'Operations', 'High', 2, 30,
    'Week 1 review saved and complete',
    'user'
  ),
  (
    'Verify Korean freelance tax status',
    'Check with an accountant or tax advisor: how to legally invoice international clients from South Korea, VAT requirements, income declaration, payment method implications.',
    'Operations', 'High', 2, 60,
    'Written notes on tax status. Payment methods confirmed compliant.',
    'user'
  );

-- ============================================================
-- RESEARCH SOURCES (stored as quick_capture items for reference)
-- ============================================================
insert into quick_capture (content, url, category, status) values
  ('Research source: Kickstarter — new consumer brand launches', 'https://www.kickstarter.com', 'link', 'triaged'),
  ('Research source: Wefunder — funded startups needing branding', 'https://wefunder.com', 'link', 'triaged'),
  ('Research source: Republic.co — crowdfunding, new brand launches', 'https://republic.co', 'link', 'triaged'),
  ('Research source: Product Hunt — new products launching daily', 'https://www.producthunt.com', 'link', 'triaged'),
  ('Research source: BevNET — food and beverage new brands', 'https://www.bevnet.com', 'link', 'triaged'),
  ('Research source: NOSH — natural food & beverage brands', 'https://www.nosh.com', 'link', 'triaged'),
  ('Research source: RangeMe — new CPG product launches', 'https://www.rangeme.com', 'link', 'triaged'),
  ('Research source: Upwork branding jobs', 'https://www.upwork.com/nx/search/jobs/?q=brand+identity&sort=recency', 'link', 'triaged'),
  ('Research source: Contra branding projects', 'https://contra.com', 'link', 'triaged'),
  ('Watchlist to verify: launchlab.studio — venture studio?', 'https://launchlab.studio', 'lead', 'inbox'),
  ('Watchlist to verify: revurge.com — check for branding needs', 'https://revurge.com', 'lead', 'inbox'),
  ('Upwork brand identity job search (save as search alert)', 'https://www.upwork.com/nx/search/jobs/?q=brand+identity+design', 'link', 'triaged'),
  ('Backstage UGC casting — check eligibility from Korea', 'https://www.backstage.com', 'link', 'inbox'),
  ('Cohley (UGC platform, not "Choley") — check eligibility from Korea', 'https://cohley.com', 'link', 'inbox'),
  ('X/Twitter search: "looking for UGC creator" — check daily', 'https://x.com/search?q=%22looking+for+UGC+creator%22&f=live', 'link', 'triaged');
