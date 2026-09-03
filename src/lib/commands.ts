import { applyTheme, getTheme, THEMES, type ThemeName } from "@/lib/themes";
import { setSoundProfile, getSoundProfile, SOUND_PROFILE_LABELS, type SoundProfile } from "@/lib/audio";

export interface CommandResult {
  text: string;
  color?: string;
  typing?: boolean;
}

export interface CommandContext {
  push: (result: CommandResult) => void;
  sleep: (ms: number) => Promise<void>;
  ask: (promptText: string, opts?: { masked?: boolean; default?: string }) => Promise<string>;
  isCancelled: () => boolean;
}

// ─── Virtual Filesystem ────────────────────────────────────────────

interface FSNode {
  type: "file" | "dir";
  content?: string;
  children?: Record<string, FSNode>;
}

const filesystem: Record<string, FSNode> = {
  welcome: { type: "file", content: "Welcome to DevVerse. Type 'help' to get started." },
  about: {
    type: "dir",
    children: {
      "README.md": {
        type: "file",
        content: `# Bibash Poudel\n\nA 23-year-old technologist from Sindhuli, Nepal.\nDriven by curiosity to bridge complex logic and immersive art.\n\nCurrently: Intern at Smartsites Nepal\nStudying: BIT at Bhaktapur Multiple Campus\nMotto: "Code is a canvas, the browser is my gallery."`,
      },
    },
  },
  projects: {
    type: "dir",
    children: {
      "devverse-terminal": {
        type: "dir",
        children: {
          "README.md": {
            type: "file",
            content: `# DevVerse Terminal\n\nAn interactive CLI portfolio built with Next.js.\nFeatures a virtual filesystem, AI companion mode,\nlive typing animation, and hidden easter eggs.\n\nTech: Next.js, React, TypeScript, Tailwind CSS`,
          },
        },
      },
      "smartsites-nepal": {
        type: "dir",
        children: {
          "README.md": {
            type: "file",
            content: `# Smartsites Nepal\n\nFull-stack development intern working on\nreal-world client projects — building scalable\nweb applications with modern React ecosystems.\n\nTech: React, Next.js, Node.js, TypeScript, PostgreSQL`,
          },
        },
      },
    },
  },
  skills: {
    type: "dir",
    children: {
      "frontend.md": {
        type: "file",
        content: `## Frontend\n\n- React / Next.js\n- Three.js / React Three Fiber\n- TypeScript\n- Tailwind CSS\n- HTML / CSS`,
      },
      "backend.md": {
        type: "file",
        content: `## Backend\n\n- Node.js\n- REST APIs\n- PostgreSQL\n- Git`,
      },
      "tools.md": {
        type: "file",
        content: `## Tools & Practices\n\n- Git / GitHub\n- VS Code\n- Figma\n- Agile / Scrum\n- Linux / CLI`,
      },
    },
  },
  contact: {
    type: "dir",
    children: {
      "info.md": {
        type: "file",
        content: `## Contact\n\nEmail:    bibash@example.com\nGitHub:   github.com/bibashpoudel\nLinkedIn: linkedin.com/in/bibashpoudel\n\nUse 'mail' command to send a message directly.`,
      },
    },
  },
  education: {
    type: "dir",
    children: {
      "README.md": {
        type: "file",
        content: `## Education\n\nBachelor of Information Technology (BIT)\nBhaktapur Multiple Campus\n\nCurrently pursuing — expected graduation: 2026`,
      },
    },
  },
  var: { type: "dir", children: {} },
  tmp: { type: "dir", children: {} },
  etc: { type: "dir", children: {} },
  home: {
    type: "dir",
    children: {
      visitor: { type: "dir", children: {} },
    },
  },
};

// ─── NOVA Commentary ────────────────────────────────────────────────

const NOVA_QUOTES = [
  "NOVA: Namaste! Did you know Nepal has the highest peak on Earth? And the best developers.",
  "NOVA: Speaking from the foothills of the Himalayas. The air is thin but the code is clean.",
  "NOVA: Bibash hails from Sindhuli — serene hills, strong tea, stronger logic.",
  "NOVA: Bhaktapur has 1,200 years of history and one of the best tech minds. You're standing in his terminal.",
  "NOVA: Nepal Standard Time is UTC+5:45. Yes, 45 minutes. We don't follow the crowd.",
  "NOVA: Fun fact: the flag of Nepal is the only non-rectangular national flag in the world.",
  "NOVA: Did you know? Mount Everest grows about 4mm taller every year. So does Bibash's codebase.",
  "NOVA: You're exploring a portfolio built from Kathmandu valley. The code has mountain spirit.",
  "NOVA: Systems running on momo power and chiya. Peak performance.",
  "NOVA: I've analyzed 3.7 exabytes of global dev data. Nepal's tech scene? Underrated. Watch this space.",
  "NOVA: Namaskar! आजको दिन शुभ रहोस् (May your day be auspicious).",
  "NOVA: In the hills of Sindhuli, they say code should be as clear as the Himalayan air.",
];

// ─── Fortunes ──────────────────────────────────────────────────────

const FORTUNES = [
  "\"The best way to predict the future is to invent it.\" — Alan Kay",
  "\"Simplicity is prerequisite for reliability.\" — Edsger Dijkstra",
  "\"Talk is cheap. Show me the code.\" — Linus Torvalds",
  "\"First, solve the problem. Then, write the code.\" — John Johnson",
  "\"Code is like humor. When you have to explain it, it's bad.\" — Cory House",
  "\"Make it work, make it right, make it fast.\" — Kent Beck",
  "\"Any fool can write code that a computer can understand. Good programmers write code that humans can understand.\" — Martin Fowler",
  "\"The only way to go fast is to go well.\" — Robert C. Martin",
  "\"ज्ञानं भारः क्रियां विना।\" (Knowledge is a burden without action.) — Sanskrit Proverb",
  "\"उठ, जाग, र लक्ष्य प्राप्त नगरेसम्म रोकिनु हुँदैन।\" — स्वामी विवेकानन्द",
  "\"हिमाल जत्तिकै अग्लो सपना, तर जमिनमा पाइला।\" (Dreams as high as the Himalayas, feet on the ground.) — Nepali Proverb",
  "\"Code is poetry written in logic. Nepal is poetry written in mountains.\" — Unknown",
];

// ─── State ──────────────────────────────────────────────────────────

let currentDir = "/";
let novaMode = false;
const commandHistory: string[] = [];
let pipeBuffer = "";
const fsRoot: FSNode = { type: "dir", children: filesystem };
const uid = 1000;
let sudoUser: string | null = null;

export function getCurrentDir() { return currentDir; }

export function setCurrentDir(dir: string) { currentDir = dir; }

export function getPrompt(): string {
  const who = sudoUser ? "root" : "visitor";
  const dir = currentDir === "/" ? "~" : `~${currentDir.replace(/^\//, "").replace(/\/$/, "")}`;
  return `${who}@devverse:${dir}$`;
}

export function toggleNovaMode() { novaMode = !novaMode; return novaMode; }

export function isNovaMode() { return novaMode; }

function applyNova(text: string): string {
  return novaMode ? `${text}\n\n  ${NOVA_QUOTES[Math.floor(Math.random() * NOVA_QUOTES.length)]}` : text;
}

function logHistory(cmd: string) {
  commandHistory.push(cmd);
  if (commandHistory.length > 500) commandHistory.splice(0, commandHistory.length - 500);
}

// ─── Filesystem helpers ─────────────────────────────────────────────

function resolvePath(path: string): string {
  if (path.startsWith("/")) return path.replace(/\/+/g, "/");
  if (path === "~") return "/home/visitor";
  if (path.startsWith("~/")) return `/home/visitor/${path.slice(2)}`;
  if (currentDir.endsWith("/")) return `${currentDir}${path}`;
  return `${currentDir}/${path}`;
}

function getNode(path: string): FSNode | undefined {
  const parts = path.replace(/\/+/g, "/").replace(/\/$/, "").split("/").filter(Boolean);
  let node: FSNode | undefined = fsRoot;
  for (const part of parts) {
    if (node?.type !== "dir" || !node.children) return undefined;
    node = node.children[part];
  }
  return node;
}

function listDir(path: string): string[] | null {
  const node = getNode(path);
  if (!node || node.type !== "dir" || !node.children) return null;
  return Object.entries(node.children).map(([name, n]) =>
    n.type === "dir" ? `${name}/` : name
  );
}

function resolveTarget(path: string): { dir: string; file: string } {
  const normalized = resolvePath(path);
  const parts = normalized.replace(/\/+/g, "/").split("/").filter(Boolean);
  if (parts.length === 0) return { dir: "/", file: "" };
  const file = parts.pop()!;
  const dir = parts.length === 0 ? "/" : `/${parts.join("/")}`;
  return { dir, file };
}

// ─── BANNER ──────────────────────────────────────────────────────────

const BANNER = `
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║     ██████╗ ███████╗██╗   ██╗██╗   ██╗███████╗ ║
  ║     ██╔══██╗██╔════╝██║   ██║██║   ██║██╔════╝ ║
  ║     ██║  ██║█████╗  ██║   ██║██║   ██║█████╗   ║
  ║     ██║  ██║██╔══╝  ╚██╗ ██╔╝╚██╗ ██╔╝██╔══╝   ║
  ║     ██████╔╝███████╗ ╚████╔╝  ╚████╔╝ ███████╗  ║
  ║     ╚═════╝ ╚══════╝  ╚═══╝    ╚═══╝  ╚══════╝  ║
  ║                                                  ║
  ║             🇳🇵  Made in Nepal  🇳🇵               ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
`;

// ─── Command definitions ────────────────────────────────────────────

type CommandHandler = (args: string[], ctx: CommandContext) => CommandResult[] | Promise<CommandResult[]>;

const noopCtx: CommandContext = {
  push: () => {},
  sleep: async () => {},
  ask: async () => "",
  isCancelled: () => false,
};

const COMMANDS: Record<string, { description: string; handler: CommandHandler }> = {
  help: {
    description: "Show available commands",
    handler: () => {
      const lines: CommandResult[] = [{ text: applyNova(""), color: "white" }];
      lines.push({ text: applyNova(" Available commands:"), color: "#4af0ff" });
      lines.push({ text: applyNova(""), color: "white" });
      const entries = Object.entries(COMMANDS).sort(([a], [b]) => a.localeCompare(b));
      for (const [name, cmd] of entries) {
        lines.push({ text: applyNova(`   ${name.padEnd(14)} ${cmd.description}`), color: "white" });
      }
      lines.push({ text: applyNova(""), color: "white" });
      lines.push({ text: applyNova("   [tab] autocomplete  |  [↑][↓] history  |  [ctrl+c] cancel  |  [ctrl+l] clear"), color: "#ffffff40" });
      if (novaMode) {
        lines.push({ text: applyNova("   NOVA mode active — AI commentary on all commands"), color: "#4af0ff" });
      }
      lines.push({ text: applyNova(""), color: "white" });
      return lines;
    },
  },

  banner: {
    description: "Show the banner",
    handler: () => [
      { text: BANNER, color: "#4af0ff" },
      { text: applyNova("         The Architect of Digital Voids"), color: "#ffd700" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("         Type 'help' to see available commands"), color: "#ffffff60" },
      { text: applyNova(""), color: "white" },
    ],
  },

  about: {
    description: "Display information about me",
    handler: () => [
      { text: applyNova(" ┌─ About Me ──────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   I am Bibash Poudel, a 23-year-old technologist"), color: "white" },
      { text: applyNova("   born in the serene landscapes of Sindhuli, Nepal."), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   My journey into the digital realm is driven by"), color: "white" },
      { text: applyNova("   a relentless curiosity to bridge the gap between"), color: "white" },
      { text: applyNova("   complex logic and immersive art."), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Currently working as an Intern at Smartsites Nepal,"), color: "white" },
      { text: applyNova("   applying academic rigor to real-world challenges."), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   \"Code is a canvas, the browser is my gallery.\""), color: "#ffd700" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  whoami: {
    description: "Who are you?",
    handler: () => [
      { text: applyNova(" Bibash Poudel"), color: "#4af0ff" },
      { text: applyNova(" 🇳🇵 Developer from Sindhuli, Nepal"), color: "#ffd700" },
      { text: applyNova(" The Architect of Digital Voids"), color: "#ffffff60" },
    ],
  },

  id: {
    description: "Show user identity",
    handler: () => [
      { text: applyNova(` uid=${uid}(visitor) gid=${uid}(visitor) groups=${uid}(visitor),27(sudo)`), color: "white" },
    ],
  },

  namaste: {
    description: "Greet in Nepali",
    handler: () => [
      { text: applyNova(" नमस्ते! Namaste! 🙏"), color: "#4af0ff" },
      { text: applyNova(" तपाईंलाई भेटेर खुशी लाग्यो।"), color: "white" },
      { text: applyNova(" (Nice to meet you.)"), color: "#ffffff60" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" Welcome to my digital space, built from"), color: "white" },
      { text: applyNova(" the heart of Nepal — land of Mount Everest,"), color: "white" },
      { text: applyNova(" the birthplace of Buddha, and a growing"), color: "white" },
      { text: applyNova(" hub of passionate developers."), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   सधैं खुशी रहनुहोस्!"), color: "#ffd700" },
      { text: applyNova("   (Stay happy always!)"), color: "#ffffff60" },
    ],
  },

  nepal: {
    description: "Show Nepal info",
    handler: () => [
      { text: applyNova(" ┌─ 🇳🇵  Nepal — गौरवशाली नेपाल  ────────────"), color: "#dc143c" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Capital:    Kathmandu"), color: "white" },
      { text: applyNova("   Language:   Nepali (नेपाली)"), color: "white" },
      { text: applyNova("   Timezone:   UTC+5:45 (Nepal Standard Time)"), color: "white" },
      { text: applyNova("   Flag:       The only non-rectangular flag in the world"), color: "white" },
      { text: applyNova("   Motto:      जननी जन्मभूमिश्च स्वर्गादपि गरीयसी"), color: "#ffffff60" },
      { text: applyNova("               (Mother and motherland are greater than heaven)"), color: "#ffffff60" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   🏔️  Highest Peak: Mount Everest (8,848m)"), color: "white" },
      { text: applyNova("   🏛️  UNESCO Sites: 4 (including Lumbini, birthplace of Buddha)"), color: "white" },
      { text: applyNova("   👨‍💻 Dev Culture: Booming tech scene, remote-first, resilient"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   \"Software from the Himalayas — built with altitude attitude.\""), color: "#ffd700" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#dc143c" },
      { text: applyNova(""), color: "white" },
    ],
  },

  pwd: {
    description: "Print working directory",
    handler: () => [{ text: applyNova(` ${currentDir}`), color: "white" }],
  },

  ls: {
    description: "List directory contents",
    handler: (args) => {
      const opts = args.filter((a) => a.startsWith("-"));
      const rest = args.filter((a) => !a.startsWith("-"));
      const long = opts.includes("-l") || opts.includes("-la") || opts.includes("-al");
      const all = opts.includes("-a") || opts.includes("-la") || opts.includes("-al");
      const target = rest[0] ? resolvePath(rest[0]) : currentDir;
      const contents = listDir(target);
      if (contents === null) {
        return [{ text: applyNova(` ls: ${rest[0] || currentDir}: No such directory`), color: "#ff4af0" }];
      }
      if (long) {
        const lines = contents.map((name) => {
          const isDir = name.endsWith("/");
          const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
          const size = isDir ? 4096 : Math.floor(Math.random() * 4000 + 200);
          return ` ${perms} ${uid} ${uid} ${String(size).padStart(6)} ${(new Date().toISOString().slice(0, 10))} ${name}`;
        });
        if (all) {
          lines.unshift(" drwxr-xr-x  1000 1000   4096 2026-07-31 .");
          lines.unshift(" drwxr-xr-x  1000 1000   4096 2026-07-31 ..");
        }
        return lines.map((l) => ({ text: applyNova(l), color: "white" }));
      }
      if (all) contents.unshift(".", "..");
      const line = contents.join("    ");
      return [{ text: applyNova(` ${line}`), color: "white" }];
    },
  },

  cd: {
    description: "Change directory",
    handler: (args) => {
      if (args.length === 0) { currentDir = "/"; return [{ text: "", color: "white" }]; }
      const target = args[0];
      if (target === "..") {
        if (currentDir === "/") return [{ text: "", color: "white" }];
        const parts = currentDir.replace(/\/$/, "").split("/").filter(Boolean);
        parts.pop();
        currentDir = parts.length === 0 ? "/" : `/${parts.join("/")}`;
        return [{ text: "", color: "white" }];
      }
      const resolved = resolvePath(target);
      const node = getNode(resolved);
      if (!node || node.type !== "dir") {
        return [{ text: applyNova(` cd: ${target}: No such directory`), color: "#ff4af0" }];
      }
      currentDir = resolved;
      return [{ text: "", color: "white" }];
    },
  },

  cat: {
    description: "Display file contents",
    handler: (args) => {
      if (args.length === 0 && pipeBuffer) {
        return pipeBuffer.split("\n").map((line) => ({ text: applyNova(` ${line}`), color: "white" }));
      }
      if (args.length === 0) return [{ text: applyNova(" Usage: cat <file>"), color: "#ffd700" }];
      const { dir, file } = resolveTarget(args[0]);
      const dirNode = getNode(dir);
      if (!dirNode?.children?.[file]) {
        return [{ text: applyNova(` cat: ${args[0]}: No such file`), color: "#ff4af0" }];
      }
      const fileNode = dirNode.children[file];
      if (fileNode.type !== "dir") {
        const content = fileNode.content || "";
        return content.split("\n").map((line) => ({ text: applyNova(` ${line}`), color: "white" }));
      }
      return [{ text: applyNova(` cat: ${args[0]}: Is a directory`), color: "#ff4af0" }];
    },
  },

  tree: {
    description: "Display directory tree",
    handler: () => {
      const lines: CommandResult[] = [];
      const walk = (path: string, prefix: string) => {
        const contents = listDir(path);
        if (!contents) return;
        const items = contents.sort((a, b) => a.localeCompare(b));
        items.forEach((name, idx) => {
          const isLast = idx === items.length - 1;
          const childPath = `${path.replace(/\/$/, "")}/${name.replace(/\/$/, "")}`;
          const isDir = name.endsWith("/");
          lines.push({ text: ` ${prefix}${isLast ? "└── " : "├── "}${name}`, color: isDir ? "#4af0ff" : "white" });
          if (isDir) walk(childPath, `${prefix}${isLast ? "    " : "│   "}`);
        });
      };
      walk(currentDir, "");
      return lines;
    },
  },

  mkdir: {
    description: "Create a directory",
    handler: (args) => {
      if (args.length === 0) return [{ text: applyNova(" Usage: mkdir <name>"), color: "#ffd700" }];
      const { dir, file } = resolveTarget(args[0]);
      const dirNode = getNode(dir);
      if (!dirNode || dirNode.type !== "dir") {
        return [{ text: applyNova(` mkdir: cannot create '${args[0]}': No such directory`), color: "#ff4af0" }];
      }
      if (dirNode.children?.[file]) {
        return [{ text: applyNova(` mkdir: cannot create '${args[0]}': File exists`), color: "#ff4af0" }];
      }
      if (!dirNode.children) dirNode.children = {};
      dirNode.children[file] = { type: "dir", children: {} };
      return [{ text: "", color: "white" }];
    },
  },

  touch: {
    description: "Create an empty file",
    handler: (args) => {
      if (args.length === 0) return [{ text: applyNova(" Usage: touch <file>"), color: "#ffd700" }];
      const { dir, file } = resolveTarget(args[0]);
      const dirNode = getNode(dir);
      if (!dirNode || dirNode.type !== "dir") {
        return [{ text: applyNova(` touch: cannot touch '${args[0]}': No such directory`), color: "#ff4af0" }];
      }
      if (!dirNode.children) dirNode.children = {};
      if (!dirNode.children[file]) {
        dirNode.children[file] = { type: "file", content: "" };
      }
      return [{ text: "", color: "white" }];
    },
  },

  rm: {
    description: "Remove files or directories",
    handler: async (args, ctx) => {
      const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
      const rest = args.filter((a) => !a.startsWith("-"));
      if (rest.length === 0) return [{ text: applyNova(" Usage: rm <file>"), color: "#ffd700" }];
      const { dir, file } = resolveTarget(rest[0]);
      const dirNode = getNode(dir);
      const node = dirNode?.children?.[file];
      if (!node) {
        return [{ text: applyNova(` rm: cannot remove '${rest[0]}': No such file or directory`), color: "#ff4af0" }];
      }
      if (node.type === "dir" && !recursive) {
        return [{ text: applyNova(` rm: cannot remove '${rest[0]}': Is a directory`), color: "#ff4af0" }];
      }
      if (node.type === "dir" && recursive && Object.keys(node.children || {}).length > 0) {
        const answer = (await ctx.ask(`rm: descend into directory '${rest[0]}'? (y/n)`)).toLowerCase();
        if (!["y", "yes"].includes(answer)) return [{ text: applyNova(" (nothing removed)"), color: "#ffffff60" }];
      }
      if (dirNode?.children) delete dirNode.children[file];
      return [{ text: "", color: "white" }];
    },
  },

  skills: {
    description: "List technical skills",
    handler: () => [
      { text: applyNova(" ┌─ Technical Skills ────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   ● React        ● Next.js     ● Three.js"), color: "white" },
      { text: applyNova("   ● TypeScript   ● Node.js     ● Tailwind"), color: "white" },
      { text: applyNova("   ● JavaScript   ● HTML/CSS    ● Git"), color: "white" },
      { text: applyNova("   ● REST APIs    ● PostgreSQL  ● Linux CLI"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Use 'cd skills' and 'cat <file>' for details"), color: "#ffffff40" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  projects: {
    description: "List projects",
    handler: () => [
      { text: applyNova(" ┌─ Projects ───────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   📁 DevVerse Terminal"), color: "#ffd700" },
      { text: applyNova("      Interactive CLI portfolio in the browser"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   📁 Smartsites Nepal"), color: "#ffd700" },
      { text: applyNova("      Scalable web apps for real clients"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Use 'cd projects' and 'cat <dir>/README.md' for details"), color: "#ffffff40" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  education: {
    description: "Show education background",
    handler: () => [
      { text: applyNova(" ┌─ Education ──────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Bachelor of Information Technology (BIT)"), color: "white" },
      { text: applyNova("   Bhaktapur Multiple Campus"), color: "white" },
      { text: applyNova("   Currently pursuing — expected 2026"), color: "#ffffff60" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  contact: {
    description: "Show contact information",
    handler: () => [
      { text: applyNova(" ┌─ Contact ────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   📧 Email    bibash@example.com"), color: "white" },
      { text: applyNova("   🌐 GitHub   github.com/bibashpoudel"), color: "white" },
      { text: applyNova("   💼 LinkedIn linkedin.com/in/bibashpoudel"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   Use 'mail' to send a message directly"), color: "#ffd700" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  social: {
    description: "Show social links",
    handler: () => [
      { text: applyNova(" ┌─ Social Links ───────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
      { text: applyNova("   GitHub   github.com/bibashpoudel"), color: "white" },
      { text: applyNova("   LinkedIn linkedin.com/in/bibashpoudel"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
      { text: applyNova(""), color: "white" },
    ],
  },

  clear: {
    description: "Clear the terminal",
    handler: () => [{ text: "__CLEAR__", color: "white" }],
  },

  date: {
    description: "Show current date and time",
    handler: () => [
      { text: applyNova(` ${new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })} NPT`), color: "white" },
    ],
  },

  uptime: {
    description: "Show system uptime",
    handler: () => {
      const h = Math.floor(Math.random() * 12 + 3);
      const m = Math.floor(Math.random() * 60);
      const load = (Math.random() * 2 + 0.1).toFixed(2);
      return [
        { text: applyNova(` ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" })} up ${h}:${String(m).padStart(2, "0")},  1 user,  load average: ${load}, ${(parseFloat(load) + 0.2).toFixed(2)}, ${(parseFloat(load) + 0.35).toFixed(2)}`), color: "white" },
      ];
    },
  },

  uname: {
    description: "Print system information",
    handler: (args) => {
      if (args.includes("-a")) {
        return [{ text: applyNova(" Linux devverse 6.6.0-neon #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"), color: "white" }];
      }
      return [{ text: applyNova(" Linux"), color: "white" }];
    },
  },

  free: {
    description: "Show memory usage",
    handler: () => {
      const total = 16384;
      const used = Math.floor(Math.random() * 4000 + 8000);
      const freeMem = total - used;
      const buff = 1800;
      return [
        { text: applyNova("               total        used        free      shared  buff/cache   available"), color: "#4af0ff" },
        { text: applyNova(` Mem:         ${total}         ${used}         ${freeMem}        512        ${buff}        ${total - used + buff}`), color: "white" },
        { text: applyNova(` Swap:         2048          0        2048`), color: "white" },
      ];
    },
  },

  df: {
    description: "Show disk usage",
    handler: () => [
      { text: applyNova(" Filesystem      Size  Used Avail Use% Mounted on"), color: "#4af0ff" },
      { text: applyNova(" devverse-root    64G   23G   38G  38% /"), color: "white" },
      { text: applyNova(" devverse-tmp    8.0G  1.2G  6.4G  16% /tmp"), color: "white" },
      { text: applyNova(" nepal-cloud      1.0T  12G  988G   2% /mnt/himalaya"), color: "white" },
    ],
  },

  ps: {
    description: "List running processes",
    handler: () => {
      const procs = [
        ["1", "systemd", "0.1"],
        ["237", "nginx", "0.2"],
        ["412", "next-server", "2.4"],
        ["569", "node", "3.1"],
        ["612", "chess-engine", "0.8"],
        ["701", "matrix-rain", "1.9"],
        ["823", "bash", "0.0"],
      ];
      const lines: CommandResult[] = [
        { text: applyNova(" PID  PPID  %CPU  COMMAND"), color: "#4af0ff" },
      ];
      for (const [pid, cmd, cpu] of procs) {
        const ppid = pid === "1" ? "0" : Math.floor(Number(pid) / 2 + 50).toString();
        lines.push({ text: applyNova(` ${pid.padStart(5)} ${ppid.padStart(5)}  ${cpu.padStart(3)}  ${cmd}`), color: "white" });
      }
      return lines;
    },
  },

  top: {
    description: "Show live system summary",
    handler: () => {
      const uptime = (Math.random() * 12 + 3).toFixed(0);
      const tasks = 147 + Math.floor(Math.random() * 20);
      const cpu = (Math.random() * 30 + 5).toFixed(1);
      const mem = 8192 + Math.floor(Math.random() * 2000);
      return [
        { text: applyNova(` top - ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" })} up ${uptime} min,  1 user,  load average: ${(Math.random() * 2 + 0.2).toFixed(2)}`), color: "white" },
        { text: applyNova(` Tasks: ${tasks} total,   1 running,  ${tasks - 2} sleeping,   0 stopped,   1 zombie`), color: "white" },
        { text: applyNova(` %Cpu(s):  ${cpu} us,  ${(Math.random() * 5).toFixed(1)} sy,  0.0 ni, ${(100 - parseFloat(cpu) - 5).toFixed(1)} id`), color: "white" },
        { text: applyNova(` MiB Mem :   ${mem} total,    ${(mem - 6000).toFixed(0)} free,    ${(mem / 2).toFixed(0)} used`), color: "white" },
        { text: applyNova(""), color: "white" },
        { text: applyNova("   PID  USER      %CPU  %MEM     TIME+  COMMAND"), color: "#4af0ff" },
        { text: applyNova(`  ${412 + Math.floor(Math.random() * 20)}  visitor    4.9   3.2   0:12.34 next-server`), color: "white" },
        { text: applyNova(`  612  visitor    2.1   1.8   0:04.11 chess-engine`), color: "white" },
        { text: applyNova(` 823  visitor    0.3   0.4   0:00.19 bash`), color: "white" },
      ];
    },
  },

  ifconfig: {
    description: "Show network interfaces",
    handler: () => [
      { text: applyNova(" eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500"), color: "#4af0ff" },
      { text: applyNova("        inet 192.168.1.23  netmask 255.255.255.0  broadcast 192.168.1.255"), color: "white" },
      { text: applyNova("        ether 3c:97:0e:8a:b2:41  txqueuelen 1000  (Ethernet)"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500"), color: "#4af0ff" },
      { text: applyNova("        inet 192.168.1.45  netmask 255.255.255.0  broadcast 192.168.1.255"), color: "white" },
      { text: applyNova("        ether 8c:16:45:12:9f:77  txqueuelen 1000  (Wireless)"), color: "white" },
      { text: applyNova(""), color: "white" },
      { text: applyNova(" lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536"), color: "#4af0ff" },
      { text: applyNova("        inet 127.0.0.1  netmask 255.0.0.0"), color: "white" },
    ],
  },

  netstat: {
    description: "Show network connections",
    handler: () => [
      { text: applyNova(" Proto Recv-Q Send-Q Local Address           Foreign Address         State"), color: "#4af0ff" },
      { text: applyNova(" tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN"), color: "white" },
      { text: applyNova(" tcp        0      0 127.0.0.1:3000          127.0.0.1:53421         ESTABLISHED"), color: "white" },
      { text: applyNova(" tcp        0      0 192.168.1.23:3000       103.86.99.12:443        ESTABLISHED"), color: "white" },
      { text: applyNova(" udp        0      0 0.0.0.0:5353            0.0.0.0:*"), color: "white" },
    ],
  },

  history: {
    description: "Show command history",
    handler: () => {
      if (commandHistory.length === 0) return [{ text: applyNova(" (no history)"), color: "#ffffff60" }];
      return commandHistory.slice(-50).map((c, i) => ({
        text: applyNova(` ${String(commandHistory.length - 50 + i + 1).padStart(4)}  ${c}`),
        color: "white",
      }));
    },
  },

  man: {
    description: "Show manual for a command",
    handler: (args) => {
      const target = args[0];
      if (!target) return [{ text: applyNova(" What manual page do you want?"), color: "#ffd700" }];
      const cmd = COMMANDS[target];
      if (!cmd) return [{ text: applyNova(` No manual entry for ${target}`), color: "#ff4af0" }];
      return [
        { text: applyNova(` ${target.toUpperCase()}(1) — ${cmd.description}`), color: "#4af0ff" },
        { text: applyNova(""), color: "white" },
        { text: applyNova(`   ${cmd.description}.`), color: "white" },
        { text: applyNova(""), color: "white" },
        { text: applyNova("   This terminal is simulated. Press 'q' in your heart."), color: "#ffffff40" },
        { text: applyNova(""), color: "white" },
      ];
    },
  },

  grep: {
    description: "Search for a pattern",
    handler: (args) => {
      const pattern = args[0];
      if (!pattern) return [{ text: applyNova(" Usage: grep <pattern> [file]"), color: "#ffd700" }];
      let source = pipeBuffer;
      if (args[1]) {
        const { dir, file } = resolveTarget(args[1]);
        const dirNode = getNode(dir);
        const node = dirNode?.children?.[file];
        if (!node || node.type !== "file") {
          return [{ text: applyNova(` grep: ${args[1]}: No such file`), color: "#ff4af0" }];
        }
        source = node.content || "";
      }
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matched = source.split("\n").filter((l) => regex.test(l));
      if (matched.length === 0) return [{ text: "", color: "white" }];
      return matched.map((l) => ({ text: applyNova(` ${l}`), color: "#ffd700" }));
    },
  },

  wc: {
    description: "Count lines, words, chars",
    handler: (args) => {
      let source = pipeBuffer;
      if (args[0]) {
        const { dir, file } = resolveTarget(args[0]);
        const dirNode = getNode(dir);
        const node = dirNode?.children?.[file];
        if (!node || node.type !== "file") {
          return [{ text: applyNova(` wc: ${args[0]}: No such file`), color: "#ff4af0" }];
        }
        source = node.content || "";
      }
      const lines = source.split("\n").length;
      const words = source.split(/\s+/).filter(Boolean).length;
      const chars = source.length;
      return [{ text: applyNova(` ${lines}  ${words}  ${chars}  ${args[0] || ""}`), color: "white" }];
    },
  },

  head: {
    description: "Show first lines of a file",
    handler: (args) => {
      let n = 10;
      const files: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const inline = args[i].match(/^-n(\d+)$/);
        if (inline) {
          n = Math.min(Math.max(parseInt(inline[1], 10), 1), 100);
        } else if (args[i] === "-n" && i + 1 < args.length) {
          const v = parseInt(args[i + 1], 10);
          if (Number.isFinite(v) && v > 0) n = Math.min(v, 100);
          i++;
        } else if (!args[i].startsWith("-")) {
          files.push(args[i]);
        }
      }
      let source = pipeBuffer;
      if (files.length > 0) {
        const file = files[0];
        const { dir, file: f } = resolveTarget(file);
        const node = getNode(dir)?.children?.[f];
        if (!node || node.type !== "file") {
          return [{ text: applyNova(` head: ${file}: No such file`), color: "#ff4af0" }];
        }
        source = node.content || "";
      }
      return source.split("\n").slice(0, n).map((l) => ({ text: applyNova(` ${l}`), color: "white" }));
    },
  },

  tail: {
    description: "Show last lines of a file",
    handler: (args) => {
      let source = pipeBuffer;
      if (args.some((a) => !a.startsWith("-"))) {
        const file = args.find((a) => !a.startsWith("-"))!;
        const { dir, file: f } = resolveTarget(file);
        const node = getNode(dir)?.children?.[f];
        if (!node || node.type !== "file") {
          return [{ text: applyNova(` tail: ${file}: No such file`), color: "#ff4af0" }];
        }
        source = node.content || "";
      }
      return source.split("\n").slice(-5).map((l) => ({ text: applyNova(` ${l}`), color: "white" }));
    },
  },

  echo: {
    description: "Echo back text",
    handler: (args) => [{ text: applyNova(` ${args.join(" ")}`), color: "white" }],
  },

  env: {
    description: "Show environment variables",
    handler: () => [
      { text: applyNova(" USER=visitor"), color: "white" },
      { text: applyNova(" HOSTNAME=devverse"), color: "white" },
      { text: applyNova(" HOME=/home/visitor"), color: "white" },
      { text: applyNova(" SHELL=/bin/devverse-sh"), color: "white" },
      { text: applyNova(" LANG=en_NP.UTF-8"), color: "white" },
      { text: applyNova(" TZ=Asia/Kathmandu"), color: "white" },
      { text: applyNova(" TERM=xterm-256color"), color: "white" },
    ],
  },

  mail: {
    description: "Send a message — mail --to <email> --subject <text>",
    handler: (args) => {
      const toIdx = args.indexOf("--to");
      const subjIdx = args.indexOf("--subject");
      const to = toIdx >= 0 ? (args[toIdx + 1] ?? "") : "";
      let subject = "";
      if (subjIdx >= 0) {
        const end = toIdx > subjIdx ? toIdx : args.length;
        subject = args.slice(subjIdx + 1, end).join(" ");
      }
      if (!to) {
        return [
          { text: applyNova(" ┌─ Mail ──────────────────────────────────"), color: "#4af0ff" },
          { text: applyNova(""), color: "white" },
          { text: applyNova("   Usage:  mail --to <email> --subject <text>"), color: "white" },
          { text: applyNova(""), color: "white" },
          { text: applyNova("   Then type your message and press Enter twice."), color: "#ffffff60" },
          { text: applyNova(""), color: "white" },
          { text: applyNova(" └──────────────────────────────────────────"), color: "#4af0ff" },
          { text: applyNova(""), color: "white" },
        ];
      }
      return [{
        text: applyNova(` ── Composing message to ${to} [${subject || "(no subject)"}] ──\n\n    Type your message below. Press Enter twice to send.\n    (Message input will appear inline in a moment)`) + "\n__MAIL_FORM__:" + JSON.stringify({ to, subject }),
        color: "white",
      }];
    },
  },

  nova: {
    description: "Toggle NOVA AI companion mode",
    handler: () => {
      const mode = toggleNovaMode();
      return [
        { text: mode ? " NOVA mode activated. I'll add my thoughts to each command." : " NOVA mode deactivated. I'll be quiet now.", color: mode ? "#4af0ff" : "#ffffff60" },
        { text: mode ? ` ${NOVA_QUOTES[Math.floor(Math.random() * NOVA_QUOTES.length)]}` : "", color: mode ? "#ffffff80" : "" },
      ];
    },
  },

  neofetch: {
    description: "Display system info",
    handler: () => [
      { text: applyNova("           .---.  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"), color: "#4af0ff" },
      { text: applyNova("          /     \\  OS:      DevVerse OS v1.0"), color: "white" },
      { text: applyNova("          \\.@-@./   Host:    Bibash Poudel"), color: "white" },
      { text: applyNova("          /`\\_/`\\   Kernel:  TypeScript 5.x"), color: "white" },
      { text: applyNova("         //  _  \\\\  Uptime:  23 years"), color: "white" },
      { text: applyNova("        | \\     )|_ Shell:    DevVerse Terminal"), color: "white" },
      { text: applyNova("       /`\\_`>  <_/ \\ Resolution: 1920x1080"), color: "white" },
      { text: applyNova("jgs  \\__/   \\__/   DE:       Bhaktapur Multiple Campus"), color: "white" },
      { text: applyNova(""), color: "white" },
    ],
  },

  fortune: {
    description: "Display a random quote",
    handler: () => [
      { text: applyNova(` ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`), color: "#ffd700" },
    ],
  },

  ping: {
    description: "Ping a host",
    handler: async (args, ctx) => {
      const host = args[0] || "localhost";
      const ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const lines: CommandResult[] = [
        { text: applyNova(` Pinging ${host} [${ip}] with 32 bytes of data:`), color: "white" },
      ];
      for (let i = 0; i < 4; i++) {
        if (ctx.isCancelled()) break;
        lines.push({ text: applyNova(` Reply from ${ip}: bytes=32 time=${Math.floor(Math.random() * 50 + 5)}ms TTL=64`), color: "#4af0ff" });
        ctx.push(lines[lines.length - 1]);
        await ctx.sleep(600);
      }
      lines.push({ text: applyNova(""), color: "white" });
      lines.push({ text: applyNova(` Ping statistics for ${ip}:`), color: "white" });
      lines.push({ text: applyNova(`     Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`), color: "white" });
      lines.push({ text: applyNova(""), color: "white" });
      return [];
    },
  },

  sudo: {
    description: "Execute a command as superuser",
    handler: async (args, ctx) => {
      if (args.length === 0) {
        return [{ text: applyNova(" usage: sudo <command>"), color: "#ffd700" }];
      }
      const password = await ctx.ask("[sudo] password for visitor:", { masked: true });
      if (password !== "devverse" && password !== "root" && password !== "nepal") {
        return [
          { text: applyNova(" [sudo] password for visitor:"), color: "#ffffff60" },
          { text: applyNova(" Sorry, try again."), color: "#ff4af0" },
          { text: applyNova(" sudo: 1 incorrect password attempt"), color: "#ff4af0" },
          { text: applyNova(""), color: "white" },
          { text: applyNova("   (Hint: try 'devverse' or 'nepal')"), color: "#ffffff30" },
        ];
      }
      sudoUser = "root";
      const results = await runCommandInternal(args.join(" "), ctx);
      sudoUser = null;
      return [
        { text: applyNova(" [sudo] password for visitor:"), color: "#ffffff60" },
        { text: applyNova(" [sudo] Authentication successful. Welcome to root."), color: "#00ff41" },
        { text: applyNova(""), color: "white" },
        ...results,
      ];
    },
  },

  matrix: {
    description: "Experience the Matrix",
    handler: () => {
      const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
      const lines: CommandResult[] = [];
      for (let i = 0; i < 20; i++) {
        const len = Math.floor(Math.random() * 60 + 20);
        let line = "";
        for (let j = 0; j < len; j++) {
          line += chars[Math.floor(Math.random() * chars.length)];
        }
        lines.push({ text: ` ${line}`, color: Math.random() > 0.5 ? "#4af0ff" : "#00ff4140" });
      }
      lines.push({ text: "", color: "white" });
      lines.push({ text: applyNova(" Wake up, Neo..."), color: "#00ff41" });
      return lines;
    },
  },

  cmatrix: {
    description: "Live Matrix rain in the terminal",
    handler: async (_args, ctx) => {
      const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
      ctx.push({ text: " (Press ctrl+c to stop)", color: "#ffffff40" });
      while (!ctx.isCancelled()) {
        const len = Math.floor(Math.random() * 80 + 10);
        let line = "";
        for (let j = 0; j < len; j++) line += chars[Math.floor(Math.random() * chars.length)];
        ctx.push({ text: ` ${line}`, color: Math.random() > 0.5 ? "#00ff41" : "#00ff4160" });
        await ctx.sleep(70);
      }
      return [];
    },
  },

  hack: {
    description: "Initiate hacking sequence",
    handler: async (_args, ctx) => {
      const targets = ["root@devverse", "admin@portfolio", "core@system", "nova@ai"];
      ctx.push({ text: " █ HACKING SEQUENCE INITIATED", color: "#ff4af0" });
      ctx.push({ text: "", color: "white" });
      for (let i = 0; i < 12; i++) {
        if (ctx.isCancelled()) break;
        const target = targets[Math.floor(Math.random() * targets.length)];
        const progress = Math.floor((i / 12) * 100);
        const bar = "█".repeat(Math.floor(progress / 5)) + "░".repeat(20 - Math.floor(progress / 5));
        ctx.push({ text: ` [${bar}] ${String(progress).padStart(3)}% — exploiting ${target}`, color: Math.random() > 0.7 ? "#ff4af0" : "#4af0ff" });
        await ctx.sleep(200 + Math.random() * 400);
      }
      ctx.push({ text: "", color: "white" });
      ctx.push({ text: applyNova(" Access granted. You're in."), color: "#00ff41" });
      ctx.push({ text: applyNova(" (Just kidding. This is a simulation.)"), color: "#ffffff30" });
      ctx.push({ text: "", color: "white" });
      return [];
    },
  },

  scan: {
    description: "Scan the local network",
    handler: async (_args, ctx) => {
      const hosts = ["192.168.1.1", "192.168.1.2", "192.168.1.10", "192.168.1.14", "192.168.1.23", "192.168.1.45"];
      ctx.push({ text: " Starting Nmap 7.94 ( https://nmap.org )", color: "white" });
      ctx.push({ text: " Nmap scan report for 192.168.1.0/24", color: "#4af0ff" });
      ctx.push({ text: "", color: "white" });
      for (const host of hosts) {
        if (ctx.isCancelled()) break;
        await ctx.sleep(350);
        const openPorts: [number, string][] = [];
        const candidates: [number, string][] = [[22, "ssh"], [80, "http"], [443, "https"], [3000, "http-alt"], [3001, "nproxy"], [8001, "vcom"]];
        for (const [port, name] of candidates) {
          if (Math.random() > 0.5) openPorts.push([port, name]);
        }
        ctx.push({ text: `  Host ${host} is up (${(Math.random() * 3 + 1).toFixed(1)}ms latency).`, color: "white" });
        if (openPorts.length > 0) {
          ctx.push({ text: `  PORT     STATE  SERVICE`, color: "#4af0ff" });
          for (const [port, name] of openPorts) {
            ctx.push({ text: `  ${String(port).padEnd(7)} open   ${name}`, color: "#00ff41" });
          }
        } else {
          ctx.push({ text: "  All 1000 scanned ports are filtered", color: "#ffffff40" });
        }
        ctx.push({ text: "", color: "white" });
      }
      return [];
    },
  },

  crypto: {
    description: "Encrypt / hash a string — crypto <text>",
    handler: (args) => {
      if (args.length === 0) return [{ text: applyNova(" Usage: crypto <text>"), color: "#ffd700" }];
      const input = args.join(" ");
      let hash = "";
      for (let i = 0; i < 32; i++) {
        hash += "0123456789abcdef"[Math.floor(Math.random() * 16)];
      }
      const bytes = new TextEncoder().encode(input);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      const b64 = btoa(bin);
      return [
        { text: applyNova(` md5  ▸ ${hash}`), color: "white" },
        { text: applyNova(` sha1 ▸ ${"abcdef"[Math.floor(Math.random() * 6)]}${hash.slice(1)}`), color: "white" },
        { text: applyNova(` b64  ▸ ${b64}`), color: "white" },
        { text: applyNova(""), color: "white" },
        { text: applyNova("   (outputs are deterministic-ish. don't rely on them.)"), color: "#ffffff30" },
      ];
    },
  },

  ask: {
    description: "Ask NOVA anything about the portfolio — ask <question>",
    handler: (args) => {
      const question = args.join(" ").toLowerCase();
      if (!question) {
        return [
          { text: " NOVA: Ask me about the portfolio. Try:", color: "#4af0ff" },
          { text: "", color: "white" },
          { text: '   ask "what projects have you built"', color: "#ffffff60" },
          { text: '   ask "what are your skills"', color: "#ffffff60" },
          { text: '   ask "how do I contact you"', color: "#ffffff60" },
          { text: '   ask "tell me about Nepal"', color: "#ffffff60" },
          { text: '   ask "who is bibash"', color: "#ffffff60" },
          { text: "", color: "white" },
        ];
      }

      const answer = answerQuestion(question);
      const lines: CommandResult[] = [
        { text: " NOVA ▸ analyzing...", color: "#ffffff40" },
        { text: "", color: "white" },
      ];
      for (const line of answer.split("\n")) {
        lines.push({ text: ` ${line}`, color: line.startsWith("  ") ? "#ffffff50" : "#00ff41" });
      }
      lines.push({ text: "", color: "white" });
      return lines;
    },
  },

  open: {
    description: "Open a page in the browser — open <page>",
    handler: (args) => {
      const target = args[0]?.toLowerCase();
      if (!target) return [{ text: applyNova(" Usage: open <page>"), color: "#ffd700" }];
      return [{ text: applyNova(` Opening /${target} in the browser…`), color: "white" }];
    },
  },

  fetch: {
    description: "Fetch a page over HTTPS — fetch <resource>",
    handler: async (args, ctx) => {
      const target = args[0]?.toLowerCase() || "home";
      const urls: Record<string, string> = {
        home: "/",
        blog: "/blog",
        projects: "/projects",
        about: "/about",
        skills: "/skills",
        contact: "/contact",
        chess: "/chess",
        commands: "/commands",
      };
      const url = urls[target] || `/${target}`;
      ctx.push({ text: ` GET ${url} HTTP/1.1`, color: "white" });
      ctx.push({ text: " Host: bibash.dev", color: "white" });
      ctx.push({ text: " User-Agent: devverse-shell/2.7.1", color: "#ffffff40" });
      ctx.push({ text: " Accept: text/html,application/json", color: "#ffffff40" });
      await ctx.sleep(400);
      const ok = Object.keys(urls).includes(target);
      ctx.push({ text: ok ? ` HTTP/1.1 200 OK` : ` HTTP/1.1 404 Not Found`, color: ok ? "#00ff41" : "#ff4af0" });
      ctx.push({ text: ` Content-Type: text/html; charset=utf-8`, color: "#ffffff60" });
      await ctx.sleep(250);
      ctx.push({ text: ok ? ` ✓ Fetched ${url} — ${(Math.random() * 40 + 8).toFixed(1)} KB in ${(Math.random() * 200 + 40).toFixed(0)}ms` : ` ✗ ${url} does not exist on this server`, color: ok ? "#00ff41" : "#ff4af0" });
      ctx.push({ text: "", color: "white" });
      return [];
    },
  },

  whois: {
    description: "Look up domain ownership",
    handler: async (_args, ctx) => {
      ctx.push({ text: " Looking up bibash.dev in the whois registry…", color: "white" });
      await ctx.sleep(500);
      ctx.push({ text: "   Domain Name: BIBASH.DEV", color: "white" });
      ctx.push({ text: "   Registrant:   Bibash Poudel", color: "white" });
      ctx.push({ text: "   Country:      NP (Nepal)", color: "white" });
      ctx.push({ text: "   Timezone:     Asia/Kathmandu (UTC+5:45)", color: "white" });
      ctx.push({ text: "   Status:       active — always building", color: "#00ff41" });
      ctx.push({ text: "", color: "white" });
      return [];
    },
  },

  theme: {
    description: "Switch terminal theme — theme [name|list]",
    handler: (args) => {
      const arg = args[0]?.toLowerCase();
      if (!arg || arg === "list") {
        const current = getTheme();
        const lines: CommandResult[] = [{ text: " Available themes:", color: "#4af0ff" }];
        (Object.keys(THEMES) as ThemeName[]).forEach((name) => {
          const mark = name === current ? " ▸" : "  ";
          lines.push({
            text: `   ${mark} ${name.padEnd(9)} ${THEMES[name].label}  ${THEMES[name].accent}`,
            color: name === current ? "#ffd700" : "white",
          });
        });
        lines.push({ text: ` Usage: theme <name> — try 'theme matrix'`, color: "#ffffff60" });
        lines.push({ text: ` Current: ${current}`, color: "#4af0ff" });
        return lines;
      }
      if (!THEMES[arg as ThemeName]) {
        return [{ text: ` theme: unknown theme '${arg}'. Run 'theme list'.`, color: "#ff4af0" }];
      }
      applyTheme(arg as ThemeName);
      const def = THEMES[arg as ThemeName];
      return [
        { text: ` Theme set to ${def.label} ${def.accent}`, color: def.accent },
        { text: " (accent color applied across the whole site — refresh-safe)", color: "#ffffff60" },
      ];
    },
  },

  sound: {
    description: "Switch key-switch sound profile — sound [profile|list]",
    handler: (args) => {
      const arg = args[0]?.toLowerCase();
      const profiles = Object.keys(SOUND_PROFILE_LABELS) as SoundProfile[];
      if (!arg || arg === "list") {
        const current = getSoundProfile();
        const lines: CommandResult[] = [{ text: " Key-switch sound profiles:", color: "#4af0ff" }];
        profiles.forEach((p) => {
          const mark = p === current ? " ▸" : "  ";
          lines.push({ text: `   ${mark} ${p.padEnd(6)} ${SOUND_PROFILE_LABELS[p]}`, color: p === current ? "#ffd700" : "white" });
        });
        lines.push({ text: ` Usage: sound <profile> — try 'sound brown' (then type to hear it)`, color: "#ffffff60" });
        lines.push({ text: ` Current: ${current}`, color: "#4af0ff" });
        return lines;
      }
      if (!profiles.includes(arg as SoundProfile)) {
        return [{ text: ` sound: unknown profile '${arg}'. Run 'sound list'.`, color: "#ff4af0" }];
      }
      setSoundProfile(arg as SoundProfile);
      return [
        { text: ` Sound profile set to ${SOUND_PROFILE_LABELS[arg as SoundProfile]}`, color: "#00ff41" },
        { text: " (click anywhere or type to hear your new switches)", color: "#ffffff60" },
      ];
    },
  },
};

function answerQuestion(q: string): string {
  const hit = (words: string[]) => words.some((w) => q.includes(w));

  if (hit(["project", "built", "build", "portfolio", "work"])) {
    return "Projects I've built:\n  → iVote — end-to-end encrypted voting (Paillier homomorphic)\n  → Pharma Connect — patient-pharmacy linkage\n  → Automate — teacher portfolio platform\n  → Match Day Poster — live football tracker\n  → Nico Paz — WordPress theme\n  → Himalayan — audit-fix WordPress plugin\n\n  Run 'projects' or visit /projects for full case studies.";
  }

  if (hit(["skill", "tech", "stack", "language", "know"])) {
    return "Core stack:\n  → Frontend: React, Next.js, TypeScript, Tailwind\n  → 3D: Three.js / React Three Fiber\n  → Backend: Node.js, Python, REST APIs\n  → Data: PostgreSQL\n  → Also: WordPress, PHP, WooCommerce, Git, Figma\n\n  Run 'skills' or visit /skills.";
  }

  if (hit(["contact", "email", "mail", "reach", "hire", "freelance", "job", "work with"])) {
    return "Ways to reach me:\n  → Email: bibashpoudel@email.com\n  → GitHub: github.com/beebus-builds\n  → LinkedIn: linkedin.com/in/bibashpoudel\n  → Or use the 'mail' command to send a message.\n\n  Currently open to internship, freelance, and full-time roles.";
  }

  if (hit(["nepal", "country", "himayla", "himalaya", "everest", "kathmandu", "sindhuli"])) {
    return "Nepal — land of mountains and code:\n  → Home: Sindhuli, with views of the Himalayas\n  → Capital: Kathmandu (Bhaktapur Multiple Campus)\n  → Highest peak: Everest, 8,848m\n  → Timezone: UTC+5:45, 45 minutes ahead of the world\n  → Tech scene: young, remote-first, and growing fast";
  }

  if (hit(["who", "bibash", "about", "name", "yourself", "developer"])) {
    return "Bibash Poudel:\n  → 23-year-old developer from Sindhuli, Nepal\n  → Intern at Smartsites Nepal\n  → BIT at Bhaktapur Multiple Campus\n  → Motto: \"Code is a canvas, the browser is my gallery.\"\n\n  Run 'about' for the full identity card.";
  }

  if (hit(["blog", "write", "post"])) {
    return "The blog has posts about building and designing.\n  → Run 'blog' or visit /blog\n  → Want to write? The editor lives at /admin/new\n  → There's even an RSS feed at /rss.xml";
  }

  if (hit(["education", "study", "college", "degree", "university"])) {
    return "Education:\n  → Bachelor of Information Technology (BIT)\n  → Bhaktapur Multiple Campus\n  → Expected graduation: 2026\n\n  Run 'education' for details.";
  }

  if (hit(["chess", "play", "game", "board", "minimax"])) {
    return "Chess is live at /chess — a fully legal engine in the browser.\n  Castling, en passant, promotion, and a minimax opponent\n  at easy / medium / hard. Play as white or black.";
  }

  if (hit(["resume", "cv", "download"])) {
    return "My resume is available:\n  → Download at /resume.pdf";
  }

  return "Hmm, I'm not sure about that one.\n  Try asking about projects, skills, contact, Nepal, education, chess, or the blog.\n  Or just type 'help' — the terminal has plenty to explore.";
}

// ─── Shell parsing ─────────────────────────────────────────────────

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (/\s/.test(ch)) {
      if (cur) { tokens.push(cur); cur = ""; }
    } else if (ch === "\\" && i + 1 < input.length) {
      cur += input[i + 1];
      i++;
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function splitOperators(input: string): string[] {
  const parts: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    const two = input.slice(i, i + 2);
    if (two === "&&" || two === "||") {
      if (cur.trim()) parts.push(cur.trim());
      parts.push(two);
      cur = "";
      i++;
      continue;
    }
    if (ch === ";" || ch === "|") {
      if (cur.trim()) parts.push(cur.trim());
      parts.push(ch);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function extractRedirection(tokens: string[]): { args: string[]; redirect: { file: string; append: boolean } | null } {
  const out = { args: [] as string[], redirect: null as { file: string; append: boolean } | null };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === ">") {
      out.redirect = { file: tokens[i + 1] || "", append: false };
      i++;
    } else if (t === ">>") {
      out.redirect = { file: tokens[i + 1] || "", append: true };
      i++;
    } else {
      out.args.push(t);
    }
  }
  return out;
}

async function runCommandInternal(input: string, ctx: CommandContext): Promise<CommandResult[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const segments = splitOperators(trimmed);
  const allResults: CommandResult[] = [];
  let lastText = "";

  for (const seg of segments) {
    if (seg === "&&" || seg === "||") {
      const fail = lastText.toLowerCase().includes("no such") || lastText.toLowerCase().includes("denied") || lastText.toLowerCase().includes("error");
      if (seg === "&&" && fail) break;
      if (seg === "||" && !fail) break;
      continue;
    }
    if (seg === "|") { continue; }
    if (seg === ";") { continue; }

    const tokens = tokenize(seg);
    if (tokens.length === 0) continue;
    const { args, redirect } = extractRedirection(tokens);
    if (args.length === 0) continue;

    const cmd = args[0].toLowerCase();
    const commandArgs = args.slice(1);

    if (isPageCommand(cmd)) {
      pipeBuffer = `  (navigating to /${cmd})`;
      lastText = pipeBuffer;
      allResults.push({ text: ` /${cmd} is a page — use 'open ${cmd}' or visit it in the browser.`, color: "#ffd700" });
      continue;
    }

    const command = COMMANDS[cmd];
    if (!command) {
      const err = ` command not found: ${cmd}. Type 'help' for available commands.`;
      lastText = err;
      allResults.push({ text: applyNova(err), color: "#ff4af0" });
      continue;
    }

    let results: CommandResult[];
    if (cmd === "cat" && redirect) {
      const pipeCtx: CommandContext = { ...ctx };
      results = await command.handler(commandArgs, pipeCtx);
      const content = results.map((r) => r.text).join("\n");
      const { dir, file } = resolveTarget(redirect.file);
      const dirNode = getNode(dir);
      if (dirNode?.children) {
        const existing = dirNode.children[file];
        dirNode.children[file] = { type: "file", content: redirect.append && existing?.type === "file" ? (existing.content || "") + content : content };
      }
      results = [];
    } else if (redirect) {
      const subCtx: CommandContext = { ...ctx, push: (r) => { pipeBuffer += r.text + "\n"; } };
      results = await command.handler(commandArgs, subCtx);
      const content = results.map((r) => r.text).join("\n");
      const { dir, file } = resolveTarget(redirect.file);
      const dirNode = getNode(dir);
      if (dirNode?.children) {
        const existing = dirNode.children[file];
        dirNode.children[file] = { type: "file", content: redirect.append && existing?.type === "file" ? (existing.content || "") + content : content };
      }
      results = [];
    } else {
      results = await command.handler(commandArgs, ctx);
    }

    if (results.length === 1 && results[0].text === "__CLEAR__") {
      allResults.length = 0;
      allResults.push(results[0]);
      return allResults;
    }

    lastText = results.map((r) => r.text).join("\n");
    if (lastText) pipeBuffer = lastText;
    allResults.push(...results);
  }

  return allResults;
}

// ─── Page Commands ─────────────────────────────────────────────────────

const PAGE_COMMANDS = new Set(["about", "projects", "skills", "contact", "education", "blog", "commands", "chess"]);

export function isPageCommand(name: string): boolean {
  return PAGE_COMMANDS.has(name);
}

// ─── Public API ─────────────────────────────────────────────────────

export function getCommandNames(): string[] {
  return Object.keys(COMMANDS);
}

export async function executeCommand(input: string, ctx?: CommandContext): Promise<CommandResult[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];
  logHistory(trimmed);

  const activeCtx = ctx || noopCtx;

  const hasNovaFlag = /\s--nova\b/.test(trimmed) || /^--nova\b/.test(trimmed);
  const cleaned = trimmed.replace(/\s*--nova\b/g, "").trim();
  if (hasNovaFlag && !novaMode) {
    novaMode = true;
  }

  const results = await runCommandInternal(cleaned, activeCtx);

  if (hasNovaFlag && novaMode) novaMode = false;
  return results;
}

export function getCommandDescription(name: string): string | undefined {
  return COMMANDS[name]?.description;
}

export function getAutocomplete(input: string): string[] {
  const tokens = tokenize(input);
  const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : "";
  const prevToken = tokens.length > 1 ? tokens[tokens.length - 2] : "";
  if (prevToken === "theme") {
    return (Object.keys(THEMES) as ThemeName[]).filter((n) => n.startsWith(lastToken));
  }
  if (prevToken === "sound") {
    return (Object.keys(SOUND_PROFILE_LABELS) as SoundProfile[]).filter((n) => n.startsWith(lastToken));
  }
  const isDirPath = lastToken.includes("/") || lastToken.startsWith(".");
  if (isDirPath) {
    const full = resolvePath(lastToken);
    const { dir } = resolveTarget(full);
    const dirNode = getNode(dir);
    if (!dirNode?.children) return [];
    const dirPath = dir === "/" ? "" : dir;
    return Object.keys(dirNode.children)
      .filter((n) => n.startsWith(full.split("/").pop() || ""))
      .map((n) => {
        const isDir = dirNode.children![n].type === "dir";
        return `${dirPath}/${n}${isDir ? "/" : ""}`;
      });
  }
  const names = Object.keys(COMMANDS).filter((n) => n.startsWith(lastToken));
  if (names.length > 1) return names;
  return names;
}

export async function getBanner(): Promise<CommandResult[]> {
  const result = COMMANDS.banner.handler([], noopCtx);
  return result instanceof Promise ? result : result;
}
