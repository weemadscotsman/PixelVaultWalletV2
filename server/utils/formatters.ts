export function base64SpkiToPem(base64Spki: string): string {
  const chunks = base64Spki.match(/.{1,64}/g);
  const pem = ['-----BEGIN PUBLIC KEY-----', ...(chunks || []), '-----END PUBLIC KEY-----'].join('\n');
  return pem;
}
