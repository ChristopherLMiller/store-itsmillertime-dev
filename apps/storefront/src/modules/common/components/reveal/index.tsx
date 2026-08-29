import { clx } from "@modules/common/components/ui"
import { ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
  return (
    <div
      className={clx("shop-fade-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default Reveal
