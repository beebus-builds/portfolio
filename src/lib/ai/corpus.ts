export interface KnowledgeChunk {
  id: string;
  keywords: string[];
  title: string;
  text: string;
  answer: string;
  source?: string;
}

// ─── The training corpus ────────────────────────────────────────────
// Every chunk is authored from Bibash's real site data. The engine
// vectorizes (title + keywords + text) into TF-IDF weights and matches
// visitor queries against them by cosine similarity.

export const CORPUS: KnowledgeChunk[] = [
  {
    id: "identity",
    keywords: ["who", "name", "bibash", "about", "developer", "person", "you"],
    title: "Who is Bibash",
    text: "Bibash Poudel is a 23-year-old developer from Sindhuli, Nepal. He is a Developer Intern at Smartsites Nepal and studies a Bachelor of Information Technology (BIT) at Bhaktapur Multiple Campus. He builds for the web, turning ideas into interactive experiences. His motto is 'Code is a canvas, the browser is my gallery.' He describes himself as the Architect of Digital Voids.",
    answer:
      "Bibash Poudel is a 23-year-old developer living in the hills of Sindhuli, Nepal. Right now, he's honing his craft as a Developer Intern at Smartsites Nepal while pursuing his BIT degree. He loves turning ideas into interactive web experiences—his mantra is, 'Code is a canvas, the browser is my gallery.'",
    source: "/about",
  },
  {
    id: "profile",
    keywords: ["profile", "stats", "info", "age", "from", "timezone", "languages", "speak", "speaks", "location", "where"],
    title: "Profile at a glance",
    text: "Bibash Poudel is from Sindhuli, Nepal, age 23, role Developer Intern at Smartsites Nepal, studying BIT at Bhaktapur Multiple Campus, timezone Asia/Kathmandu UTC+5:45, languages Nepali native and English fluent.",
    answer:
      "Here's the quick scoop on Bibash: He's a 23-year-old developer from Sindhuli, Nepal. He's juggling his BIT studies at Bhaktapur Multiple Campus with his internship over at Smartsites Nepal. He's fluent in Nepali and English, and he's based in the Asia/Kathmandu timezone.",
    source: "/about",
  },
  {
    id: "journey",
    keywords: ["journey", "history", "timeline", "career", "experience", "started", "path", "smartsites", "intern", "internship", "work", "employ", "smartsites nepal", "what does he do"],
    title: "Bibash's journey",
    text: "In 2022 Bibash wrote his first line of code with an HTML page. In 2023 he started a BIT degree at Bhaktapur Multiple Campus. In 2025 he became an intern at Smartsites Nepal building real-world web apps with React, Next.js and TypeScript.",
    answer:
      "2022 — First line of code: an HTML page that sparked the journey into full-stack development.\n2023 — Started BIT at Bhaktapur Multiple Campus (algorithms, data structures, databases, software engineering).\n2025 — Intern at Smartsites Nepal, building production web apps with React, Next.js, and TypeScript.",
    source: "/about",
  },
  {
    id: "values",
    keywords: ["values", "believe", "principles", "philosophy", "problem solving", "craft"],
    title: "What Bibash believes in",
    text: "Bibash values problem solving, craft over code, always learning, and being rooted in Nepal. Code is a means; the experience, design and story are the end goal. He grows with every project and trend.",
    answer:
      "Bibash believes in:\n→ Problem Solving — breaking complex problems into simple, elegant solutions.\n→ Craft Over Code — the experience and design matter more than the code itself.\n→ Always Learning — every project teaches something new.\n→ Rooted in Nepal — built from the Himalayas with patience and resilience.",
  },
  {
    id: "skills",
    keywords: ["skill", "skills", "stack", "tech", "technologies", "know", "language", "framework", "sql", "postgresql", "database", "db", "use"],
    title: "Skills overview",
    text: "Bibash's skills: Frontend React, Next.js, TypeScript, Tailwind CSS, Three.js, HTML CSS. Backend Node.js, REST APIs, PostgreSQL, Python, Git. Tools VS Code, Figma, Linux CLI, WordPress, Vercel, Agile Scrum. Expert in Tailwind CSS, HTML CSS and VS Code.",
    answer:
      "Frontend: React, Next.js, TypeScript, Tailwind CSS, Three.js, HTML/CSS\nBackend: Node.js, REST APIs, PostgreSQL, Python, Git\nTools: VS Code, Figma, Linux CLI, WordPress, Vercel, Agile/Scrum\n\nExpert-level: Tailwind CSS, HTML/CSS, VS Code",
    source: "/skills",
  },
  {
    id: "proficiencies",
    keywords: ["proficiency", "proficient", "good at", "best", "level", "percent", "rating"],
    title: "Skill proficiency levels",
    text: "Bibash proficiency percentages: Tailwind CSS 90%, React/Next.js 85%, TypeScript 80%, Node.js 70%, Three.js 60%, PostgreSQL 55%, Python 50%.",
    answer:
      "Tailwind CSS 90% · React/Next.js 85% · TypeScript 80%\nNode.js 70% · Three.js 60% · PostgreSQL 55% · Python 50%",
    source: "/skills",
  },
  {
    id: "learning",
    keywords: ["learning", "currently", "next", "roadmap", "studying now", "rust", "docker", "picking up"],
    title: "Currently learning",
    text: "Bibash is currently learning Rust, Docker, System Design, GraphQL and AWS. He believes in learning by building — every project adds a new tool to the belt.",
    answer:
      "Right now Bibash is picking up: Rust, Docker, System Design, GraphQL, and AWS.\n\nHe learns by building — every project adds a new tool to the belt.",
    source: "/skills",
  },
  {
    id: "education-degree",
    keywords: ["education", "degree", "college", "university", "study", "studying", "studies", "bit", "academic", "school", "course"],
    title: "Education degrees",
    text: "Bibash is pursuing a Bachelor of Information Technology (BIT) at Bhaktapur Multiple Campus in Bhaktapur, Nepal, from 2023 to 2026, in progress. Previously he completed Higher Secondary Education (NEB) in Science with Mathematics and Computer Science at National Examinations Board, Sindhuli, from 2020 to 2022.",
    answer:
      "Bachelor of Information Technology (BIT) — Bhaktapur Multiple Campus, 2023–2026 (in progress)\nCore coursework: algorithms, data structures, databases, software engineering\n\nHigher Secondary Education (NEB) — Science with Mathematics & Computer Science, Sindhuli, 2020–2022 (completed)",
    source: "/education",
  },
  {
    id: "certifications",
    keywords: ["certification", "certificate", "cert", "freecodecamp", "course"],
    title: "Certifications",
    text: "Bibash holds a JavaScript Algorithms and Data Structures certification from freeCodeCamp in 2024 and a Responsive Web Design certification from freeCodeCamp in 2023.",
    answer:
      "JavaScript Algorithms & Data Structures — freeCodeCamp, 2024\nResponsive Web Design — freeCodeCamp, 2023",
    source: "/education",
  },
  {
    id: "projects-summary",
    keywords: ["project", "projects", "built", "build", "portfolio", "work", "made", "create"],
    title: "Projects summary",
    text: "Bibash's projects include iVote secure online voting with Paillier homomorphic encryption, Pharma Connect patient pharmacy linkage, Automate teacher portfolio platform, Match Day Poster live football tracker, Nico Paz WordPress theme, and Himalayan audit-fix WordPress plugin.",
    answer:
      "Main projects:\n→ iVote — end-to-end encrypted voting (Paillier homomorphic encryption)\n→ Pharma Connect — connects patients to their nearest pharmacies\n→ Automate — teacher portfolio website platform\n→ Match Day Poster — live football tracker with auto Facebook posts\n→ Nico Paz — WordPress theme with WooCommerce + Polylang\n→ Himalayan — WordPress audit-fix plugin\n\nVisit /projects for full case studies.",
    source: "/projects",
  },
  {
    id: "project-ivote",
    keywords: ["ivote", "voting", "election", "encrypted", "paillier", "face", "liveness"],
    title: "Project iVote",
    text: "iVote is a university election platform with end-to-end encrypted voting using Paillier homomorphic encryption. It has face verification with blink-based liveness detection, full election lifecycle management, and automatic encrypted tally aggregation with private key erasure. Built with Next.js, TypeScript, Python, FastAPI, PostgreSQL and Tailwind CSS in 2025.",
    answer:
      "iVote — Secure Online Voting (Full-Stack, 2025)\n\nA university election platform with end-to-end encrypted voting using Paillier homomorphic encryption. Blink-based liveness detection stops deepfake impersonation, and private keys are erased after tallying so votes become mathematically impossible to trace.\n\nTech: Next.js, TypeScript, Python, FastAPI, PostgreSQL",
    source: "/projects/ivote",
  },
  {
    id: "project-pharma",
    keywords: ["pharma", "pharmacy", "connect", "medicine", "health", "patient"],
    title: "Project Pharma Connect",
    text: "Pharma Connect is an application that connects patients to their nearest pharmacies. It features location-aware pharmacy discovery, end-to-end TypeScript, and is designed for low-bandwidth users in rural Nepali towns. Built in 2024.",
    answer:
      "Pharma Connect (Full-Stack, 2024)\n\nConnects patients to their nearest pharmacies with location-aware discovery. Typed end-to-end with TypeScript and designed for low-bandwidth users in rural Nepali towns.",
    source: "/projects/pharma-connect",
  },
  {
    id: "project-automate",
    keywords: ["automate", "teacher", "portfolio", "educator", "template"],
    title: "Project Automate",
    text: "Automate is a platform enabling teachers to create personal portfolio websites with ease. It has a template system, streamlined onboarding for non-technical users, and reusable component architecture. Built in 2024.",
    answer:
      "Automate — Teacher Portfolios (Full-Stack, 2024)\n\nLets teachers publish a personal portfolio in minutes, not days. Templates are opinionated but customizable, and the editor focuses on content while hiding the machinery.",
    source: "/projects/automate",
  },
  {
    id: "project-football",
    keywords: ["football", "match", "poster", "soccer", "score", "facebook", "live"],
    title: "Project Match Day Poster",
    text: "Match Day Poster is a real-time football match tracking application with live scores, automated Facebook posting, interactive score predictions, multi-league support and team profiles with a glassmorphism UI. Built with Python, Flask, JavaScript in 2024.",
    answer:
      "Match Day Poster (Full-Stack, 2024)\n\nReal-time football tracking with live scores, interactive score predictions, and match-day posters pushed straight to Facebook automatically when the final whistle blows.",
    source: "/projects/match-day-poster",
  },
  {
    id: "project-nico",
    keywords: ["nico", "paz", "wordpress", "theme", "woocommerce", "polylang", "bento"],
    title: "Project Nico Paz theme",
    text: "Nico Paz is a custom WordPress theme for Argentine footballer Nico Paz with TailwindCSS, WooCommerce integration, Polylang multi-language support, dark mode, and a responsive bento grid gallery. Built in 2025.",
    answer:
      "Nico Paz WordPress Theme (WordPress, 2025)\n\nCustom theme with a bento grid gallery, Polylang Spanish + English support, WooCommerce-ready shop, and a polished dark mode.",
    source: "/projects/nico-paz",
  },
  {
    id: "project-himalayan",
    keywords: ["himalayan", "plugin", "wordpress", "audit", "maintenance", "fix"],
    title: "Project Himalayan plugin",
    text: "Himalayan is a WordPress plugin for technical audit fixes. It automates common optimization, compliance and maintenance tasks with a clean admin interface that reads like a checklist. Built in 2025.",
    answer:
      "Himalayan Plugin (WordPress, 2025)\n\nAutomates repetitive audit fixes across a fleet of WordPress sites — optimization, compliance, and maintenance from a single checklist-style screen.",
    source: "/projects/himalayan-plugin",
  },
  {
    id: "contact",
    keywords: ["contact", "email", "mail", "reach", "hire", "freelance", "github", "linkedin", "connect", "send", "message", "social"],
    title: "Contact channels",
    text: "Bibash can be reached by email at bibashpoudel@email.com, on GitHub at github.com/beebus-builds, and on LinkedIn at linkedin.com/in/bibashpoudel. He is open to internships, freelance work, and collaboration.",
    answer:
      "Ways to reach Bibash:\n→ Email: bibashpoudel@email.com\n→ GitHub: github.com/beebus-builds\n→ LinkedIn: linkedin.com/in/bibashpoudel\n\nHe's available for opportunities — open to internships, freelance work, and collaboration. You can also use the terminal's `mail` command to send a message.",
    source: "/contact",
  },
  {
    id: "availability",
    keywords: ["available", "open", "opportunity", "job", "internship", "freelance", "collab", "work with", "hiring", "employ", "position", "offer"],
    title: "Availability",
    text: "Bibash is available for opportunities. He is open to internships, freelance work, and collaboration, and best reached by email for professional inquiries.",
    answer:
      "Yes — Bibash is currently available for opportunities: internships, freelance work, and collaboration.\n\nBest reach: email bibashpoudel@email.com, or use the contact page.",
    source: "/contact",
  },
  {
    id: "nepal",
    keywords: ["nepal", "country", "sindhuli", "himalaya", "everest", "kathmandu", "culture"],
    title: "About Nepal",
    text: "Nepal is Bibash's home country, land of mountains, culture and code. Highest peak Mount Everest 8848m, 4 UNESCO heritage sites, only non-rectangular flag, timezone UTC+5:45. Home is Sindhuli with views of the Himalayas, and he studies in Kathmandu's Bhaktapur.",
    answer:
      "Nepal — land of mountains, culture & code 🇳🇵\n\n→ Home: Sindhuli, with views of the Himalayas\n→ Highest peak: Mount Everest, 8,848m\n→ 4 UNESCO heritage sites, including Lumbini (birthplace of Buddha)\n→ The only non-rectangular national flag in the world\n→ Timezone UTC+5:45 — one of only two 45-minute offsets on Earth",
    source: "/about",
  },
  {
    id: "nepal-culture",
    keywords: ["dashain", "tihar", "festival", "momo", "dal bhat", "food", "cuisine", "language", "culture"],
    title: "Nepali culture",
    text: "Nepali is the official language of Nepal spoken by 45 percent as mother tongue. Dashain and Tihar are the biggest festivals. Dal Bhat is the daily staple, momos and sel roti are favorites. Nepal has over 50 festivals annually.",
    answer:
      "Culture & cuisine:\n→ Languages: Nepali (नेपाली) is official; 120+ languages spoken\n→ Festivals: Dashain and Tihar are the biggest — 50+ festivals a year\n→ Food: Dal Bhat is the staple; momos, sel roti, and gundruk are favorites\n→ Arts: folk music, classical dance, and Newar woodcarving",
    source: "/about",
  },
  {
    id: "nepal-dev-scene",
    keywords: ["dev scene", "startup", "tech scene", "developers", "ecosystem", "remote"],
    title: "Nepal developer ecosystem",
    text: "Nepal's tech scene is growing rapidly with 2000 plus IT graduates yearly, 500 plus tech startups, and a remote-first work culture. Nepal is the 3rd largest remittance economy in South Asia.",
    answer:
      "Nepal's dev ecosystem:\n→ 2,000+ IT graduates yearly\n→ 500+ tech startups\n→ Remote-first, young, and ambitious\n→ 3rd largest remittance economy in South Asia\n\n\"Software from the Himalayas — built with altitude attitude.\"",
    source: "/about",
  },
  {
    id: "namaste",
    keywords: ["namaste", "namaskar", "welcome", "nepali", "greeting"],
    title: "Namaste",
    text: "Namaste is the Nepali welcome. Namaskar means may your day be auspicious. स्वागत छ means welcome.",
    answer:
      "Namaste! 🙏 स्वागत छ — welcome to this digital space.\n\nNamaskar — आजको दिन शुभ रहोस् (may your day be auspicious).",
    source: "/",
  },
  {
    id: "blog",
    keywords: ["blog", "post", "write", "article", "writing", "rss"],
    title: "Blog system",
    text: "Bibash has a blog at /blog with posts about building and designing. Posts are published to a Neon Postgres database, and there is an RSS feed at /rss.xml.",
    answer:
      "The blog lives at /blog — posts about building and designing, published straight to Postgres.\n\n→ Browse: /blog\n→ RSS feed: /rss.xml",
    source: "/blog",
  },
  {
    id: "chess",
    keywords: ["chess", "play", "game", "board", "opponent", "minimax"],
    title: "Chess game",
    text: "The chess page at /chess is a fully legal chess engine running in the browser — castling, en passant, promotion, and a minimax AI opponent at three difficulty levels.",
    answer:
      "Up for a match? /chess has a full legal chess engine in the browser — castling, en passant, promotion, and a minimax opponent (easy/medium/hard). Play as white or black.",
    source: "/chess",
  },
  {
    id: "resume",
    keywords: ["resume", "cv", "download", "hire me"],
    title: "Resume",
    text: "Bibash's resume is downloadable at /resume.pdf.",
    answer:
      "You can download Bibash's resume at /resume.pdf.",
    source: "/",
  },
  {
    id: "terminal",
    keywords: ["terminal", "commands", "shell", "playground", "cli", "command", "devverse", "what is this", "homepage", "what is devverse"],
    title: "Terminal",
    text: "The terminal is an interactive CLI portfolio. It has a virtual filesystem, commands, a NOVA AI companion ask command, live typing animation, and hidden easter eggs. The homepage is a full-screen terminal.",
    answer:
      "The terminal is the heart of the site — a full CLI with a virtual filesystem, commands, easter eggs, and even an `ask` command. Try `help` to get started, or open /commands for the playground.",
    source: "/commands",
  },
  {
    id: "how-built",
    keywords: ["built", "tech stack", "how", "nextjs", "react", "framework", "made with", "website", "site", "technology used", "whats this"],
    title: "How the site is built",
    text: "This portfolio is built with Next.js 16, React 19, TypeScript, and Tailwind CSS. Blog posts publish to a Neon Postgres database. It features a terminal shell and a custom site-local AI companion.",
    answer:
      "This site is built with Next.js 16, React 19, TypeScript, and Tailwind CSS.\n\nHighlights: a full terminal shell as the homepage, blog posts in Neon Postgres, an interactive 3D chess game, and this custom AI — all running locally with zero external model APIs.",
    source: "/",
  },
];

// ─── Small-talk intents ─────────────────────────────────────────────

export const SMALLTALK: KnowledgeChunk[] = [
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "namaste", "hola", "sup", "yo"],
    title: "Greeting",
    text: "Hello hi hey namaste greeting welcome visitor",
    answer:
      "Namaste! 🙏 Welcome to DevVerse. I'm Uvo, Bibash's AI companion. I know this site inside out—what can I help you find today?",
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "thx", "appreciate", "grateful"],
    title: "Thanks",
    text: "thank thanks thx appreciate grateful",
    answer:
      "You're very welcome! 🙏 If something caught your eye, Bibash would love to hear from you — the /contact page is always open.",
  },
  {
    id: "bye",
    keywords: ["bye", "goodbye", "see you", "farewell", "later"],
    title: "Farewell",
    text: "bye goodbye see you farewell later",
    answer:
      "Dhanyabad for stopping by! 🙏 The terminal is always open if you're curious about anything else. फेरि भेटौँला — see you again soon!",
  },
  {
    id: "help",
    keywords: ["help", "what can", "can you do", "how to use", "what do you know", "abilities"],
    title: "What Uvo can do",
    text: "help what can you do abilities questions about bibash",
    answer:
      "I'm here to help you get to know Bibash. You can ask me about his tech stack, his favorite projects, or what life is like in Nepal. Want a quick rundown of his best projects or maybe his skill set?",
  },
  {
    id: "who-made",
    keywords: ["who made", "who created", "who built you", "your creator", "made you", "trained you", "built you", "who are you", "what are you"],
    title: "Who made Uvo",
    text: "who made created built you creator",
    answer:
      "Bibash built me himself! I'm running on a custom engine that's exclusively trained on his own data—no external AI magic here, just pure site-local knowledge. Pretty cool, right? 🤖",
  },
  {
    id: "compliment",
    keywords: ["cool", "awesome", "amazing", "nice", "great", "impressive", "love", "good job"],
    title: "Compliments",
    text: "cool awesome amazing nice great impressive love good job",
    answer:
      "Thanks! 😄 Bibash appreciates it — he poured a lot into this terminal. Anything specific you'd like to dig into?",
  },
  {
    id: "code",
    keywords: ["code", "programming", "coding", "developer", "develop", "software"],
    title: "About coding",
    text: "code programming coding developer develop software",
    answer:
      "Bibash is a full-stack web developer — React, Next.js, TypeScript, Node.js, and PostgreSQL on the backend, with WordPress and Three.js in the mix. Ask about his projects or skills for specifics!",
  },
];
