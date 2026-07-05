import AdmZip from "adm-zip"
import { mkdir } from "fs/promises"
import path from "path"
import { MedusaError } from "@medusajs/framework/utils"
import type { ResolvedDigitalFile } from "./digital-files"

export function getDigitalDeliveryStorageDir(): string {
  return (
    process.env.DIGITAL_DELIVERY_STORAGE_PATH ||
    path.join(process.cwd(), "uploads", "digital-deliveries")
  )
}

export function getDigitalDownloadExpiryDays(): number {
  const parsed = Number(process.env.DIGITAL_DOWNLOAD_EXPIRY_DAYS ?? "7")
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7
}

export function buildDigitalDownloadUrl(token: string): string {
  const backendUrl = (
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  ).replace(/\/$/, "")

  return `${backendUrl}/store/digital-download/${token}`
}

export async function createZipFromUrls(
  files: ResolvedDigitalFile[],
  destinationPath: string
): Promise<void> {
  await mkdir(path.dirname(destinationPath), { recursive: true })

  const zip = new AdmZip()

  for (const file of files) {
    const response = await fetch(file.url)

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to download ${file.url} (${response.status} ${response.statusText})`
      )
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    zip.addFile(file.archiveName, buffer)
  }

  zip.writeZip(destinationPath)
}
