import { readFileSync } from 'fs'
import { resolve } from 'path'

interface PackageJson {
  version?: string
}

function readPackageVersion(): string {
  try {
    const packagePath = resolve(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson
    return packageJson.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

export const VERSION = readPackageVersion()
