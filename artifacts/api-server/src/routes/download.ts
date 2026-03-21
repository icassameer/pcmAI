import { Router, type IRouter } from "express";
import archiver from "archiver";
import path from "path";

const router: IRouter = Router();

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../..");

const EXCLUDED_PATTERNS = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  ".cache/**",
  ".local/**",
  ".canvas/**",
  "*.log",
  ".replit",
  "replit.nix",
  ".config/**",
  "**/.turbo/**",
  "**/tsconfig.tsbuildinfo",
];

router.get("/download/source-code", (_req, res): void => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=inventopro-source-code.zip");

  const archive = archiver("zip", { zlib: { level: 5 } });

  archive.on("error", (err) => {
    console.error("Archive error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create archive" });
    }
  });

  archive.pipe(res);

  archive.glob("**/*", {
    cwd: WORKSPACE_ROOT,
    ignore: EXCLUDED_PATTERNS,
    dot: false,
  });

  archive.finalize();
});

export default router;
