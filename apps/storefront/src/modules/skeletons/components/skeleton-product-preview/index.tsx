import { Container } from "@modules/common/components/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse">
      <Container className="aspect-[3/2] w-full bg-paper-dark p-0" />
    </div>
  )
}

export default SkeletonProductPreview
