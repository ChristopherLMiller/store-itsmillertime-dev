"use client"

import { HttpTypes } from "@medusajs/types"
import PhotoFrame from "@modules/common/components/photo-frame"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  alt?: string
  layout?: "print" | "shop"
}

const ImageGallery = ({
  images,
  alt,
  layout = "print",
}: ImageGalleryProps) => {
  const photos = images.filter((image) => image?.id && image.url)
  const [active, setActive] = useState(0)

  if (!photos.length) {
    return (
      <PhotoFrame
        src={null}
        aspect={layout === "shop" ? "portrait" : "sheet"}
        fit="cover"
        alt={alt}
      />
    )
  }

  if (layout === "shop") {
    const current = photos[Math.min(active, photos.length - 1)]

    return (
      <div className="flex flex-col gap-3">
        <PhotoFrame
          src={current.url}
          alt={alt}
          aspect="portrait"
          fit="cover"
          priority
          className="group"
        />
        {photos.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {photos.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className={clx(
                  "overflow-hidden group transition-opacity duration-300",
                  index === active ? "opacity-100" : "opacity-60 hover:opacity-100"
                )}
              >
                <PhotoFrame
                  src={image.url}
                  alt={alt ? `${alt} ${index + 1}` : ""}
                  aspect="square"
                  fit="cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {photos.map((image, index) => (
        <PhotoFrame
          key={image.id}
          src={image.url}
          alt={alt ? `${alt}${photos.length > 1 ? ` ${index + 1}` : ""}` : ""}
          aspect="sheet"
          fit="cover"
          priority={index === 0}
          className="group"
        />
      ))}
    </div>
  )
}

export default ImageGallery
