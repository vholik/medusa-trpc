import { MedusaModule } from '@medusajs/modules-sdk'
import { Modules } from '@medusajs/framework/utils'
import { IProductModuleService, type ICartModuleService } from '@medusajs/framework/types'
import { createMedusaContainer, ContainerRegistrationKeys, ModulesSdkUtils } from "@medusajs/utils"
import { asValue } from "awilix"

type InitOptions<TKeys extends Modules[]> = {
  dbConnectionString: string
  driverOptions?: Record<string, any>
  modules: TKeys
}

type ModuleDefinitions = {
  [Modules.CART]: ICartModuleService
  [Modules.PRODUCT]: IProductModuleService
}

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type InferLoadedModules<T extends Modules[]> = Prettify<{
  [K in T[number]]: K extends keyof ModuleDefinitions ? ModuleDefinitions[K] : never
}>

const loadedModules: Record<string, any> = {}

export async function initialize<TKeys extends Modules[]>({ dbConnectionString, driverOptions, modules }: InitOptions<TKeys>): Promise<InferLoadedModules<TKeys>> {
  const serviceKey = Modules.CART

  if (!loadedModules[serviceKey]) {
    const sharedContainer = createMedusaContainer()
    const pgConnection = ModulesSdkUtils.createPgConnection({
      clientUrl: dbConnectionString,
      driverOptions,
    })

    sharedContainer.register(ContainerRegistrationKeys.PG_CONNECTION, asValue(pgConnection))

    const loaded = await MedusaModule.bootstrap({
      moduleKey: serviceKey,
      defaultPath: '@medusajs/cart',
      sharedContainer,
    })

    loadedModules[serviceKey] = loaded[serviceKey] as ICartModuleService
  }

  return loadedModules as InferLoadedModules<TKeys>
}
