import { Bluelink } from './bluelink-regions/base'
import { Config } from 'config'
import { BluelinkUSA } from './bluelink-regions/usa'

export async function initRegionalBluelink(config: Config, refreshAuth = true): Promise<Bluelink | undefined> {
  if (config.manufacturer.toLowerCase() !== 'hyundai') {
    throw new Error(`${config.manufacturer} is not supported`)
  }

  if (config.auth.region !== 'usa') {
    throw new Error(`${config.auth.region} region is not supported`)
  }

  return await BluelinkUSA.init(config, refreshAuth)
}
