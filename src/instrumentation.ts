export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { validateDeploymentConfiguration } = await import(
    "./adapters/configuration/deployment"
  );
  validateDeploymentConfiguration(process.env);
}
