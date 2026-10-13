import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"

// Projeto Compose da suíte full-stack: o mesmo compose.prod.yaml da raiz, com
// nome de projeto e portas próprios, para nunca tocar a stack de produção local
// (testes-producao/TD-02, Revision de isolamento).
export const PROJECT = "streamtube-fullstack"

const ENV_FILE = path.join(__dirname, "fullstack.env")
const COMPOSE_FILE = path.join(__dirname, "..", "..", "compose.prod.yaml")

function readEnvFile(): Record<string, string> {
  const entries = readFileSync(ENV_FILE, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=")
      return [line.slice(0, separator), line.slice(separator + 1)] as const
    })
  return Object.fromEntries(entries)
}

const env = readEnvFile()

export const APP_URL = `http://localhost:${env.APP_PORT}`
export const MAILPIT_URL = `http://localhost:${env.MAILPIT_PORT}`
export const STORAGE_HOST = `localhost:${env.STORAGE_PORT}`

export function compose(...args: string[]): void {
  execFileSync(
    "docker",
    ["compose", "-p", PROJECT, "-f", COMPOSE_FILE, "--env-file", ENV_FILE, ...args],
    { stdio: "inherit" }
  )
}
