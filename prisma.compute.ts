import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "fh-abalat",
    framework: "nextjs",
    env: ".env",
  },
});
