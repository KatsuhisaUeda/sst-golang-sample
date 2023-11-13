import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2'
import {
  CaCertificate,
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  DatabaseSecret,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds'
import { Config, Service, StackContext } from 'sst/constructs'

export function API({ stack, app }: StackContext) {
  const vpc = new Vpc(stack, 'Vpc', { natGateways: 1 })

  const backendSg = new SecurityGroup(stack, 'BackendApp', { vpc })
  const rdsSg = new SecurityGroup(stack, 'BackendDatabase', { vpc })
  rdsSg.addIngressRule(backendSg, Port.tcp(5432), 'Allow DB connection from backend to RDS')

  const dbSecret = new DatabaseSecret(stack, `${app.stage}-db-credential`, {
    username: `kataru${app.stage}`,
    dbname: `${app.stage}kataru`,
  })
  const database = new DatabaseInstance(stack, `${app.stage}-backend`, {
    engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_15 }),
    vpc,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
    allocatedStorage: 20,
    maxAllocatedStorage: 1000,
    storageEncrypted: true,
    credentials: Credentials.fromSecret(dbSecret),
    databaseName: dbSecret.secretValueFromJson('dbname').toString(),
    caCertificate: CaCertificate.RDS_CA_RDS4096_G1,
    securityGroups: [rdsSg],
    enablePerformanceInsights: true,
  })

  const dbSetting = {
    host: database.dbInstanceEndpointAddress,
    port: database.dbInstanceEndpointPort,
    user: dbSecret.secretValueFromJson('username').toString(),
    password: dbSecret.secretValueFromJson('password').toString(),
    dbname: dbSecret.secretValueFromJson('dbname').toString(),
  }
  const DBURI = new Config.Parameter(stack, 'DBURI', {
    value: `postgres://${dbSetting.user}:${dbSetting.password}@${dbSetting.host}:${dbSetting.port}/${dbSetting.dbname}`,
  })

  const backend = new Service(stack, 'KataruBackend', {
    path: './packages/backend',
    bind: [DBURI],
    port: 8000,
    dev: {
      deploy: true,
      url: 'http://localhost:8000',
    },
    logRetention: 'one_week',
    cdk: {
      vpc,
      applicationLoadBalancerTargetGroup: { healthCheck: { path: '/healthz' } },
      cloudfrontDistribution: false,
      fargateService: {
        capacityProviderStrategies: [{ capacityProvider: 'FARGATE', base: 0, weight: 1 }],
        circuitBreaker: { rollback: true },
        securityGroups: [backendSg],
      },
    },
  })
  // // Commented out below due to failure to delete ClusterCapacityProviderAssociations
  // backend.cdk.cluster.enableFargateCapacityProviders()

  stack.addOutputs({
    ALB_DnsName: backend.cdk?.applicationLoadBalancer?.loadBalancerDnsName,
  })
}
