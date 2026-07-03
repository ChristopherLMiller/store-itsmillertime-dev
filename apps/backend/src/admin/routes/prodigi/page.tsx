import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import { Navigate } from "react-router-dom"

const ProdigiPage = () => {
  return <Navigate to="/prodigi/print-catalog" replace />
}

export const config = defineRouteConfig({
  label: "Prodigi",
  icon: TruckFast,
})

export default ProdigiPage
