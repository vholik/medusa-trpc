import { MedusaModule } from '@medusajs/modules-sdk'
import { Modules } from '@medusajs/framework/utils'
import { type ICartModuleService } from '@medusajs/framework/types'
import { createMedusaContainer, ContainerRegistrationKeys, ModulesSdkUtils } from "@medusajs/utils"
import { asValue } from "awilix"

type InitOptions = {
  dbConnectionString: string
  driverOptions?: Record<string, any>
}

let cartService: ICartModuleService

export async function initializeCartService({ dbConnectionString, driverOptions }: InitOptions) {
  if (!cartService) {
    const sharedContainer = createMedusaContainer()
    const pgConnection = ModulesSdkUtils.createPgConnection({
      clientUrl: dbConnectionString,
      driverOptions,
    })

    sharedContainer.register(ContainerRegistrationKeys.PG_CONNECTION, asValue(pgConnection))

    const serviceKey = Modules.CART
    const loaded = await MedusaModule.bootstrap({
      moduleKey: serviceKey,
      defaultPath: '@medusajs/cart',
      sharedContainer,
    })

    cartService = loaded[serviceKey] as ICartModuleService
  }

  return cartService
}
