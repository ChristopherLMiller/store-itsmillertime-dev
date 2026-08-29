import { clx } from "@modules/common/components/ui"
import Image from "next/image"

type PhotoFrameProps = {
  src?: string | null
  alt?: string
  aspect?: "stage" | "sheet" | "square" | "portrait"
  fit?: "contain" | "cover"
  mat?: boolean
  priority?: boolean
  className?: string
  "data-testid"?: string
}

const PhotoFrame = ({
  src,
  alt = "",
  aspect = "sheet",
  fit = "cover",
  priority = false,
  className,
  "data-testid": dataTestid,
}: PhotoFrameProps) => {
  return (
    <div
      className={clx(
        "relative w-full overflow-hidden bg-paper",
        aspect === "stage" && "min-h-[52vh] h-[min(78vh,860px)]",
        aspect === "sheet" && "aspect-[3/2]",
        aspect === "square" && "aspect-square",
        aspect === "portrait" && "aspect-[4/5]",
        className
      )}
      data-testid={dataTestid}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 900px"
          className={clx(
            "object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]",
            fit === "cover" ? "object-cover" : "object-contain"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
          No image
        </div>
      )}
    </div>
  )
}

export default PhotoFrame
