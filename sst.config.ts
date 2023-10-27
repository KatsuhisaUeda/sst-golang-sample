import { SSTConfig } from "sst";
import { API } from "./stacks/KataruStack";

export default {
  config(_input) {
    return {
      name: "back-sst",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(API);
  }
} satisfies SSTConfig;
