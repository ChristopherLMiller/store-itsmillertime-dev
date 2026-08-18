import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

type Props = {
  searchParams: Promise<{ cart_id?: string }>
}

export default async function Cart(props: Props) {
  const { cart_id: cartIdFromQuery } = await props.searchParams
  const cart = await retrieveCart(cartIdFromQuery).catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
