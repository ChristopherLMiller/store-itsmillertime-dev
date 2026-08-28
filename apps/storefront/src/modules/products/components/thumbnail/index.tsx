import PhotoFrame from "@modules/common/components/photo-frame"
import { clx } from "@modules/common/components/ui"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail = ({
  thumbnail,
  images,
  size = "full",
  className,
  "data-testid": dataTestid,
}: ThumbnailProps) => {
  const image = thumbnail || images?.[0]?.url

  return (
    <PhotoFrame
      src={image}
      alt=""
      aspect={size === "square" ? "square" : "sheet"}
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
