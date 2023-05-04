# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

### [0.2.4](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.2.3...cdk-shared-database-0.2.4) (2023-05-04)


### Bug Fixes

* **shared-db:** workaround for rds super user issue ([d83a911](https://github.com/justicointeractive/ji-constructs/commit/d83a91118a758f8c3261111f7616ef71d5f0d925))

### [0.2.3](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.2.2...cdk-shared-database-0.2.3) (2023-05-03)


### Bug Fixes

* **shared-db:** throw a better error custom resource lambda ([63390c5](https://github.com/justicointeractive/ji-constructs/commit/63390c5ed285f515dc52984acc0ac2f31e55aa6c))

### [0.2.2](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.2.1...cdk-shared-database-0.2.2) (2023-05-03)


### Bug Fixes

* **shared-db:** pass template database value to custom resource ([05cf33e](https://github.com/justicointeractive/ji-constructs/commit/05cf33e940dee90fe825ff023efa3752662f10e1))

### [0.2.1](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.2.0...cdk-shared-database-0.2.1) (2023-05-02)


### Bug Fixes

* **shared-db:** passing options from lambda to lib ([f8f576f](https://github.com/justicointeractive/ji-constructs/commit/f8f576ff0d401af93a4728540a930935de069b12))

## [0.2.0](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.32...cdk-shared-database-0.2.0) (2023-05-02)


### Features

* **shared-db:** allow creating a new shared db instance as a copy of an existing one ([1fb0c90](https://github.com/justicointeractive/ji-constructs/commit/1fb0c90ed516e80191e8e6a088bf28cd3241caf1))

### [0.1.32](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.31...cdk-shared-database-0.1.32) (2022-12-15)


### Bug Fixes

* **shared-db:** propagate error from vpc function ([f842643](https://github.com/justicointeractive/ji-constructs/commit/f842643dc262ab448cb29f55e7f97d9dcb7aed71))

### [0.1.31](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.30...cdk-shared-database-0.1.31) (2022-12-15)


### Bug Fixes

* **shared-db:** don't lookup security group if not needed ([f3518c5](https://github.com/justicointeractive/ji-constructs/commit/f3518c5e2a0762b9514bf9b75a17731cfe9349a6))

### [0.1.30](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.29...cdk-shared-database-0.1.30) (2022-12-15)


### Bug Fixes

* **shared-db:** require port ([db7e7e6](https://github.com/justicointeractive/ji-constructs/commit/db7e7e68233c207aa4c8957409604df534bc2f55))

### [0.1.29](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.28...cdk-shared-database-0.1.29) (2022-12-15)


### Bug Fixes

* **shared-db:** create db if not exists ([d8d0656](https://github.com/justicointeractive/ji-constructs/commit/d8d06564536242c89834a580d15f4e7f25d13ef8))
* **shared-db:** quote names and fix create syntax ([f4978b4](https://github.com/justicointeractive/ji-constructs/commit/f4978b45fde80f620956ecad095a329e9c4d2f91))

### [0.1.28](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.27...cdk-shared-database-0.1.28) (2022-12-15)

### [0.1.27](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.26...cdk-shared-database-0.1.27) (2022-12-15)


### Bug Fixes

* **shared-db:** make easier to connect to ([c4464b7](https://github.com/justicointeractive/ji-constructs/commit/c4464b754ab1ff218ea2941538686d7cfda2b1ba))

### [0.1.26](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.25...cdk-shared-database-0.1.26) (2022-12-15)


### Bug Fixes

* **shared-db:** passing around database instance name ([bc71d35](https://github.com/justicointeractive/ji-constructs/commit/bc71d35baa9dc4368a75cfbdab6e9e2f6fff63f2))

### [0.1.25](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.24...cdk-shared-database-0.1.25) (2022-12-15)


### Bug Fixes

* **shared-db:** don't reimplement removal policy ([da0af22](https://github.com/justicointeractive/ji-constructs/commit/da0af22238ceb220df98c7d66f1a1f9b1120559f))
* **shared-db:** make sure changing db instance name updates the resource ([603c741](https://github.com/justicointeractive/ji-constructs/commit/603c741078129c39be4fc9b196554de0c23c01f6))

### [0.1.24](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.23...cdk-shared-database-0.1.24) (2022-12-15)


### Bug Fixes

* **shared-db:** fix physical resource id ([de8c713](https://github.com/justicointeractive/ji-constructs/commit/de8c71395c057fce536d1e87596e53c23c54210b))
* **shared-db:** removal policy ([6198a01](https://github.com/justicointeractive/ji-constructs/commit/6198a0124987cdf8c3747917c6945618edfd3ff9))

### [0.1.23](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.22...cdk-shared-database-0.1.23) (2022-12-15)


### Bug Fixes

* **shared-db:** fix and test creating database on pg ([befaf14](https://github.com/justicointeractive/ji-constructs/commit/befaf141661ae95d513149d560cc9720c6720732))

### [0.1.22](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.21...cdk-shared-database-0.1.22) (2022-12-15)


### Bug Fixes

* **shared-db:** missing semicolon ([a34969a](https://github.com/justicointeractive/ji-constructs/commit/a34969ac76538093c35602b88b8b4ea1c6f42e3e))

### [0.1.21](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.20...cdk-shared-database-0.1.21) (2022-12-15)


### Bug Fixes

* **shared-db:** gotta set autocommit on ([68eab27](https://github.com/justicointeractive/ji-constructs/commit/68eab27ed36c13d8e8dc84aa0933642d815a2eba))

### [0.1.20](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.19...cdk-shared-database-0.1.20) (2022-12-15)


### Bug Fixes

* **shared-db:** fix vpc handler name ([cef1a02](https://github.com/justicointeractive/ji-constructs/commit/cef1a020f076e8115644f4930c655db0669ac48f))

### [0.1.19](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.18...cdk-shared-database-0.1.19) (2022-12-15)


### Bug Fixes

* **shared-db:** lambda payload must be stringified ([98a9997](https://github.com/justicointeractive/ji-constructs/commit/98a999767dbb27b2cc24fc3325fd70449313427a))

### [0.1.18](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.17...cdk-shared-database-0.1.18) (2022-12-15)


### Bug Fixes

* **shared-db:** roles and permissions ([bb14645](https://github.com/justicointeractive/ji-constructs/commit/bb14645c5c495110a4b00ca8e50f656683b6fc6a))

### [0.1.17](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.16...cdk-shared-database-0.1.17) (2022-12-15)


### Bug Fixes

* **shared-db:** grant vpc lambda required role ([a77d870](https://github.com/justicointeractive/ji-constructs/commit/a77d870ddba2cdc99ff21e1de2dbdda018a24dc7))

### [0.1.16](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.15...cdk-shared-database-0.1.16) (2022-12-14)


### Bug Fixes

* **shared-db:** don't specify subnet type ([18a6e29](https://github.com/justicointeractive/ji-constructs/commit/18a6e297e358a323b1c24144d656e3d49e5f36f8))

### [0.1.15](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.14...cdk-shared-database-0.1.15) (2022-12-14)


### Bug Fixes

* **shared-db:** resolve circular dependency ([e0ca75e](https://github.com/justicointeractive/ji-constructs/commit/e0ca75e82ef62c2ec88f2d04e05fdbc0fa1ad6a5))
* **shared-db:** try splitting lambdas ([fde20a5](https://github.com/justicointeractive/ji-constructs/commit/fde20a5a7ca3c0d5d64a443da0fe8eebdcbe6c6a))
* **shared-db:** try two lambdas, one in vpc the other outside ([35669ea](https://github.com/justicointeractive/ji-constructs/commit/35669ea46660bf74282fb67e5cf8c3583eef9f94))

### [0.1.14](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.13...cdk-shared-database-0.1.14) (2022-12-14)

### [0.1.13](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.12...cdk-shared-database-0.1.13) (2022-12-14)


### Reverts

* Revert "fix(shared-db): bypass secrets manager if possible" ([35ddf2c](https://github.com/justicointeractive/ji-constructs/commit/35ddf2c046e7e8eb9be95ec9330e8ff1a8a01ed5))

### [0.1.12](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.11...cdk-shared-database-0.1.12) (2022-12-14)


### Bug Fixes

* **shared-db:** no allow public subnet ([2b2f535](https://github.com/justicointeractive/ji-constructs/commit/2b2f5359fe5f9934c08a0897a359f165f1686e08))

### [0.1.11](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.10...cdk-shared-database-0.1.11) (2022-12-14)


### Bug Fixes

* **shared-db:** timeout after 1 minute ([372690e](https://github.com/justicointeractive/ji-constructs/commit/372690e792450ae664230dd375418abb19572dd4))

### [0.1.10](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.9...cdk-shared-database-0.1.10) (2022-12-14)


### Bug Fixes

* **shared-db:** db resource depends on secrets ([1771133](https://github.com/justicointeractive/ji-constructs/commit/1771133cb5f1521a8a3b2c34299f3da3265822c5))

### [0.1.9](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.8...cdk-shared-database-0.1.9) (2022-12-14)


### Bug Fixes

* **shared-db:** bypass secrets manager if possible ([469ff8b](https://github.com/justicointeractive/ji-constructs/commit/469ff8b451e878120435027a075d6e314018f274))

### [0.1.8](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.7...cdk-shared-database-0.1.8) (2022-12-14)


### Bug Fixes

* **shared-db:** don't just create a provider, also create a resource ([ca93e5e](https://github.com/justicointeractive/ji-constructs/commit/ca93e5e396b6118afc5fc1819c889eaa4332c658))

### [0.1.7](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.6...cdk-shared-database-0.1.7) (2022-12-14)


### Bug Fixes

* **shared-db:** retrieve secrets from secrets manager ([08c7c1d](https://github.com/justicointeractive/ji-constructs/commit/08c7c1d556381e0a8568b91006ba0b3bb6906269))

### [0.1.6](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.5...cdk-shared-database-0.1.6) (2022-12-14)

### [0.1.5](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.4...cdk-shared-database-0.1.5) (2022-12-14)


### Bug Fixes

* **shared-db:** working on secret/db attachment ([82b049e](https://github.com/justicointeractive/ji-constructs/commit/82b049e9ddd3659ac22460df2eacab0352699f0e))

### [0.1.4](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.3...cdk-shared-database-0.1.4) (2022-12-14)


### Bug Fixes

* **shared-db:** fix managed role name ([75f7af7](https://github.com/justicointeractive/ji-constructs/commit/75f7af7d27b3d9e52ab181f763c045c8571074a9))

### [0.1.3](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.2...cdk-shared-database-0.1.3) (2022-12-14)


### Bug Fixes

* **shared-db:** give custom resource framework lambda AWSLambdaBasicExecutionRole ([163748e](https://github.com/justicointeractive/ji-constructs/commit/163748e3192d68561b777fd2dab03c04c4ace5bf))

### [0.1.2](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.1...cdk-shared-database-0.1.2) (2022-12-14)


### Bug Fixes

* **shared-db:** try fixing shared db construct package json ([82bd213](https://github.com/justicointeractive/ji-constructs/commit/82bd213e0b8c0dc4b138fe9a64e5e953ee635101))

### [0.1.1](https://github.com/justicointeractive/ji-constructs/compare/cdk-shared-database-0.1.0...cdk-shared-database-0.1.1) (2022-12-12)


### Bug Fixes

* **shared-db:** fixing lambda when used as a node module ([9481833](https://github.com/justicointeractive/ji-constructs/commit/9481833ea2bba1f74c0b3236d99cfdcfb937ed94))

## 0.1.0 (2022-12-12)


### Features

* **shared-db:** create shared database construct ([f3097a4](https://github.com/justicointeractive/ji-constructs/commit/f3097a473e6a7bf0a1b689639fc4f0c2d15f6333))
