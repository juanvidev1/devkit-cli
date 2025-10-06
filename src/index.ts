#! /usr/bin/env node

// Import necessary libraries
/// <reference types="node" />
// Commander.js: For creating CLIs with commands, options and arguments
// Inquirer.js: For interactive user prompts
import { Command } from "commander";
import inquirer from "inquirer";
import path from "path";
import generateFastapiReact, { 
  generateExpressVue,
  generateFrontendReact,
  generateFrontendVue,
  generateBackendFastAPI,
  generateBackendExpress
} from "./generator";
// Ensure Node types for process and __dirname
// @ts-ignore
declare const __dirname: string;

// Create a new Command instance
// This will be the base of our CLI
const program = new Command();

// Configure basic CLI information
program
  .name("devkit") // Name that appears in help
  .description("CLI for generating projects") // General description
  .version("0.1.0"); // Version (shown with --version)

// Define the interactive "create" command
program
  .command("create") // Command name
  .description("Create a new project (fullstack, frontend or backend)")
  .option("-s, --skip-questions", "Skip questions and use default values")
  .option("--with-podman", "Start project using podman-compose after generation")
  .option("-f, --frontend-only", "Generate frontend only")
  .option("-b, --backend-only", "Generate backend only")
  .action(async (options) => {
    // Variables to store user responses
    let projectName: string;
    let templateType: string;
    let useViteInstaller = false;
    let runInstall = false;
    let dbUrl: string | undefined;
    let dbType: string | undefined;
    let useJwt = false;
    let composeTool: "docker" | "podman" = "docker";

    async function getDatabaseConfig(dbType: string): Promise<string> {
      if (dbType === "mongodb") {
        const { mongoInputType } = await inquirer.prompt([{
          type: "list",
          name: "mongoInputType",
          message: "How do you want to configure MongoDB?",
          choices: [
            { name: "Complete URI", value: "uri" },
            { name: "Separate details", value: "separado" },
          ],
        }]);
        
        if (mongoInputType === "uri") {
          const { mongoUri } = await inquirer.prompt([{
            type: "input",
            name: "mongoUri",
            message: "MongoDB URI:",
            default: "mongodb://user:password@localhost:27017/mydb",
          }]);
          return mongoUri;
        } else {
          const mongoCreds = await inquirer.prompt([
            { type: "input", name: "host", message: "Host:", default: "localhost" },
            { type: "input", name: "port", message: "Port:", default: "27017" },
            { type: "input", name: "user", message: "User:", default: "user" },
            { type: "password", name: "password", message: "Password:", mask: "*" },
            { type: "input", name: "database", message: "Database:", default: "mydb" },
          ]);
          return `mongodb://${mongoCreds.user}:${encodeURIComponent(mongoCreds.password)}@${mongoCreds.host}:${mongoCreds.port}/${mongoCreds.database}`;
        }
      } else {
        const dbCreds = await inquirer.prompt([
          { type: "input", name: "host", message: "Host:", default: "localhost" },
          { type: "input", name: "port", message: "Port:", default: dbType === "postgres" ? "5432" : "3306" },
          { type: "input", name: "user", message: "User:", default: "user" },
          { type: "password", name: "password", message: "Password:", mask: "*" },
          { type: "input", name: "database", message: "Database:", default: "mydb" },
        ]);
        
        if (dbType === "postgres") {
          return `postgresql+asyncpg://${dbCreds.user}:${encodeURIComponent(dbCreds.password)}@${dbCreds.host}:${dbCreds.port}/${dbCreds.database}`;
        } else {
          return `mysql+aiomysql://${dbCreds.user}:${encodeURIComponent(dbCreds.password)}@${dbCreds.host}:${dbCreds.port}/${dbCreds.database}`;
        }
      }
    }

    if (options.skipQuestions) {
      if (options.frontendOnly) {
        projectName = "my-frontend";
        templateType = "frontend-react";
        useViteInstaller = false;
        runInstall = false;
        composeTool = "docker";
      } else if (options.backendOnly) {
        projectName = "my-backend";
        templateType = "backend-fastapi";
        dbType = "sqlite";
        dbUrl = "sqlite+aiosqlite:///./data.db";
        useJwt = false;
        composeTool = "docker";
      } else {
        projectName = "my-project";
        templateType = "fastapi-react";
        dbType = "sqlite";
        dbUrl = "sqlite+aiosqlite:///./data.db";
        useJwt = false;
        composeTool = "docker";
      }
      console.log("⚡ Using default configuration...");
    } else if (options.frontendOnly) {
      console.log("🎨 Let's configure your frontend:\n");
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Project name?",
          default: "my-frontend",
        },
        {
          type: "list",
          name: "frontendType",
          message: "Which framework do you want?",
          choices: [
            { name: "React", value: "react" },
            { name: "Vue", value: "vue" },
          ],
        },
        {
          type: "confirm",
          name: "useViteInstaller",
          message: "Use official Vite installer?",
          default: true,
        },
        {
          type: "confirm",
          name: "runInstall",
          message: "Install dependencies?",
          default: true,
        },
      ]);
      
      projectName = answers.projectName;
      templateType = `frontend-${answers.frontendType}`;
      useViteInstaller = answers.useViteInstaller;
      runInstall = answers.runInstall;
    } else if (options.backendOnly) {
      console.log("⚙️ Let's configure your backend:\n");
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Project name?",
          default: "my-backend",
        },
        {
          type: "list",
          name: "backendType",
          message: "Which framework do you want?",
          choices: [
            { name: "FastAPI (Python)", value: "fastapi" },
            { name: "Express (Node.js)", value: "express" },
          ],
        },
        {
          type: "list",
          name: "dbType",
          message: "Which database?",
          choices: [
            { name: "SQLite", value: "sqlite" },
            { name: "PostgreSQL", value: "postgres" },
            { name: "MySQL", value: "mysql" },
            { name: "MongoDB", value: "mongodb" },
          ],
        },
        {
          type: "confirm",
          name: "useJwt",
          message: "Include JWT authentication?",
          default: true,
        },
        {
          type: "list",
          name: "composeTool",
          message: "Container tool?",
          choices: [
            { name: "Docker", value: "docker" },
            { name: "Podman", value: "podman" },
          ],
        },
      ]);
      
      projectName = answers.projectName;
      templateType = `backend-${answers.backendType}`;
      dbType = answers.dbType;
      useJwt = answers.useJwt;
      composeTool = answers.composeTool;
      
      if (dbType === "sqlite") {
        dbUrl = "sqlite+aiosqlite:///./data.db";
      } else {
        dbUrl = await getDatabaseConfig(dbType);
      }
    } else {
      console.log("🚀 Let's configure your fullstack project:\n");
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Project name?",
          default: "my-project",
        },
        {
          type: "list",
          name: "templateType",
          message: "Which stack do you want?",
          choices: [
            { name: "FastAPI + React", value: "fastapi-react" },
            { name: "Express + Vue", value: "nodejs-vue" },
          ],
        },
        {
          type: "list",
          name: "dbType",
          message: "Which database?",
          choices: [
            { name: "SQLite", value: "sqlite" },
            { name: "PostgreSQL", value: "postgres" },
            { name: "MySQL", value: "mysql" },
            { name: "MongoDB", value: "mongodb" },
          ],
        },
        {
          type: "confirm",
          name: "useJwt",
          message: "Include JWT authentication?",
          default: true,
        },
        {
          type: "confirm",
          name: "useViteInstaller",
          message: "Use official Vite installer?",
          default: true,
        },
        {
          type: "confirm",
          name: "runInstall",
          message: "Install dependencies?",
          default: true,
        },
        {
          type: "list",
          name: "composeTool",
          message: "Container tool?",
          choices: [
            { name: "Docker", value: "docker" },
            { name: "Podman", value: "podman" },
          ],
        },
      ]);
      
      projectName = answers.projectName;
      templateType = answers.templateType;
      dbType = answers.dbType;
      useJwt = answers.useJwt;
      useViteInstaller = answers.useViteInstaller;
      runInstall = answers.runInstall;
      composeTool = answers.composeTool;
      
      if (dbType === "sqlite") {
        dbUrl = "sqlite+aiosqlite:///./data.db";
      } else {
        dbUrl = await getDatabaseConfig(dbType);
      }
    }

    // Build target directory path
    const targetPath = path.join(process.cwd(), projectName);

    console.log(`\n🚀 Generating project '${projectName}' at ${targetPath}...`);

    try {
      if (templateType === "fastapi-react" || templateType === "nodejs-vue") {
        const generator = templateType === "fastapi-react" ? generateFastapiReact : generateExpressVue;
        await generator(targetPath, {
          projectName,
          useViteInstaller,
          runInstall,
          dbUrl,
          dbType,
          useJwt,
          composeTool,
        });
      } else if (templateType.startsWith("frontend-")) {
        const frontendType = templateType.replace("frontend-", "");
        console.log(`🎨 Generating ${frontendType} frontend...`);
        
        if (frontendType === "react") {
          await generateFrontendReact(targetPath, {
            projectName,
            useViteInstaller,
            runInstall,
            composeTool,
          });
        } else if (frontendType === "vue") {
          await generateFrontendVue(targetPath, {
            projectName,
            useViteInstaller,
            runInstall,
            composeTool,
          });
        }
      } else if (templateType.startsWith("backend-")) {
        const backendType = templateType.replace("backend-", "");
        console.log(`⚙️ Generating ${backendType} backend...`);
        
        if (backendType === "fastapi") {
          await generateBackendFastAPI(targetPath, {
            projectName,
            dbUrl,
            dbType,
            useJwt,
            composeTool,
          });
        } else if (backendType === "express") {
          await generateBackendExpress(targetPath, {
            projectName,
            runInstall,
            dbUrl,
            dbType,
            useJwt,
            composeTool,
          });
        }
      } else {
        console.log(`Template '${templateType}' not implemented.`);
      }
    } catch (err: any) {
      console.error("❌ Error:", err.message || err);
      process.exit(1);
    }
  });

// Process command line arguments
// Commander parses process.argv and executes the corresponding command
program.parse(process.argv);

// Export the program to use it in other files if needed
export default program;