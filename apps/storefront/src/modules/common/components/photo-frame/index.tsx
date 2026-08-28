import { clx } from "@modules/common/components/ui"
import Image from "next/image"

type PhotoFrameProps = {
  src?: string | null
  alt?: string
  aspect?: "stage" | "sheet" | "square"
  priority?: boolean
  className?: string
  "data-testid"?: string
}

const PhotoFrame = ({
  src,
  alt = "",
  aspect = "sheet",
  priority = false,
  className,
  "data-testid": dataTestid,
}: PhotoFrameProps) => {
  return (
    <div
      className={clx(
        "relative w-full overflow-hidden bg-stone-200/50",
        aspect === "stage" && "min-h-[52vh] h-[min(78vh,860px)]",
        aspect === "sheet" && "aspect-[3/2]",
        aspect === "square" && "aspect-square",
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
          className="object-contain object-center"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
          No image
        </div>
      )}
    </div>
  )
}

export default PhotoFrame
