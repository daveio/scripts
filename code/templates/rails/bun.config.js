import fs from "node:fs"
import path from "node:path"

const config = {
  sourcemap: "external",
  entrypoints: ["app/javascript/application.js"],
  outdir: path.join(process.cwd(), "app/assets/builds")
}

const build = async (config) => {
  const result = await Bun.build(config)

  if (!result.success) {
    if (process.argv.includes("--watch")) {
      console.error("Build failed")
      for (const message of result.logs) {
        console.error(message)
      }
      return
    }
    throw new AggregateError(result.logs, "Build failed")
  }
}
;(async () => {
  await build(config)

  if (process.argv.includes("--watch")) {
    fs.watch(path.join(process.cwd(), "app/javascript"), { recursive: true }, (eventType, filename) => {
      console.log(`File changed: ${filename}. Rebuilding...`)
      build(config)
    })
  } else {
    process.exit(0)
  }
})()
