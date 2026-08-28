import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import type {
  IProductModuleService,
  ProductCategoryDTO,
} from "@medusajs/framework/types"
import { ensureProductCategory } from "../../utils/ensure-product-category"
import {
  albumCategoryHandle,
  CATEGORY_KIND_ALBUM,
  CATEGORY_KIND_DEPARTMENT,
  categoryIdsMatch,
  isPrintProduct,
  parseProductAlbums,
  PRINTS_HANDLE,
  type GalleryAlbumRef,
} from "../../utils/store-catalog"

export type SyncPrintProductCategoriesInput = {
  product_id: string
}

export type SyncPrintProductCategoriesResult = {
  skipped: boolean
  category_ids: string[]
  created_category_ids: string[]
}

type Compensation = {
  created_category_ids: string[]
  linked: boolean
  product_id?: string
  previous_category_ids?: string[]
}

export const syncPrintProductCategoriesStep = createStep(
  "sync-print-product-categories",
  async (
    input: SyncPrintProductCategoriesInput,
    { container }
  ): Promise<
    StepResponse<SyncPrintProductCategoriesResult, Compensation>
  > => {
    const productModule: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    const product = await productModule.retrieveProduct(input.product_id, {
      relations: ["categories"],
    })

    const emptyCompensation: Compensation = {
      created_category_ids: [],
      linked: false,
    }

    if (!isPrintProduct(product.metadata)) {
      return new StepResponse(
        {
          skipped: true,
          category_ids: [],
          created_category_ids: [],
        },
        emptyCompensation
      )
    }

    const albums = parseProductAlbums(product.metadata)
    const prints = await findPrintsCategory(productModule)
    const albumCategories = await ensureAlbumCategories(
      productModule,
      prints.id,
      albums
    )
    const createdCategoryIds = albumCategories
      .filter((category) => category.created)
      .map((category) => category.id)
    const desiredIds = albumCategories.map((category) => category.id)
    const currentIds = (product.categories ?? []).map((category) => category.id)

    if (categoryIdsMatch(currentIds, desiredIds)) {
      return new StepResponse(
        {
          skipped: true,
          category_ids: desiredIds,
          created_category_ids: createdCategoryIds,
        },
        {
          created_category_ids: createdCategoryIds,
          linked: false,
        }
      )
    }

    await productModule.updateProducts(product.id, {
      category_ids: desiredIds,
    })

    await maybeSetAlbumCovers(
      productModule,
      albumCategories,
      product.thumbnail ?? null
    )

    return new StepResponse(
      {
        skipped: false,
        category_ids: desiredIds,
        created_category_ids: createdCategoryIds,
      },
      {
        created_category_ids: createdCategoryIds,
        linked: true,
        product_id: product.id,
        previous_category_ids: currentIds,
      }
    )
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }

    const productModule: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    if (compensation.linked && compensation.product_id) {
      await productModule.updateProducts(compensation.product_id, {
        category_ids: compensation.previous_category_ids ?? [],
      })
    }

    if (compensation.created_category_ids.length) {
      await productModule.deleteProductCategories(
        compensation.created_category_ids
      )
    }
  }
)

async function findPrintsCategory(
  productModule: IProductModuleService
): Promise<ProductCategoryDTO> {
  const { category } = await ensureProductCategory(productModule, {
    name: "Prints",
    handle: PRINTS_HANDLE,
    description: "Prints and digital downloads from the gallery.",
    parent_category_id: null,
    rank: 0,
    metadata: { kind: CATEGORY_KIND_DEPARTMENT },
  })

  return category
}

async function ensureAlbumCategories(
  productModule: IProductModuleService,
  printsId: string,
  albums: GalleryAlbumRef[]
): Promise<(ProductCategoryDTO & { created: boolean })[]> {
  if (!albums.length) {
    return []
  }

  const result: (ProductCategoryDTO & { created: boolean })[] = []

  for (const album of albums) {
    const { category, created } = await ensureProductCategory(productModule, {
      name: album.title,
      handle: albumCategoryHandle(album.slug),
      description: `Prints from the ${album.title} gallery album.`,
      parent_category_id: printsId,
      metadata: {
        kind: CATEGORY_KIND_ALBUM,
        gallery_album_id: album.id,
      },
    })
    result.push({ ...category, created })
  }

  return result
}

async function maybeSetAlbumCovers(
  productModule: IProductModuleService,
  categories: (ProductCategoryDTO & { created?: boolean })[],
  thumbnail: string | null
) {
  if (!thumbnail) {
    return
  }

  for (const category of categories) {
    const metadata = (category.metadata ?? {}) as Record<string, unknown>
    if (typeof metadata.cover_url === "string" && metadata.cover_url) {
      continue
    }
    await productModule.updateProductCategories(category.id, {
      metadata: {
        ...metadata,
        cover_url: thumbnail,
      },
    })
  }
}
