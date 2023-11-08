import { Config, Service, StackContext } from 'sst/constructs'

export function API({ stack }: StackContext) {
  const DBURI = new Config.Parameter(stack, 'DBURI', {
    value: 'postgres://user:pass@localhost/sampledb1',
  })
  const SECRET_KEY = new Config.Secret(stack, 'SECRET_KEY')

  const backend = new Service(stack, 'KataruBackend', {
    path: './packages/backend',
    bind: [DBURI, SECRET_KEY],
    port: 8000,
    dev: {
      deploy: true,
      url: 'http://localhost:8000',
    },
    logRetention: 'one_week',
    cdk: {
      applicationLoadBalancerTargetGroup: { healthCheck: { path: '/healthz' } },
      cloudfrontDistribution: false,
      fargateService: {
        capacityProviderStrategies: [{ capacityProvider: 'FARGATE', base: 0, weight: 1 }],
        circuitBreaker: { rollback: true },
      },
    },
  })
  // // Commented out below due to failure to delete ClusterCapacityProviderAssociations
  // backend.cdk.cluster.enableFargateCapacityProviders()

  stack.addOutputs({
    ALB_DnsName: backend.cdk?.applicationLoadBalancer?.loadBalancerDnsName,
  })
}
