import { HttpTypes } from "@medusajs/types"
import PhotoFrame from "@modules/common/components/photo-frame"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  alt?: string
}

const ImageGallery = ({ images, alt }: ImageGalleryProps) => {
  const photos = images.filter((image) => image?.id && image.url)

  if (!photos.length) {
    return (
      <PhotoFrame src={null} aspect="stage" alt={alt} />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {photos.map((image, index) => (
        <PhotoFrame
          key={image.id}
          src={image.url}
          alt={alt ? `${alt}${photos.length > 1 ? ` ${index + 1}` : ""}` : ""}
          aspect="stage"
          priority={index === 0}
        />
      ))}
    </div>
  )
}

export default ImageGallery
