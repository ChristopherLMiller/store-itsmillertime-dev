import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ROLE_TO_CUSTOMER_GROUP } from "./constants"

type CustomerGroup = { id: string; name: string }

export async function syncCustomerGroupsForRoles(
  container: MedusaContainer,
  customerId: string,
  roles: string[]
): Promise<string[]> {
  const customerModule = container.resolve(Modules.CUSTOMER)

  const desiredNames = new Set(
    roles
      .map((role) => ROLE_TO_CUSTOMER_GROUP[role])
      .filter((name): name is string => Boolean(name))
  )

  const existingGroups = (await customerModule.listCustomerGroups(
    {},
    { take: 100 }
  )) as CustomerGroup[]

  const byName = new Map(
    existingGroups.map((group) => [group.name.toLowerCase(), group])
  )

  for (const name of desiredNames) {
    if (!byName.has(name.toLowerCase())) {
      const created = (await customerModule.createCustomerGroups({
        name,
      })) as CustomerGroup
      byName.set(name.toLowerCase(), created)
    }
  }

  const managedNames = new Set(
    Object.values(ROLE_TO_CUSTOMER_GROUP).map((n) => n.toLowerCase())
  )

  const customer = await customerModule.retrieveCustomer(customerId, {
    relations: ["groups"],
  })

  const currentGroups = ((customer as { groups?: CustomerGroup[] }).groups ||
    []) as CustomerGroup[]

  const toRemove = currentGroups
    .filter(
      (group) =>
        managedNames.has(group.name.toLowerCase()) &&
        !desiredNames.has(group.name.toLowerCase())
    )
    .map((group) => ({
      customer_id: customerId,
      customer_group_id: group.id,
    }))

  if (toRemove.length) {
    await customerModule.removeCustomerFromGroup(toRemove)
  }

  const currentIds = new Set(currentGroups.map((g) => g.id))
  const attached: string[] = []
  const toAdd: { customer_id: string; customer_group_id: string }[] = []

  for (const name of desiredNames) {
    const group = byName.get(name.toLowerCase())
    if (!group) continue
    if (!currentIds.has(group.id)) {
      toAdd.push({ customer_id: customerId, customer_group_id: group.id })
    }
    attached.push(group.name)
  }

  if (toAdd.length) {
    await customerModule.addCustomerToGroup(toAdd)
  }

  return attached
}
