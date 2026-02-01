import { env } from "~/env";
import CartModule from '@medusajs/cart'
import { knex } from "@mikro-orm/postgresql"
import { MedusaModule } from '@medusajs/modules-sdk'
import { Modules } from '@medusajs/framework/utils'
import { type ExternalModuleDeclaration, type ICartModuleService } from '@medusajs/framework/types'
import { createMedusaContainer, ContainerRegistrationKeys, ModulesSdkUtils } from "@medusajs/utils"
import { asValue } from "awilix"

export const initialize = () => {

}

let cartService: ICartModuleService

type InitOptions = {
    dbConnectionString: string
    driverOptions?: Record<string, any>
    schema?: string
    options?: ExternalModuleDeclaration
}

export async function getCartService({ dbConnectionString, driverOptions, schema, options }: InitOptions) {
    if (!cartService) {
        const sharedContainer = createMedusaContainer()
        const pgConnection = await initDatabaseConnection({ dbConnectionString, driverOptions, schema })

        sharedContainer.register(ContainerRegistrationKeys.PG_CONNECTION, asValue(pgConnection))

        const serviceKey = Modules.CART
        const loaded = await MedusaModule.bootstrap({
            moduleKey: serviceKey,
            defaultPath: '@medusajs/cart',
            declaration: options,
            sharedContainer: sharedContainer,
        })

        cartService = loaded[serviceKey] as ICartModuleService
    }

    return cartService
}


async function initDatabaseConnection({ dbConnectionString, driverOptions, schema = 'public' }: InitOptions) {
    return ModulesSdkUtils.createPgConnection({
        clientUrl: dbConnectionString,
        schema,
        driverOptions,
    })
}