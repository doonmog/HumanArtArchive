import { joinURL } from 'ufo'
import type { ProviderGetImage } from '@nuxt/image'

export const getImage: ProviderGetImage = (src, { modifiers = {} } = {}) => {
  // For API routes, return the URL as-is to allow proxy passthrough
  if (src.startsWith('/api/')) {
    return {
      url: src
    }
  }
  
  // For other images, use default behavior
  return {
    url: src
  }
}
