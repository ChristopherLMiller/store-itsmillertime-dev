import PhotoFrame from "@modules/common/components/photo-frame"
import { clx } from "@modules/common/components/ui"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  listing?: "print" | "shop"
  alt?: string
  className?: string
  "data-testid"?: string
}

const Thumbnail = ({
  thumbnail,
  images,
  size = "full",
  listing = "print",
  alt = "",
  className,
  "data-testid": dataTestid,
}: ThumbnailProps) => {
  const image = thumbnail || images?.[0]?.url
  const shop = listing === "shop"

  return (
    <PhotoFrame
      src={image}
      alt={alt}
      aspect={size === "square" ? "square" : shop ? "portrait" : "sheet"}
      fit="cover"
      className={clx(className, {
        "w-[180px]": size === "small",
        "w-[290px]": size === "medium",
        "w-[440px]": size === "large",
      })}
      data-testid={dataTestid}
    />
  )
}

export default Thumbnail
