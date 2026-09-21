# Mock Infrastructure Modules (`testdata/modules`)

> **Parent Documentation**: For the higher-level architecture, see [Test Fixtures Suite](../README.md)

The `testdata/modules` directory contains 6 modular Terraform packages that simulate a scalable AWS cloud architecture. Each module encapsulates a specific infrastructure domain—networking, object storage, compute virtualization, relational databases, serverless functions, and traffic routing—using synthetic providers to generate realistic dependency graphs for `plan-parse`.

---

## Inter-Module Dependency Architecture

The modules form a multi-tier Directed Acyclic Graph (DAG) with well-defined ingress, egress, and cross-tier resource bindings:

```mermaid
flowchart TD
    subgraph FoundationTier["1. Foundation Tier"]
        NET["networking<br/>(VPC, Subnets, Gateways, SGs)"]
        STORE["storage<br/>(S3, KMS, IAM Roles & Policies)"]
    end

    subgraph ServiceTier["2. Data & Compute Tier"]
        COMP["compute<br/>(EC2 Instances, Key Pairs, LT)"]
        DB["database<br/>(PostgreSQL RDS, Subnet Groups)"]
        LAMBDA["lambda<br/>(Serverless Lambda, CW Logs)"]
    end

    subgraph IngressTier["3. Ingress & Traffic Management"]
        ALB["loadbalancer<br/>(ALB, Target Groups, Rules)"]
    end

    NET -->|public_subnet_ids<br/>security_group_id| COMP
    NET -->|private_subnet_ids<br/>security_group_id| DB
    NET -->|public_subnet_ids<br/>vpc_id| ALB
    COMP -->|instance_ids| ALB
    STORE -->|bucket_name<br/>bucket_arn| LAMBDA
```

---

## Module Catalog

| Module | Emulated AWS Services | Cross-Module Dependencies | Downstream Consumers |
| :--- | :--- | :--- | :--- |
| [`networking`](./networking/README.md) | VPC, Public/Private Subnets, IGW, NAT Gateway, Route Tables, Security Group | None (Root foundation) | `compute`, `database`, `loadbalancer` |
| [`storage`](./storage/README.md) | S3 Bucket, Versioning, KMS Encryption, IAM Role, IAM Policy | None (Root foundation) | `lambda` |
| [`compute`](./compute/README.md) | EC2 Instances, Key Pairs, Launch Templates, SG Rules | `networking` | `loadbalancer` |
| [`database`](./database/README.md) | RDS PostgreSQL, DB Subnet Group, DB Parameter Group | `networking` | None (End storage tier) |
| [`lambda`](./lambda/README.md) | Lambda Function, Execution Role, CloudWatch Log Group | `storage` | None (Worker tier) |
| [`loadbalancer`](./loadbalancer/README.md) | Application Load Balancer, Target Groups, Listeners, Routing Rules | `networking`, `compute` | None (Ingress tier) |

---

## Emulation Techniques & Synthetic Patterns

To generate rich dependency DAGs with complete Terraform plan metadata without requiring AWS credentials or cloud billing, each module utilizes standard Terraform utility providers:
1. **`hashicorp/null` (`null_resource`)**: Used to represent AWS infrastructure resources (`aws_vpc`, `aws_instance`, `aws_db_instance`, `aws_lb`). Resource triggers mimic real cloud attributes (e.g., `triggers = { vpc_id = null_resource.vpc.id }`).
2. **`hashicorp/random` (`random_id`, `random_pet`, `random_password`, `random_integer`)**: Simulates cloud resource name generation, unique suffixes, secure database credentials, and dynamic intervals.
3. **`hashicorp/tls` (`tls_private_key`, `tls_self_signed_cert`)**: Generates realistic 4096-bit RSA SSH keys and X.509 certificates for compute instances and HTTPS load balancer listeners.
4. **`hashicorp/local` (`local_file`)**: Simulates side-effect artifacts such as exported SSH key pairs, IAM policy documents, and JSON configuration manifests.

---

## Hierarchy & Reference Graph

For more details about this section, check out [Networking Module](./networking/README.md)
For more details about this section, check out [Storage Module](./storage/README.md)
For more details about this section, check out [Compute Module](./compute/README.md)
For more details about this section, check out [Database Module](./database/README.md)
For more details about this section, check out [Lambda Module](./lambda/README.md)
For more details about this section, check out [Load Balancer Module](./loadbalancer/README.md)

This section connects to [Core Parser Engine](../../pkg/core/README.md) for parsing tests and [Go Server Backend](../../pkg/server/README.md) for lifecycle integration testing.

```mermaid
flowchart TD
    TESTDATA["testdata/ (Test Fixtures)"]:::node
    MODULES["testdata/modules/ (AWS Modules)"]:::current
    NET["networking/"]:::node
    STORE["storage/"]:::node
    COMP["compute/"]:::node
    DB["database/"]:::node
    LAMBDA["lambda/"]:::node
    ALB["loadbalancer/"]:::node

    TESTDATA --> MODULES
    MODULES --> NET
    MODULES --> STORE
    MODULES --> COMP
    MODULES --> DB
    MODULES --> LAMBDA
    MODULES --> ALB

    classDef current fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef node fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;
```
