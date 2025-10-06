/// <reference types="node" />
/**
 * Genera un backend Express y un frontend Vue (Vite) en targetDir.
 * Replica la lógica de generateFastapiReact pero usando la plantilla express-vue.
 */
export async function generateExpressVue(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  // Crear directorio raíz
  await fs.ensureDir(fullTarget);
  // Rutas backend/frontend
  const backendDir = path.join(fullTarget, "backend");
  const frontendDir = path.join(fullTarget, "frontend");

  // Copiar desde templates si existen
  const templatesRoot = path.resolve(
    __dirname,
    "..",
    "templates",
    "express-vue"
  );
  const templatesExist = await fs.pathExists(templatesRoot);

  if (templatesExist) {
    // Copiar el archivo de compose adecuado
    if (options.composeTool === "podman") {
      const podmanComposePath = path.join(templatesRoot, "podman-compose.yml");
      if (await fs.pathExists(podmanComposePath)) {
        await fs.copy(
          podmanComposePath,
          path.join(fullTarget, "podman-compose.yml"),
          { overwrite: true }
        );
      }
    } else {
      // Por defecto docker
      const dockerComposePath = path.join(templatesRoot, "docker-compose.yml");
      if (await fs.pathExists(dockerComposePath)) {
        await fs.copy(
          dockerComposePath,
          path.join(fullTarget, "docker-compose.yml"),
          { overwrite: true }
        );
      }
    }
    console.log(
      `ℹ️  Plantillas encontradas en ${templatesRoot} — copiando al destino...`
    );
    await fs.copy(templatesRoot, fullTarget, {
      overwrite: true,
      recursive: true,
    });

    // --- Lógica de tipo de BD ---
    const dbType = options.dbType || "sqlite";
    if (dbType === "mongodb") {
      // Mongo: reemplazar db.js por db_mongo.js, items.js por items_mongo.js
      await fs.remove(path.join(fullTarget, "backend/db.js"));
      await fs.copy(
        path.join(fullTarget, "backend/db_mongo.js"),
        path.join(fullTarget, "backend/db.js"),
        { overwrite: true }
      );
      await fs.remove(path.join(fullTarget, "backend/items.js"));
      await fs.copy(
        path.join(fullTarget, "backend/items_mongo.js"),
        path.join(fullTarget, "backend/items.js"),
        { overwrite: true }
      );
      // Ajustar package.json: añadir dependencia mongodb si no está
      const pkgPath = path.join(fullTarget, "backend/package.json");
      if (await fs.pathExists(pkgPath)) {
        let pkg = await fs.readJSON(pkgPath);
        if (!pkg.dependencies) pkg.dependencies = {};
        if (!pkg.dependencies["mongodb"]) {
          pkg.dependencies["mongodb"] = "^5.7.0";
          await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
        }
      }
    }
    // Si el usuario NO quiere JWT, elimina archivos y dependencias JWT
    if (!options.useJwt) {
      // Eliminar archivos JWT
      await fs.remove(path.join(fullTarget, "backend/auth.js"));
      // Quitar dependencias JWT de package.json
      const pkgPath = path.join(fullTarget, "backend/package.json");
      if (await fs.pathExists(pkgPath)) {
        let pkg = await fs.readJSON(pkgPath);
        if (pkg.dependencies && pkg.dependencies["jsonwebtoken"]) {
          delete pkg.dependencies["jsonwebtoken"];
          await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
        }
      }
      // Eliminar import y uso de auth en index.js
      const indexPath = path.join(fullTarget, "backend/index.js");
      if (await fs.pathExists(indexPath)) {
        let indexText = await fs.readFile(indexPath, "utf8");
        indexText = indexText.replace(
          /const auth = require\("\.\/auth"\);\n/,
          ""
        );
        indexText = indexText.replace(/app\.use\("\/auth", auth\);\n/, "");
        await fs.writeFile(indexPath, indexText, "utf8");
      }
    }
    // Si el usuario quiere JWT, añade endpoint protegido de ejemplo (ya está en la plantilla)

    // Si el usuario proporcionó dbUrl, escribir .env
    if (options.dbUrl) {
      try {
        const envPath = path.join(fullTarget, "backend/.env");
        await fs.writeFile(envPath, `DATABASE_URL=${options.dbUrl}\n`, "utf8");
        console.log(`ℹ️  Escribiendo DATABASE_URL en ${envPath}`);
      } catch (err) {
        console.warn("⚠️  No se pudo escribir .env en el backend:", err);
      }
      // Añadir driver a package.json si es necesario
      try {
        const pkgPath = path.join(fullTarget, "backend/package.json");
        let pkg: any = {};
        if (await fs.pathExists(pkgPath)) {
          pkg = await fs.readJSON(pkgPath);
        }
        // Aseguramos que dependencies existe y es objeto
        if (!pkg.dependencies || typeof pkg.dependencies !== "object") {
          pkg.dependencies = {};
        }
        const wants = options.dbType || "sqlite";
        if (wants === "postgres") {
          if (!pkg.dependencies["pg"]) pkg.dependencies["pg"] = "^8.11.3";
        } else if (wants === "mysql") {
          if (!pkg.dependencies["mysql2"])
            pkg.dependencies["mysql2"] = "^3.9.7";
        } else if (wants === "mongodb") {
          if (!pkg.dependencies["mongodb"])
            pkg.dependencies["mongodb"] = "^5.7.0";
        } else {
          if (!pkg.dependencies["sqlite3"])
            pkg.dependencies["sqlite3"] = "^5.1.6";
        }
        await fs.writeJSON(pkgPath, pkg, { spaces: 2 });
      } catch (err) {
        console.warn(
          "⚠️  No se pudo actualizar package.json con drivers de DB:",
          err
        );
      }
    }
  }

  // Instalar dependencias si se solicita
  if (options.runInstall) {
    console.log("ℹ️  Instalando dependencias del frontend (npm install) ...");
    await runCommand("npm", ["install"], frontendDir);
    try {
      console.log("ℹ️  Instalando dependencias del backend (npm install) ...");
      await runCommand("npm", ["install"], backendDir);
    } catch (err) {
      console.warn(
        "⚠️  No se pudo instalar dependencias de Node automáticamente:",
        err.message
      );
    }
  }

  console.log(`\n✅ Plantilla generada en: ${fullTarget}`);
  console.log(` - Backend: ${path.relative(process.cwd(), backendDir)}`);
  console.log(` - Frontend: ${path.relative(process.cwd(), frontendDir)}`);
}
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
  composeTool?: "docker" | "podman";
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
    // Copiar el archivo de compose adecuado
    if (options.composeTool === "podman") {
      const podmanComposePath = path.join(templatesRoot, "podman-compose.yml");
      if (await fs.pathExists(podmanComposePath)) {
        await fs.copy(
          podmanComposePath,
          path.join(fullTarget, "podman-compose.yml"),
          { overwrite: true }
        );
      }
    } else {
      // Por defecto docker
      const dockerComposePath = path.join(templatesRoot, "docker-compose.yml");
      if (await fs.pathExists(dockerComposePath)) {
        await fs.copy(
          dockerComposePath,
          path.join(fullTarget, "docker-compose.yml"),
          { overwrite: true }
        );
      }
    }
    console.log(
      `ℹ️  Plantillas encontradas en ${templatesRoot} — copiando al destino...`
    );
    // Copy the entire template tree into target
    await fs.copy(templatesRoot, fullTarget, {
      overwrite: true,
      recursive: true,
    });

    // --- DB TYPE LOGIC ---
    const dbType = options.dbType || "sqlite";
    if (dbType === "mongodb") {
      // Mongo: reemplazar db.py por db_mongo.py, items por items_mongo, y api/items por api/items_mongo
      await fs.remove(path.join(fullTarget, "backend/app/db.py"));
      await fs.copy(
        path.join(fullTarget, "backend/app/db_mongo.py"),
        path.join(fullTarget, "backend/app/db.py"),
        { overwrite: true }
      );
      await fs.remove(path.join(fullTarget, "backend/app/models/items.py"));
      await fs.copy(
        path.join(fullTarget, "backend/app/models/items_mongo.py"),
        path.join(fullTarget, "backend/app/models/items.py"),
        { overwrite: true }
      );
      await fs.remove(path.join(fullTarget, "backend/app/api/items.py"));
      await fs.copy(
        path.join(fullTarget, "backend/app/api/items_mongo.py"),
        path.join(fullTarget, "backend/app/api/items.py"),
        { overwrite: true }
      );
      // Ajustar main.py: importar db, items y quitar create_tables
      const mainPath = path.join(fullTarget, "backend/main.py");
      if (await fs.pathExists(mainPath)) {
        let mainText = await fs.readFile(mainPath, "utf8");
        // Quitar create_tables y referencias a SQL
        mainText = mainText.replace(/, create_tables/g, "");
        mainText = mainText.replace(/\n\s*await create_tables\(\)\;?/g, "");
        await fs.writeFile(mainPath, mainText, "utf8");
      }
      // Añadir motor a requirements.txt si no está
      const reqPath = path.join(fullTarget, "backend/requirements.txt");
      if (await fs.pathExists(reqPath)) {
        let reqText = await fs.readFile(reqPath, "utf8");
        if (!/motor/.test(reqText)) {
          reqText += "\nmotor\n";
          await fs.writeFile(reqPath, reqText, "utf8");
        }
      }
    }
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

      const mainJsx = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById('root')).render(<App />);
`;

      const appJsx = `import React from "react";

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Hello from React + Vite</h1>
      <p>This is a minimal frontend generated by devkit-cli.</p>
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

// Frontend-only generators
export async function generateFrontendReact(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  await fs.ensureDir(fullTarget);

  if (options.useViteInstaller) {
    console.log("ℹ️  Running Vite installer (npm create vite@latest)...");
    await runCommand(
      "npm",
      ["create", "vite@latest", ".", "--", "--template", "react"],
      fullTarget
    );
  } else {
    // Copy from templates if available
    const templatesRoot = path.resolve(__dirname, "..", "templates", "fastapi-react", "frontend");
    if (await fs.pathExists(templatesRoot)) {
      await fs.copy(templatesRoot, fullTarget, { overwrite: true });
    } else {
      // Minimal React setup
      const pkg = {
        name: `${name}`,
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

      await fs.writeJSON(path.join(fullTarget, "package.json"), pkg, { spaces: 2 });
      await fs.ensureDir(path.join(fullTarget, "src"));
      
      const indexHtml = `<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`;
      
      const mainJsx = `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\n\ncreateRoot(document.getElementById('root')).render(<App />);\n`;
      
      const appJsx = `import React from "react";\n\nexport default function App() {\n  return (\n    <div style={{ padding: 24 }}>\n      <h1>Hello from React + Vite</h1>\n      <p>Frontend generated by devkit-cli.</p>\n    </div>\n  );\n}\n`;

      await fs.writeFile(path.join(fullTarget, "index.html"), indexHtml, "utf8");
      await fs.writeFile(path.join(fullTarget, "src", "main.jsx"), mainJsx, "utf8");
      await fs.writeFile(path.join(fullTarget, "src", "App.jsx"), appJsx, "utf8");
    }
  }

  // Create compose file for development
  const composeFile = options.composeTool === "podman" ? "podman-compose.yml" : "docker-compose.yml";
  const composeContent = `version: '3.8'\nservices:\n  frontend:\n    build: .\n    ports:\n      - "5173:5173"\n    volumes:\n      - .:/src\n      - /src/node_modules\n    command: npm run dev -- --host\n`;
  
  await fs.writeFile(path.join(fullTarget, composeFile), composeContent, "utf8");
  
  // Create Dockerfile
  const dockerfile = `FROM node:18-alpine\nWORKDIR /src\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]\n`;
  await fs.writeFile(path.join(fullTarget, "Dockerfile"), dockerfile, "utf8");

  if (options.runInstall) {
    console.log("ℹ️  Installing dependencies (npm install)...");
    await runCommand("npm", ["install"], fullTarget);
  }

  console.log(`\n✅ React frontend generated at: ${fullTarget}`);
}

export async function generateFrontendVue(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  await fs.ensureDir(fullTarget);

  if (options.useViteInstaller) {
    console.log("ℹ️  Running Vite installer (npm create vue@latest)...");
    await runCommand(
      "npm",
      ["create", "vue@latest", ".", "--", "--template", "default"],
      fullTarget
    );
  } else {
    // Copy from templates if available
    const templatesRoot = path.resolve(__dirname, "..", "templates", "express-vue", "frontend");
    if (await fs.pathExists(templatesRoot)) {
      await fs.copy(templatesRoot, fullTarget, { overwrite: true });
    } else {
      // Minimal Vue setup
      const pkg = {
        name: `${name}`,
        private: true,
        version: "0.0.0",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          vue: "^3.0.0",
        },
        devDependencies: {
          vite: "^5.0.0",
          "@vitejs/plugin-vue": "^4.0.0",
        },
      };

      await fs.writeJSON(path.join(fullTarget, "package.json"), pkg, { spaces: 2 });
      await fs.ensureDir(path.join(fullTarget, "src"));
      
      const indexHtml = `<!doctype html>\n<html>\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>\n`;
      
      const mainJs = `import { createApp } from 'vue'\nimport App from './App.vue'\n\ncreateApp(App).mount('#app')\n`;
      
      const appVue = `<template>\n  <div style="padding: 24px">\n    <h1>Hello from Vue + Vite</h1>\n    <p>Frontend generated by devkit-cli.</p>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: 'App'\n}\n</script>\n`;
      
      const viteConfig = `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n\nexport default defineConfig({\n  plugins: [vue()]\n})\n`;

      await fs.writeFile(path.join(fullTarget, "index.html"), indexHtml, "utf8");
      await fs.writeFile(path.join(fullTarget, "src", "main.js"), mainJs, "utf8");
      await fs.writeFile(path.join(fullTarget, "src", "App.vue"), appVue, "utf8");
      await fs.writeFile(path.join(fullTarget, "vite.config.js"), viteConfig, "utf8");
    }
  }

  // Create compose file for development
  const composeFile = options.composeTool === "podman" ? "podman-compose.yml" : "docker-compose.yml";
  const composeContent = `version: '3.8'\nservices:\n  frontend:\n    build: .\n    ports:\n      - "5173:5173"\n    volumes:\n      - .:/src\n      - /src/node_modules\n    command: npm run dev -- --host\n`;
  
  await fs.writeFile(path.join(fullTarget, composeFile), composeContent, "utf8");
  
  // Create Dockerfile
  const dockerfile = `FROM node:18-alpine\nWORKDIR /src\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 5173\nCMD ["npm", "run", "dev", "--", "--host"]\n`;
  await fs.writeFile(path.join(fullTarget, "Dockerfile"), dockerfile, "utf8");

  if (options.runInstall) {
    console.log("ℹ️  Installing dependencies (npm install)...");
    await runCommand("npm", ["install"], fullTarget);
  }

  console.log(`\n✅ Vue frontend generated at: ${fullTarget}`);
}

// Backend-only generators
export async function generateBackendFastAPI(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  await fs.ensureDir(fullTarget);

  // Copy from templates if available
  const templatesRoot = path.resolve(__dirname, "..", "templates", "fastapi-react", "backend");
  if (await fs.pathExists(templatesRoot)) {
    await fs.copy(templatesRoot, fullTarget, { overwrite: true });
    
    // Apply database and JWT configurations
    const dbType = options.dbType || "sqlite";
    if (dbType === "mongodb") {
      await fs.remove(path.join(fullTarget, "app/db.py"));
      await fs.copy(
        path.join(fullTarget, "app/db_mongo.py"),
        path.join(fullTarget, "app/db.py"),
        { overwrite: true }
      );
      // Apply other mongo configurations...
    }
    
    if (!options.useJwt) {
      await fs.remove(path.join(fullTarget, "app/api/auth.py"));
      await fs.remove(path.join(fullTarget, "app/core/jwt_utils.py"));
    }
  } else {
    // Minimal FastAPI setup
    const mainPy = `from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI(title="${name}")\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n@app.get("/")\ndef read_root():\n    return {"message": "Hello from FastAPI"}\n\n@app.get("/health")\ndef health_check():\n    return {"status": "healthy"}\n`;

    const requirements = `fastapi[standard]\nuvicorn\n`;
    
    await fs.writeFile(path.join(fullTarget, "main.py"), mainPy, "utf8");
    await fs.writeFile(path.join(fullTarget, "requirements.txt"), requirements, "utf8");
  }

  // Create compose file
  const composeFile = options.composeTool === "podman" ? "podman-compose.yml" : "docker-compose.yml";
  let composeContent = `version: '3.8'\nservices:\n  backend:\n    build: .\n    ports:\n      - "8000:8000"\n    volumes:\n      - .:/src\n    environment:\n      - DATABASE_URL=\${DATABASE_URL:-sqlite+aiosqlite:///./data.db}\n`;
  
  // Add database service if needed
  const dbType = options.dbType || "sqlite";
  if (dbType === "postgres") {
    composeContent += `  postgres:\n    image: postgres:15\n    environment:\n      POSTGRES_DB: mydb\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: password\n    ports:\n      - "5432:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n\nvolumes:\n  postgres_data:\n`;
  } else if (dbType === "mysql") {
    composeContent += `  mysql:\n    image: mysql:8\n    environment:\n      MYSQL_DATABASE: mydb\n      MYSQL_USER: user\n      MYSQL_PASSWORD: password\n      MYSQL_ROOT_PASSWORD: rootpassword\n    ports:\n      - "3306:3306"\n    volumes:\n      - mysql_data:/var/lib/mysql\n\nvolumes:\n  mysql_data:\n`;
  } else if (dbType === "mongodb") {
    composeContent += `  mongodb:\n    image: mongo:7\n    environment:\n      MONGO_INITDB_ROOT_USERNAME: user\n      MONGO_INITDB_ROOT_PASSWORD: password\n      MONGO_INITDB_DATABASE: mydb\n    ports:\n      - "27017:27017"\n    volumes:\n      - mongodb_data:/data/db\n\nvolumes:\n  mongodb_data:\n`;
  }
  
  await fs.writeFile(path.join(fullTarget, composeFile), composeContent, "utf8");
  
  // Create Dockerfile
  const dockerfile = `FROM python:3.11-slim\nWORKDIR /src\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]\n`;
  await fs.writeFile(path.join(fullTarget, "Dockerfile"), dockerfile, "utf8");

  // Write .env if database URL provided
  if (options.dbUrl) {
    await fs.writeFile(path.join(fullTarget, ".env"), `DATABASE_URL=${options.dbUrl}\n`, "utf8");
  }

  console.log(`\n✅ FastAPI backend generated at: ${fullTarget}`);
}

export async function generateBackendExpress(
  targetDir: string,
  options: GeneratorOptions = {}
) {
  const name = options.projectName ?? path.basename(path.resolve(targetDir));
  const fullTarget = path.resolve(targetDir);

  await fs.ensureDir(fullTarget);

  // Copy from templates if available
  const templatesRoot = path.resolve(__dirname, "..", "templates", "express-vue", "backend");
  if (await fs.pathExists(templatesRoot)) {
    await fs.copy(templatesRoot, fullTarget, { overwrite: true });
    
    // Apply configurations similar to generateExpressVue
    const dbType = options.dbType || "sqlite";
    if (dbType === "mongodb") {
      await fs.remove(path.join(fullTarget, "db.js"));
      await fs.copy(
        path.join(fullTarget, "db_mongo.js"),
        path.join(fullTarget, "db.js"),
        { overwrite: true }
      );
    }
    
    if (!options.useJwt) {
      await fs.remove(path.join(fullTarget, "auth.js"));
    }
  } else {
    // Minimal Express setup
    const pkg = {
      name: `${name}`,
      version: "1.0.0",
      main: "index.js",
      scripts: {
        start: "node index.js",
        dev: "nodemon index.js",
      },
      dependencies: {
        express: "^4.18.0",
        cors: "^2.8.5",
      },
      devDependencies: {
        nodemon: "^3.0.0",
      },
    };

    const indexJs = `const express = require('express');\nconst cors = require('cors');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from Express' });\n});\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'healthy' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});\n`;

    await fs.writeJSON(path.join(fullTarget, "package.json"), pkg, { spaces: 2 });
    await fs.writeFile(path.join(fullTarget, "index.js"), indexJs, "utf8");
  }

  // Create compose file
  const composeFile = options.composeTool === "podman" ? "podman-compose.yml" : "docker-compose.yml";
  let composeContent = `version: '3.8'\nservices:\n  backend:\n    build: .\n    ports:\n      - "3000:3000"\n    volumes:\n      - .:/src\n      - /src/node_modules\n    environment:\n      - DATABASE_URL=\${DATABASE_URL:-sqlite://./data.db}\n`;
  
  // Add database service if needed (similar to FastAPI)
  const dbType = options.dbType || "sqlite";
  if (dbType === "postgres") {
    composeContent += `  postgres:\n    image: postgres:15\n    environment:\n      POSTGRES_DB: mydb\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: password\n    ports:\n      - "5432:5432"\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n\nvolumes:\n  postgres_data:\n`;
  } else if (dbType === "mysql") {
    composeContent += `  mysql:\n    image: mysql:8\n    environment:\n      MYSQL_DATABASE: mydb\n      MYSQL_USER: user\n      MYSQL_PASSWORD: password\n      MYSQL_ROOT_PASSWORD: rootpassword\n    ports:\n      - "3306:3306"\n    volumes:\n      - mysql_data:/var/lib/mysql\n\nvolumes:\n  mysql_data:\n`;
  } else if (dbType === "mongodb") {
    composeContent += `  mongodb:\n    image: mongo:7\n    environment:\n      MONGO_INITDB_ROOT_USERNAME: user\n      MONGO_INITDB_ROOT_PASSWORD: password\n      MONGO_INITDB_DATABASE: mydb\n    ports:\n      - "27017:27017"\n    volumes:\n      - mongodb_data:/data/db\n\nvolumes:\n  mongodb_data:\n`;
  }
  
  await fs.writeFile(path.join(fullTarget, composeFile), composeContent, "utf8");
  
  // Create Dockerfile
  const dockerfile = `FROM node:18-alpine\nWORKDIR /src\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "run", "dev"]\n`;
  await fs.writeFile(path.join(fullTarget, "Dockerfile"), dockerfile, "utf8");

  // Write .env if database URL provided
  if (options.dbUrl) {
    await fs.writeFile(path.join(fullTarget, ".env"), `DATABASE_URL=${options.dbUrl}\n`, "utf8");
  }

  if (options.runInstall) {
    console.log("ℹ️  Installing dependencies (npm install)...");
    await runCommand("npm", ["install"], fullTarget);
  }

  console.log(`\n✅ Express backend generated at: ${fullTarget}`);
}

export default generateFastapiReact;