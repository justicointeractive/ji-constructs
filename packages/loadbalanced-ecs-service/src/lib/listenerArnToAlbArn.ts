export function listenerArnToAlbArn(listenerArn: string) {
  // arn:aws:elasticloadbalancing:[region]:[org]:listener/app/[name]/[id]/[listener id]
  // arn:aws:elasticloadbalancing:[region]:[org]:loadbalancer/app/[name]/[id]]
  return listenerArn
    .replace('listener/', 'loadbalancer/')
    .split('/')
    .slice(0, -1)
    .join('/');
}
