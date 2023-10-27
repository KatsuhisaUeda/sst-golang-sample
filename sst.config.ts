import { SSTConfig } from 'sst'

import { API } from './stacks/KataruStack'

export default {
  config() {
    return {
      name: 'back-sst',
      region: 'ap-northeast-1',
    }
  },
  stacks(app) {
    app.stack(API)
  },
} satisfies SSTConfig
