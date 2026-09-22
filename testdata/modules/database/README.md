# Database Module (`testdata/modules/database`)

> **Parent Documentation**: For the higher-level architecture, see [Infrastructure Modules](../README.md)

The `database` module provisions persistent relational database infrastructure within private network subnets. It emulates Amazon Relational Database Service (RDS) running PostgreSQL, database subnet groups, parameter groups, cryptographically random master passwords, and ingress security group rules.

---

## Internal Resource Dependency Graph

```mermaid
flowchart TD
    Pass["random_password.db_password<br/>(24-char Secret)"]
    ID["random_id.db_identifier"]
    SubnetGrp["null_resource.db_subnet_group<br/>(aws_db_subnet_group)"]
    ParamGrp["null_resource.db_parameter_group<br/>(aws_db_parameter_group)"]
    SGRule["null_resource.db_sg_rule<br/>(Port 5432 Ingress)"]
    RDS["null_resource.rds_instance<br/>(aws_db_instance - PostgreSQL)"]
    ConnInfo["local_file.db_connection_info<br/>(SSM/Config JSON)"]

    SubnetGrp --> RDS
    ParamGrp --> RDS
    SGRule --> RDS
    Pass --> RDS
    ID --> RDS
    ID --> ConnInfo
```

---

## Architecture & Implementation Details

1. **Private Subnet Placement**:
   Binds to `var.subnet_ids` (supplied by the `networking` module's private subnets) to ensure zero direct public internet exposure.
2. **Dynamic Parameter Family Resolution**:
   Dynamically determines the parameter family using regex: `${var.db_engine}${regex("^\\d+", var.db_engine_version)}` (e.g. `postgres15`). Employs `create_before_destroy = true` to allow live parameter group updates.
3. **Automated Secret Generation**:
   Uses `random_password` with 24 characters and special character overrides to simulate AWS Secrets Manager password generation.
4. **VPC Ingress Protection**:
   Configures ingress rule `null_resource.db_sg_rule` to restrict database port 5432 access strictly to the VPC CIDR (`10.0.0.0/16`).

---

## Key Files & Configuration

| File | Purpose |
| :--- | :--- |
| `main.tf` | Defines DB subnet groups, parameter groups, RDS instances, and connection manifests. |
| `variables.tf` | Declares database engine, version, instance classes, subnets, and SG IDs. |
| `outputs.tf` | Exposes RDS endpoints, connection ports, and parameter group identifiers. |

### Inputs Consumed
- `subnet_ids`: Private subnets from `networking`.
- `security_group_id`: VPC security group from `networking`.
- `vpc_id`: VPC identifier from `networking`.
- `project`: Project name prefix.
- `environment`: Deployment tier environment (`dev`, `staging`, `prod`).
- `db_engine`: Database engine type (`postgres`).
- `db_engine_version`: Database engine version (e.g. `15.3`).
- `db_instance_class`: Compute and memory footprint (e.g. `db.t3.micro`).
- `subnet_ids`: Private subnet IDs from `networking`.
- `security_group_id`: VPC security group identifier from `networking`.
- `vpc_id`: Network container identifier from `networking`.
- `tags`: Common metadata tags applied across database resources.

### Exported Outputs
- `db_endpoint`: Simulated RDS connection string endpoint with port 5432.
- `db_instance_id`: Logical identifier of the synthetic RDS instance resource.
- `db_password`: Generated 24-character cryptographically random master password.
- `db_subnet_group_id`: Logical identifier of the multi-AZ DB subnet group.
- `db_parameter_group_id`: Logical identifier of the blue-green DB parameter group.

---

## Hierarchy & Reference Graph

This section connects to [Networking Module](../networking/README.md) for private subnet isolation and security group access.

```mermaid
flowchart TD
    MODULES["testdata/modules/ (All Modules)"]:::node
    NET["networking/"]:::node
    DB["database/"]:::current

    MODULES --> DB
    NET -->|private_subnet_ids & security_group_id| DB

    classDef current fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef node fill:#1e293b,stroke:#475569,stroke-width:1px,color:#f8fafc;
```
