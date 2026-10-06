"use client";

import { useEffect, useState } from "react";

const HANDLE = "beebus-builds";

type Repo = {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  updated_at: string;
};

const LANGUAGE_COLOR: Record<string, string> = {
  TypeScript: "#4fb8ff",
  JavaScript: "#ffd166",
  Python: "#8ad6ff",
  PHP: "#a78bfa",
  CSS: "#ff6b9d",
  HTML: "#ff9f45",
};

/** GitHub repos plotted as a constellation: dot size scales with stars. */
export default function GitHubConstellation() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${HANDLE}/repos?per_page=100&sort=updated`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("github"))))
      .then((data: Repo[]) => {
        if (!cancelled) setRepos(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <p className="constellation__status">
        The constellation is out of range right now — visit{" "}
        <a href={`https://github.com/${HANDLE}`} target="_blank" rel="noreferrer">
          github.com/{HANDLE}
        </a>{" "}
        directly.
      </p>
    );
  }

  if (!repos) return <p className="constellation__status">Plotting stars…</p>;

  const stars = repos.reduce((total, repo) => total + repo.stargazers_count, 0);

  return (
    <div className="constellation">
      <div className="constellation__sky" role="img" aria-label={`${repos.length} GitHub repositories`}>
        {repos.map((repo, index) => {
          const angle = index * 2.39996; // golden angle keeps the field even
          const spread = 46;
          const radius = Math.sqrt((index + 1) / repos.length) * spread;
          const size = 5 + Math.min(16, Math.sqrt(repo.stargazers_count + 1) * 3.5);
          const language = repo.language ?? "Other";
          return (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              title={`${repo.name} · ${language} · ${repo.stargazers_count} stars`}
              style={{
                left: `${50 + Math.cos(angle) * radius}%`,
                top: `${50 + Math.sin(angle) * radius}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: LANGUAGE_COLOR[language] ?? "#8d9bb5",
              }}
            />
          );
        })}
      </div>
      <ul className="constellation__list">
        {repos.slice(0, 8).map((repo) => (
          <li key={repo.id}>
            <a href={repo.html_url} target="_blank" rel="noreferrer">
              {repo.name}
            </a>
            <span>{repo.language ?? "—"}</span>
            <small>★ {repo.stargazers_count}</small>
          </li>
        ))}
      </ul>
      <p className="constellation__status">
        {repos.length} repositories · {stars} stars · plotted live from GitHub
      </p>
    </div>
  );
}