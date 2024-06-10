# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

### [0.7.10](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.9...loadbalanced-ecs-service-0.7.10) (2024-06-10)


### Bug Fixes

* **loadbalanced-ecs-service:** tag awscustomresource ([dbd99f8](https://github.com/justicointeractive/ji-constructs/commit/dbd99f82ffbd1b2abb32e4ada5bb68ff4b05e2d8))

### [0.7.9](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.8...loadbalanced-ecs-service-0.7.9) (2024-06-10)


### Bug Fixes

* **loadbalanced-ecs-service:** turns out, cfn doesn't support tags for listener rules ([adc0900](https://github.com/justicointeractive/ji-constructs/commit/adc09008a5942f659818b644193a7ab15f4003ef))

### [0.7.8](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.7...loadbalanced-ecs-service-0.7.8) (2024-06-09)


### Bug Fixes

* **loadbalanced-ecs-service:** don't auto generate a target id ([19cf93c](https://github.com/justicointeractive/ji-constructs/commit/19cf93c6aa99196b9d5e6e8082b4e8480c95b67e))

### [0.7.7](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.6...loadbalanced-ecs-service-0.7.7) (2024-06-09)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.11`

### Bug Fixes

* **loadbalanced-ecs-service:** wrapping alb rule with priority ([f0dbbe0](https://github.com/justicointeractive/ji-constructs/commit/f0dbbe01593e3c3e910d34b3e511e0e8316ab7f6))

### [0.7.6](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.5...loadbalanced-ecs-service-0.7.6) (2024-06-08)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.10`
### [0.7.5](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.4...loadbalanced-ecs-service-0.7.5) (2024-06-08)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.9`
### [0.7.4](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.3...loadbalanced-ecs-service-0.7.4) (2024-06-08)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.8`

### Bug Fixes

* resolve rule priority by tags rather than hostname ([8d70371](https://github.com/justicointeractive/ji-constructs/commit/8d70371b6b57e6c63e9351cdd4dfb4ac3c772339))

### [0.7.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.2...loadbalanced-ecs-service-0.7.3) (2024-01-13)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.7`
### [0.7.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.1...loadbalanced-ecs-service-0.7.2) (2024-01-13)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.6`

### Bug Fixes

* **loadbalanced-ecs-service:** lookup ([093174b](https://github.com/justicointeractive/ji-constructs/commit/093174b1e6c545190d37d2c869c9cbe1e308babf))

### [0.7.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.7.0...loadbalanced-ecs-service-0.7.1) (2024-01-13)


### Bug Fixes

* **loadbalanced-ecs-service:** options are no optional ([59e05e8](https://github.com/justicointeractive/ji-constructs/commit/59e05e8dd6fd497e9ba18b92fa7d20ad7e7a5f4c))

## [0.7.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.5...loadbalanced-ecs-service-0.7.0) (2024-01-13)


### Features

* **loadbalanced-ecs-service:** autodiscover lb ([888ef33](https://github.com/justicointeractive/ji-constructs/commit/888ef33b90d84148bd7a651e4afefb99acf55a9b))

### [0.6.5](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.4...loadbalanced-ecs-service-0.6.5) (2024-01-05)

### [0.6.4](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.3...loadbalanced-ecs-service-0.6.4) (2024-01-05)


### Bug Fixes

* ensure clusters know about security groups and load balanced services require security groups ([b6e4884](https://github.com/justicointeractive/ji-constructs/commit/b6e4884539e15f9d5d894ae1e44babffce40a52e))

### [0.6.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.2...loadbalanced-ecs-service-0.6.3) (2024-01-05)

### [0.6.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.1...loadbalanced-ecs-service-0.6.2) (2024-01-05)

### [0.6.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.6.0...loadbalanced-ecs-service-0.6.1) (2024-01-05)


### Bug Fixes

* **loadbalanced-ecs-service:** require healthcheck and fix lb to target security group rule ([92e49c6](https://github.com/justicointeractive/ji-constructs/commit/92e49c61646654eaa35908022a65fb0d6ebd1bf4))

## [0.6.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.5.1...loadbalanced-ecs-service-0.6.0) (2024-01-02)


### Features

* **loadbalanced-ecs-service:** break up adding target to loadbalancer ([9248762](https://github.com/justicointeractive/ji-constructs/commit/924876257a9dbfafeae717070e709c86d87f51b7))

### [0.5.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.5.0...loadbalanced-ecs-service-0.5.1) (2023-12-29)

## [0.5.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.4.1...loadbalanced-ecs-service-0.5.0) (2023-05-02)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.5`

### Features

* **loadbalanced-ecs-service:** allow user to provide a certificate ([c5d5ca7](https://github.com/justicointeractive/ji-constructs/commit/c5d5ca7c86c792f04e8418fbbcf5f033df0b00a4))


### Bug Fixes

* **loadbalanced-ecs-service:** the DnsValidatedCertificate construct was deprecated ([3347c8b](https://github.com/justicointeractive/ji-constructs/commit/3347c8b5dee979eb2852b9df97fe32373721e394))

### [0.4.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.4.2...loadbalanced-ecs-service-0.4.3) (2023-04-23)


### Bug Fixes

* **loadbalanced-ecs-service:** the DnsValidatedCertificate construct was deprecated ([3347c8b](https://github.com/justicointeractive/ji-constructs/commit/3347c8b5dee979eb2852b9df97fe32373721e394))

### [0.4.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.4.1...loadbalanced-ecs-service-0.4.2) (2023-04-22)

### [0.4.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.4.0...loadbalanced-ecs-service-0.4.1) (2022-12-08)


### Bug Fixes

* **loadbalanced-ecs-service:** accept ICertificate rather than Certificate for aliases ([e4f0a50](https://github.com/justicointeractive/ji-constructs/commit/e4f0a50c7071b3f6016d1269dc7fbae90e2ff2aa))

## [0.4.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.4...loadbalanced-ecs-service-0.4.0) (2022-12-08)


### Features

* **loadbalanced-ecs-service:** allow adding additional domain name/alias rules to load balancer ([d9483d0](https://github.com/justicointeractive/ji-constructs/commit/d9483d0082d155ecb1adfa00be5ae0325f6f122b))

### [0.3.4](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3...loadbalanced-ecs-service-0.3.4) (2022-08-16)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.4`
### [0.3.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.5...loadbalanced-ecs-service-0.3.3) (2022-08-16)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.3`
### [0.3.3-alpha.5](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.4...loadbalanced-ecs-service-0.3.3-alpha.5) (2022-08-16)

### [0.3.3-alpha.4](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.3...loadbalanced-ecs-service-0.3.3-alpha.4) (2022-08-16)

### [0.3.3-alpha.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.2...loadbalanced-ecs-service-0.3.3-alpha.3) (2022-08-16)

### [0.3.3-alpha.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.1...loadbalanced-ecs-service-0.3.3-alpha.2) (2022-08-16)

### [0.3.3-alpha.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.3-alpha.0...loadbalanced-ecs-service-0.3.3-alpha.1) (2022-08-16)

### [0.3.3-alpha.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.2...loadbalanced-ecs-service-0.3.3-alpha.0) (2022-08-16)

### [0.3.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.1...loadbalanced-ecs-service-0.3.2) (2022-08-16)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.3`
### [0.3.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.3.0...loadbalanced-ecs-service-0.3.1) (2022-08-16)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.2`
## [0.3.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.2.3...loadbalanced-ecs-service-0.3.0) (2022-06-08)


### Features

* **loadbalanced-ecs-service:** provide scope construct to service factory ([85f6905](https://github.com/justicointeractive/ji-constructs/commit/85f6905367a0360ea8222ae672aabe9b9736d296))

### [0.2.3](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.2.2...loadbalanced-ecs-service-0.2.3) (2022-06-07)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.2`
### [0.2.2](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.2.1...loadbalanced-ecs-service-0.2.2) (2022-06-07)

### Dependency Updates

* `elb-rule-priority` updated to version `0.1.1`

### Bug Fixes

* **loadbalanced-ecs-service:** track dependency versions ([6469ec1](https://github.com/justicointeractive/ji-constructs/commit/6469ec113097a4b6cd6a1f2f8560edb64467c956))

### [0.2.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.2.0...loadbalanced-ecs-service-0.2.1) (2022-06-07)


### Bug Fixes

* **loadbalanced-ecs-service:** pass listener arn through lookup as a string ([fa6e68b](https://github.com/justicointeractive/ji-constructs/commit/fa6e68b992fe3713bec8acd4df504e8dade310ff))

## [0.2.0](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.1.1...loadbalanced-ecs-service-0.2.0) (2022-06-07)


### Features

* **loadbalanced-ecs-service:** make it easier to integrate an existing vpc with a new cluster ([826e773](https://github.com/justicointeractive/ji-constructs/commit/826e773dec581784b0e31dbb75b5a3c839e9ab73))

### [0.1.1](https://github.com/justicointeractive/ji-constructs/compare/loadbalanced-ecs-service-0.1.0...loadbalanced-ecs-service-0.1.1) (2022-06-07)


### Bug Fixes

* **loadbalanced-ecs-service:** allow tcp connections to cluster from loadBalancer ([7a76d05](https://github.com/justicointeractive/ji-constructs/commit/7a76d05c8d313f0533fc6210c77ec2aecd15ae17))

## 0.1.0 (2022-06-07)


### Features

* create monorepo ([5d7155a](https://github.com/justicointeractive/ji-constructs/commit/5d7155a88841822fa7c984658f95ebf36d56af6e))


### Bug Fixes

* packageName variable is not resolved in postTargets ([989ab70](https://github.com/justicointeractive/ji-constructs/commit/989ab70521d1895358447f136a1817221c03281e))

## 0.1.0 (2022-06-07)


### Features

* create monorepo ([5d7155a](https://github.com/justicointeractive/ji-constructs/commit/5d7155a88841822fa7c984658f95ebf36d56af6e))


### Bug Fixes

* packageName variable is not resolved in postTargets ([989ab70](https://github.com/justicointeractive/ji-constructs/commit/989ab70521d1895358447f136a1817221c03281e))
