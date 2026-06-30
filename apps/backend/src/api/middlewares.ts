import { defineMiddlewares } from "@medusajs/framework/http"

// Multipart uploads bypass JSON body parsers; this raises limits for any
// non-multipart upload routes and documents intent alongside admin.maxUploadFileSize.
const UPLOAD_SIZE_LIMIT = "100mb"

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/admin/uploads",
      bodyParser: {
        sizeLimit: UPLOAD_SIZE_LIMIT,
      },
    },
    {
      method: ["POST"],
      matcher: "/admin/uploads/presigned-urls",
      bodyParser: {
        sizeLimit: UPLOAD_SIZE_LIMIT,
      },
    },
  ],
})
