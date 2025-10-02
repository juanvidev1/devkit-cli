// Importamos las librerías necesarias
// Commander.js: Para crear CLIs con comandos, opciones y argumentos
// Inquirer.js: Para hacer preguntas interactivas al usuario
import { Command } from "commander";
import inquirer from "inquirer";
import path from "path";
import generateFastapiReact from "./generator";

// Creamos una nueva instancia de Command
// Esta será la base de nuestro CLI
const program = new Command();

// Configuramos la información básica del CLI
program
  .name("stackforge") // Nombre que aparece en la ayuda
  .description("CLI para generar proyectos") // Descripción general
  .version("0.1.0"); // Versión (se muestra con --version)

// Definimos el comando "create" que será interactivo
program
  .command("create") // Nombre del comando
  .description("Crea un nuevo proyecto fullstack de forma interactiva") // Descripción del comando
  .option("-s, --skip-questions", "Saltar preguntas y usar valores por defecto") // Opción para modo rápido
  .option(
    "--with-podman",
    "Iniciar el proyecto usando podman-compose después de generarlo"
  )
  .action(async (options) => {
    // Variables para almacenar las respuestas del usuario
    let projectName: string;
    let templateType: string;
    let useViteInstaller = false;
    let runInstall = false;
    let dbUrl: string | undefined;
    let dbType: string | undefined;
    let useJwt = false;

    if (options.skipQuestions) {
      projectName = "mi-proyecto";
      templateType = "fastapi-react";
      dbType = "sqlite";
      dbUrl = "sqlite+aiosqlite:///./data.db";
      useJwt = false; // o true si quieres JWT por defecto en modo rápido
      console.log("⚡ Usando configuración por defecto...");
    } else {
      console.log("🤖 Configuremos tu proyecto:\n");

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "¿Cuál es el nombre de tu proyecto?",
          default: "mi-proyecto-genial",
        },
        {
          type: "list",
          name: "templateType",
          message: "¿Qué template quieres usar?",
          choices: [
            { name: "FastAPI + React", value: "fastapi-react" },
            { name: "Node.js + Vue", value: "nodejs-vue" },
          ],
        },
        {
          type: "list",
          name: "dbType",
          message: "¿Qué base de datos quieres usar?",
          choices: [
            { name: "SQLite (local, por defecto)", value: "sqlite" },
            { name: "Postgres", value: "postgres" },
            { name: "MySQL", value: "mysql" },
          ],
          default: "sqlite",
        },
        {
          type: "confirm",
          name: "useViteInstaller",
          message:
            "¿Usar el instalador oficial de Vite para el frontend? (recomendado)",
          default: false,
        },
        {
          type: "confirm",
          name: "useJwt",
          message: "¿Incluir autenticación JWT básica en el backend?",
          default: false,
        },
        {
          type: "confirm",
          name: "runInstall",
          message: "¿Instalar dependencias ahora (npm install / pip install)?",
          default: false,
        },
      ]);

      projectName = answers.projectName;
      templateType = answers.templateType;
      useViteInstaller = answers.useViteInstaller;
      useJwt = answers.useJwt;
      runInstall = answers.runInstall;
      // build database URL based on dbType
      dbType = answers.dbType || "sqlite";
      if (dbType === "sqlite") {
        dbUrl = "sqlite+aiosqlite:///./data.db";
      } else {
        // ask credentials for remote DBs
        const dbCreds = await inquirer.prompt([
          {
            type: "input",
            name: "host",
            message: "DB host:",
            default: "localhost",
          },
          {
            type: "input",
            name: "port",
            message: "DB port:",
            default: dbType === "postgres" ? "5432" : "3306",
          },
          { type: "input", name: "user", message: "DB user:", default: "user" },
          {
            type: "password",
            name: "password",
            message: "DB password:",
            mask: "*",
          },
          {
            type: "input",
            name: "database",
            message: "DB name:",
            default: "mydb",
          },
        ]);

        if (dbType === "postgres") {
          dbUrl = `postgresql+asyncpg://${dbCreds.user}:${encodeURIComponent(dbCreds.password)}@${dbCreds.host}:${dbCreds.port}/${dbCreds.database}`;
        } else {
          dbUrl = `mysql+aiomysql://${dbCreds.user}:${encodeURIComponent(dbCreds.password)}@${dbCreds.host}:${dbCreds.port}/${dbCreds.database}`;
        }
      }
      // dbUrl and dbType are set; continue
    }

    // Build target directory path
    const targetPath = path.join(process.cwd(), projectName);

    console.log(`\n🚀 Generando proyecto '${projectName}' en ${targetPath}...`);

    if (templateType === "fastapi-react") {
      try {
        await generateFastapiReact(targetPath, {
          projectName,
          useViteInstaller,
          runInstall,
          dbUrl,
          dbType,
          useJwt,
        });
        // If user requested podman up, try to run podman-compose with sensible env vars
        if (options.withPodman) {
          // Lazy import child_process
          const { spawn } = await import("child_process");

          console.log(
            "🔧 Iniciando podman-compose para levantar el proyecto (se necesita podman & podman-compose)..."
          );

          // Build env vars for podman-compose
          const env = {
            ...process.env,
            PROJECT_NAME: projectName,
            PROJECT_PATH: targetPath,
          } as NodeJS.ProcessEnv;

          if (dbType && dbType !== "sqlite") {
            // map common defaults if user selected a remote DB
            if (dbType === "postgres") {
              env.POSTGRES_USER = env.POSTGRES_USER ?? "user";
              env.POSTGRES_PASSWORD = env.POSTGRES_PASSWORD ?? "password";
              env.POSTGRES_DB = env.POSTGRES_DB ?? "mydb";
            } else if (dbType === "mysql") {
              env.MYSQL_USER = env.MYSQL_USER ?? "user";
              env.MYSQL_PASSWORD = env.MYSQL_PASSWORD ?? "password";
              env.MYSQL_DATABASE = env.MYSQL_DATABASE ?? "mydb";
              env.MYSQL_ROOT_PASSWORD = env.MYSQL_ROOT_PASSWORD ?? "rootpass";
            }
          }

          // Decide profile to use
          const profile =
            dbType === "postgres"
              ? "postgres"
              : dbType === "mysql"
                ? "mysql"
                : undefined;

          const args = [] as string[];
          if (profile) {
            args.push("--profile", profile);
          }
          args.push("up", "--build");

          const child = spawn("podman-compose", args, {
            cwd: targetPath,
            env,
            stdio: "inherit",
            shell: false,
          });

          child.on("close", (code) => {
            if (code !== 0)
              console.warn(`podman-compose exited with code ${code}`);
          });
        }
      } catch (err: any) {
        console.error("❌ Error al generar la plantilla:", err.message || err);
        process.exit(1);
      }
    } else {
      console.log(`Plantilla '${templateType}' no está implementada aún.`);
    }
  });

// Procesamos los argumentos de la línea de comandos
// Commander analiza process.argv y ejecuta el comando correspondiente
program.parse(process.argv);

// Exportamos el programa para poder usarlo en otros archivos si es necesario
export default program;
