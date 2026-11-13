import { notFound } from "next/navigation"

// Next 16 requires an explicit default for every parallel route slot. Keep the
// Next 15 behavior for unmatched slots on hard navigation: render a 404.
export default function Default() {
  notFound()
}
