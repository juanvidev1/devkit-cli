import path from "path";
import fs from "fs-extra";
import { spawn } from "child_process";

export type GeneratorOptions = {
  projectName?: string;
  useViteInstaller?: boolean; // if true, run `npm create vite@latest` for the frontend
  runInstall?: boolean; // if true, run `npm install` in frontend (and optionally pip for backend) — disabled by default
  dbUrl?: string; // optional DATABASE_URL to write into backend/.env
  dbType?: string; // optional db type: sqlite | postgres | mysql
  useJwt?: boolean; // if true, include JWT auth example
};

async function runCommand(cmd: string, args: string[], cwd?: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: cwd ?? process.cwd(),
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

/**
 * Generate a minimal FastAPI backend and a React frontend (Vite) inside targetDir.
 *
 * This function is intentionally conservative: it writes small template files and
 * returns before running heavy installs unless `options.runInstall` is true.
 */
export async function generateFastapiReact(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  // create target root
  await fs.ensureDir(fullTarget);
  // Prepare backend/frontend paths (always defined)
  const backendDir = path.join(fullTarget, "backend");
  const frontendDir = path.join(fullTarget, "frontend");

  // Prefer copying from templates if available
  const templatesRoot = path.resolve(
    __dirname,
    "..",
    "templates",
    "fastapi-react"
  );
  const templatesExist = await fs.pathExists(templatesRoot);

  if (templatesExist) {
    console.log(
      `ℹ️  Plantillas encontradas en ${templatesRoot} — copiando al destino...`
    );
    // Copy the entire template tree into target
    await fs.copy(templatesRoot, fullTarget, {
      overwrite: true,
      recursive: true,
    });

    // Si el usuario NO quiere JWT, elimina archivos y dependencias JWT
    if (!options.useJwt) {
      // Eliminar archivos JWT
      await fs.remove(path.join(fullTarget, "backend/app/api/auth.py"));
      await fs.remove(path.join(fullTarget, "backend/app/core/jwt_utils.py"));
      // Quitar dependencias JWT de requirements.txt
      const reqPath = path.join(fullTarget, "backend/requirements.txt");
      if (await fs.pathExists(reqPath)) {
        let reqText = await fs.readFile(reqPath, "utf8");
        reqText = reqText
          .replace(/^python-jose\[cryptography\].*\n?/m, "")
          .replace(/^passlib\[bcrypt\].*\n?/m, "");
        await fs.writeFile(reqPath, reqText, "utf8");
      }
      // Eliminar import y router de auth en main.py
      const mainPath = path.join(fullTarget, "backend/main.py");
      if (await fs.pathExists(mainPath)) {
        let mainText = await fs.readFile(mainPath, "utf8");
        mainText = mainText
          .replace(/from app\.api import auth\n/, "")
          .replace(/app\.include_router\(auth\.router\)\n/, "");
        await fs.writeFile(mainPath, mainText, "utf8");
      }
    } else {
      // Si el usuario quiere JWT, añade endpoint protegido de ejemplo
      const protectedPath = path.join(
        fullTarget,
        "backend/app/api/protected.py"
      );
      const protectedCode =
        "from fastapi import APIRouter, Depends, HTTPException, status\n" +
        "from fastapi.security import OAuth2PasswordBearer\n" +
        "from app.core.jwt_utils import verify_access_token\n" +
        "\n" +
        'router = APIRouter(prefix="/protected", tags=["protected"])\n' +
        'oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")\n' +
        "\n" +
        "def get_current_user(token: str = Depends(oauth2_scheme)):\n" +
        "    payload = verify_access_token(token)\n" +
        "    if not payload:\n" +
        '        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")\n' +
        "    return payload\n" +
        "\n" +
        '@router.get("/me")\n' +
        "def read_me(user = Depends(get_current_user)):\n" +
        '    return {"user": user}\n';
      await fs.writeFile(protectedPath, protectedCode, "utf8");
      // Añadir import y router en main.py
      const mainPath = path.join(fullTarget, "backend/main.py");
      if (await fs.pathExists(mainPath)) {
        let mainText = await fs.readFile(mainPath, "utf8");
        if (!/from app\.api import protected/.test(mainText)) {
          mainText = mainText.replace(
            /from app\.api import ([^\n]+)/,
            (m, p1) => `from app.api import ${p1}, protected`
          );
        }
        if (!/app\.include_router\(protected\.router\)/.test(mainText)) {
          mainText = mainText.replace(
            /app\.include_router\(items\.router\)\n/,
            "app.include_router(items.router)\napp.include_router(protected.router)\n"
          );
        }
        await fs.writeFile(mainPath, mainText, "utf8");
      }
    }

    // If user requested the Vite installer, remove the copied frontend and run the installer
    if (options.useViteInstaller) {
      const copiedFrontend = path.join(fullTarget, "frontend");
      if (await fs.pathExists(copiedFrontend)) {
        console.log(
          "ℹ️  Eliminando frontend copiado para usar el instalador de Vite..."
        );
        await fs.remove(copiedFrontend);
      }
      console.log(
        "ℹ️  Ejecutando el instalador de Vite (npm create vite@latest)..."
      );
      await runCommand(
        "npm",
        ["create", "vite@latest", "frontend", "--", "--template", "react"],
        fullTarget
      );
    }
    // If templates included a project-level podman-compose, ensure it's present (copied above).
    // If the user provided a dbUrl, we will write a project-level .env so compose can pick it up.
    if (options.dbUrl) {
      try {
        const projectEnvPath = path.join(fullTarget, ".env");
        await fs.writeFile(
          projectEnvPath,
          `DATABASE_URL=${options.dbUrl}\n`,
          "utf8"
        );
        console.log(`ℹ️  Escribiendo DATABASE_URL en ${projectEnvPath}`);
      } catch (err) {
        console.warn(
          "⚠️  No se pudo escribir .env en la raíz del proyecto:",
          err
        );
      }

      // Also try to ensure backend requirements include drivers when templates exist
      try {
        const reqPath = path.join(backendDir, "requirements.txt");
        let reqText = "";
        if (await fs.pathExists(reqPath)) {
          reqText = await fs.readFile(reqPath, "utf8");
        }

        const wants = options.dbType || "sqlite";
        const additions: string[] = [];
        if (wants === "postgres") {
          if (!/asyncpg/.test(reqText)) additions.push("asyncpg");
          if (!/databases\[postgresql\]/.test(reqText))
            additions.push("databases[postgresql]");
        } else if (wants === "mysql") {
          if (!/aiomysql/.test(reqText)) additions.push("aiomysql");
          if (!/databases\[mysql\]/.test(reqText))
            additions.push("databases[mysql]");
        } else {
          if (!/aiosqlite/.test(reqText)) additions.push("aiosqlite");
          if (!/databases\[sqlite\]/.test(reqText))
            additions.push("databases[sqlite]");
        }

        if (additions.length > 0) {
          const toAppend = additions.join("\n") + "\n";
          await fs.appendFile(reqPath, toAppend, "utf8");
          console.log(
            `ℹ️  Añadiendo dependencias de DB a requirements.txt: ${additions.join(", ")}`
          );
        }
      } catch (err) {
        console.warn(
          "⚠️  No se pudo actualizar requirements.txt con drivers de DB:",
          err
        );
      }
    }
  } else {
    // If the user provided a dbUrl/dbType, persist it into the backend and
    // make sure the backend requirements include the appropriate async driver
    // so `pip install -r requirements.txt` will pull the correct packages.
    if (options.dbUrl) {
      try {
        // write a simple .env file with DATABASE_URL
        const envPath = path.join(backendDir, ".env");
        const envContent = `DATABASE_URL=${options.dbUrl}\n`;
        await fs.writeFile(envPath, envContent, "utf8");
        console.log(`ℹ️  Escribiendo DATABASE_URL en ${envPath}`);
      } catch (err) {
        console.warn("⚠️  No se pudo escribir .env en el backend:", err);
      }

      // Ensure requirements.txt contains the appropriate driver
      try {
        const reqPath = path.join(backendDir, "requirements.txt");
        let reqText = "";
        if (await fs.pathExists(reqPath)) {
          reqText = await fs.readFile(reqPath, "utf8");
        }

        const wants = options.dbType || "sqlite";
        const additions: string[] = [];
        if (wants === "postgres") {
          if (!/asyncpg/.test(reqText)) additions.push("asyncpg");
          if (!/databases\[postgresql\]/.test(reqText))
            additions.push("databases[postgresql]");
        } else if (wants === "mysql") {
          if (!/aiomysql/.test(reqText)) additions.push("aiomysql");
          if (!/databases\[mysql\]/.test(reqText))
            additions.push("databases[mysql]");
        } else {
          // sqlite by default
          if (!/aiosqlite/.test(reqText)) additions.push("aiosqlite");
          if (!/databases\[sqlite\]/.test(reqText))
            additions.push("databases[sqlite]");
        }

        if (additions.length > 0) {
          const toAppend = additions.join("\n") + "\n";
          await fs.appendFile(reqPath, toAppend, "utf8");
          console.log(
            `ℹ️  Añadiendo dependencias de DB a requirements.txt: ${additions.join(", ")}`
          );
        }
      } catch (err) {
        console.warn(
          "⚠️  No se pudo actualizar requirements.txt con drivers de DB:",
          err
        );
      }
    }
    // Backend: minimal FastAPI app
    await fs.ensureDir(backendDir);

    const mainPy = `from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
        return {"message": "Hello from FastAPI"}
`;

    const requirements = `fastapi[standard]
`;

    await fs.writeFile(path.join(backendDir, "main.py"), mainPy, "utf8");
    await fs.writeFile(
      path.join(backendDir, "requirements.txt"),
      requirements,
      "utf8"
    );

    // Frontend: either use Vite installer or create minimal Vite+React files
    await fs.ensureDir(frontendDir);

    if (options.useViteInstaller) {
      // Try to invoke the Vite installer. This requires network and npm.
      console.log(
        "ℹ️  Ejecutando el instalador de Vite (npm create vite@latest)..."
      );
      // Use `npm create vite@latest <dir> -- --template react` (non-interactive)
      await runCommand(
        "npm",
        ["create", "vite@latest", "frontend", "--", "--template", "react"],
        fullTarget
      );
    } else {
      // Minimal Vite + React scaffold (JSX, not TypeScript) so it works out of the box
      const pkg = {
        name: `${name}-frontend`,
        private: true,
        version: "0.0.0",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
        },
        devDependencies: {
          vite: "^5.0.0",
        },
      };

      await fs.writeJSON(path.join(frontendDir, "package.json"), pkg, {
        spaces: 2,
      });

      const indexHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name} - frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

      const mainJsx = `import React from \"react\";
import { createRoot } from \"react-dom/client\";
import App from \"./App.jsx\";

createRoot(document.getElementById('root')).render(<App />);
`;

      const appJsx = `import React from \"react\";

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Hello from React + Vite</h1>
      <p>This is a minimal frontend generated by stackforge-cli.</p>
    </div>
  );
}
`;

      await fs.ensureDir(path.join(frontendDir, "src"));
      await fs.writeFile(
        path.join(frontendDir, "index.html"),
        indexHtml,
        "utf8"
      );
      await fs.writeFile(
        path.join(frontendDir, "src", "main.jsx"),
        mainJsx,
        "utf8"
      );
      await fs.writeFile(
        path.join(frontendDir, "src", "App.jsx"),
        appJsx,
        "utf8"
      );
    }
  }

  // In the non-templates branch we already wrote backend/.env and updated backend requirements

  // Optionally run installs
  if (options.runInstall) {
    console.log("ℹ️  Instalando dependencias del frontend (npm install)...");
    await runCommand("npm", ["install"], frontendDir);

    // Backend: try to create a venv and install requirements if python/pip exists; we avoid failing hard
    try {
      console.log(
        "ℹ️  Intentando instalar dependencias de Python para el backend"
      );
      // Try `python -m pip install -r requirements.txt` in backendDir
      await runCommand(
        "python3",
        ["-m", "pip", "install", "-r", "requirements.txt"],
        backendDir
      );
    } catch (err) {
      console.warn(
        "⚠️  No se pudo instalar dependencias de Python automáticamente (salta esta parte):",
        err.message
      );
    }
  }

  console.log(`\n✅ Plantilla generada en: ${fullTarget}`);
  console.log(` - Backend: ${path.relative(process.cwd(), backendDir)}`);
  console.log(` - Frontend: ${path.relative(process.cwd(), frontendDir)}`);
}

export default generateFastapiReact;
