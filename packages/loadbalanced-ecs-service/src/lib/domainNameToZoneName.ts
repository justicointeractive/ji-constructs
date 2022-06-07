export function domainNameToZoneName(domainName: string) {
  return domainName.split('.').slice(-2).join('.');
}
