// GET /api/debug/github?url=https://github.com/owner/repo&files=path1,path2
// Fetches public GitHub repo file tree and contents for analysis
import { NextRequest, NextResponse } from "next/server";
import { getChutesAccessToken } from "@/lib/serverAuth";

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cpp", ".c",
  ".cs", ".rb", ".php", ".swift", ".kt", ".scala", ".vue", ".svelte",
]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "__pycache__", "vendor", ".venv"]);

function isCodeFile(path: string): boolean {
  const ext = "." + path.split(".").pop()?.toLowerCase();
  const firstSegment = path.split("/")[0];
  if (SKIP_DIRS.has(firstSegment)) return false;
  if (path.includes("/.")) return false; // hidden dirs
  return CODE_EXTENSIONS.has(ext);
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const accessToken = await getChutesAccessToken();
  if (!accessToken) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get("url");
  const selectedFiles = searchParams.get("files")?.split(",").filter(Boolean);

  if (!repoUrl) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return NextResponse.json({ error: "Invalid GitHub URL. Use https://github.com/owner/repo" }, { status: 400 });

  const { owner, repo } = parsed;
  const headers: HeadersInit = { "Accept": "application/vnd.github.v3+json", "User-Agent": "Trace-Debugger/1.0" };

  // Stage 1: Fetch repo metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) {
    if (repoRes.status === 404) return NextResponse.json({ error: "Repo not found or is private. Trace only supports public repos." }, { status: 404 });
    return NextResponse.json({ error: `GitHub API error: ${repoRes.status}` }, { status: 502 });
  }
  const repoMeta = await repoRes.json();

  // Stage 2: Fetch file tree
  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoMeta.default_branch}?recursive=1`, { headers });
  if (!treeRes.ok) return NextResponse.json({ error: "Could not fetch file tree" }, { status: 502 });
  const treeData = await treeRes.json();

  const allFiles: { path: string; size: number }[] = (treeData.tree || [])
    .filter((f: { type: string; path: string; size?: number }) => f.type === "blob" && isCodeFile(f.path) && (f.size || 0) < 80000)
    .map((f: { path: string; size: number }) => ({ path: f.path, size: f.size }))
    .slice(0, 150); // cap tree size

  // If specific files requested, fetch those; otherwise return tree for user to pick
  if (!selectedFiles?.length) {
    return NextResponse.json({
      repoMeta: { owner, repo, description: repoMeta.description, language: repoMeta.language, stars: repoMeta.stargazers_count, defaultBranch: repoMeta.default_branch },
      files: allFiles,
    });
  }

  // Fetch content of selected files (max 12 to stay within token limits)
  const toFetch = selectedFiles.slice(0, 12);
  const fileContents: { path: string; content: string }[] = [];

  await Promise.all(
    toFetch.map(async (filePath) => {
      try {
        const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${repoMeta.default_branch}`, { headers });
        if (!fileRes.ok) return;
        const fileData = await fileRes.json();
        if (fileData.encoding === "base64" && fileData.content) {
          const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
          fileContents.push({ path: filePath, content: decoded });
        }
      } catch { /* skip failed files */ }
    })
  );

  const combinedContent = fileContents
    .map((f) => `// ─── File: ${f.path} ───────────────────────────\n${f.content}`)
    .join("\n\n");

  return NextResponse.json({
    repoMeta: { owner, repo, description: repoMeta.description, language: repoMeta.language },
    content: combinedContent,
    filesFetched: fileContents.map((f) => f.path),
  });
}
