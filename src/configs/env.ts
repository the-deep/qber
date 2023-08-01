export const staticEndpoint = import.meta.env.APP_STATIC_ENDPOINT as string;
export const graphqlEndpoint = import.meta.env.APP_GRAPHQL_ENDPOINT as string; // http://localhost:8000/graphql

export const hCaptchaKey = import.meta.env.APP_HCATPCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';
