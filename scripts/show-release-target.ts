import { requireReleaseConfiguration } from "../src/adapters/configuration/release";

const configuration = requireReleaseConfiguration(process.env);

console.log(`Release database target: ${configuration.databaseIdentity}`);
