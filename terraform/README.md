# Tripo04OS Terraform Infrastructure as Code (IaC)

Complete AWS infrastructure provisioning using Terraform for Tripo04OS platform.

## Overview

This Terraform configuration provisions complete AWS infrastructure including:
- **VPC & Networking**: Multi-AZ VPC with public/private subnets
- **Kubernetes (EKS)**: Managed Kubernetes cluster with auto-scaling
- **Database (RDS)**: Multi-AZ PostgreSQL cluster
- **Storage (S3)**: Multiple buckets for different purposes
- **CDN (CloudFront)**: Global content delivery with SSL
- **IAM**: Security roles and policies
- **Security Groups**: Network-level security rules

## Architecture

### Network Architecture

```
                    [Internet Gateway]
                            |
                    [Public Subnets]
                    /      |      \
              [NAT Gateway]    [EKS Control Plane]
                            |
                   [Private Subnets]
                    /     |     \
               [EKS Nodes]  [RDS Database]  [Kubernetes Services]
```

### AWS Resources

**VPC Components:**
- VPC (10.0.0.0/16)
- 3 Public Subnets (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24)
- 3 Private Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- Internet Gateway
- NAT Gateway (in 1 AZ)
- Route Tables (public & private)

**Compute:**
- EKS Cluster (Kubernetes 1.28)
- Managed Node Group (t3.medium, t3.large)
- Auto-scaling: 3-10 nodes
- Cluster Autoscaler enabled

**Database:**
- Amazon RDS PostgreSQL 15.4
- Multi-AZ deployment (2 instances)
- 100GB allocated storage
- db.r6g.large instance class

**Storage:**
- 4 S3 buckets:
  - app-assets (private, versioned)
  - user-uploads (private, versioned)
  - logs (log-delivery-write)
  - backups (private)

**CDN:**
- CloudFront distribution
- ACM SSL certificates
- Route53 DNS records
- Origin access control

## Directory Structure

```
terraform/
├── main.tf              # Root configuration
├── variables.tf          # Input variables
├── outputs.tf            # Output values
└── modules/
    ├── vpc/              # VPC & networking module
    │   ├── main.tf
    │   └── variables.tf
    ├── eks/              # EKS cluster module
    │   ├── main.tf
    │   └── variables.tf
    ├── database/         # RDS database module
    │   ├── main.tf
    │   └── variables.tf
    ├── storage/           # S3 storage module
    │   ├── main.tf
    │   └── variables.tf
    └── cdn/               # CloudFront CDN module
        ├── main.tf
        └── variables.tf
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform 1.0+ installed
- Docker installed (for building images)
- kubectl installed
- Route53 domain configured (optional)

## Installation

### Install Terraform

```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
unzip terraform_1.5.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installation
terraform version
```

### Configure AWS CLI

```bash
aws configure
# Enter your AWS credentials and region
```

## Configuration

### Update Variables

Edit `variables.tf` to customize your deployment:

```hcl
variable "project_name" {
  default = "tripo04os"
}

variable "environment" {
  default = "production"
}

variable "aws_region" {
  default = "us-east-1"
}

variable "eks_cluster_name" {
  default = "tripo04os-cluster"
}

variable "domain_name" {
  default = "tripo04os.com"
}

variable "domain_subdomains" {
  default = ["api", "web", "admin"]
}
```

### Environment Variables

Create a `terraform.tfvars` file:

```hcl
aws_region                = "us-east-1"
environment              = "production"
eks_cluster_name         = "tripo04os-cluster"
eks_cluster_version      = "1.28"
eks_node_group_min_size  = 3
eks_node_group_max_size  = 10
eks_node_group_desired_size = 3
eks_node_instance_types   = ["t3.medium", "t3.large"]
database_allocated_storage = 100
enable_domain_ssl        = true
```

## Usage

### Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads providers and initializes the backend.

### Plan Changes

```bash
terraform plan
```

Review the planned changes before applying.

### Apply Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This will create all AWS resources.

### Destroy Infrastructure

```bash
terraform destroy
```

## Workflows

### Initial Deployment

```bash
# 1. Initialize
terraform init

# 2. Review plan
terraform plan -out=tfplan

# 3. Apply infrastructure
terraform apply tfplan

# 4. Wait for EKS cluster creation (~15-20 minutes)

# 5. Update kubeconfig
aws eks update-kubeconfig --name tripo04os-cluster --region us-east-1

# 6. Verify cluster
kubectl get nodes
```

### Update Infrastructure

```bash
# 1. Modify configuration
# Edit variables.tf or other files

# 2. Review changes
terraform plan

# 3. Apply changes
terraform apply
```

### Scale EKS Nodes

```bash
# Via Terraform variables
eks_node_group_desired_size = 5
eks_node_group_min_size = 3
eks_node_group_max_size = 15

terraform apply

# Or via kubectl
kubectl autoscale deployment --min=3 --max=15 --cpu-percent=70
```

## Module Usage

### VPC Module

Provisions VPC, subnets, and networking:

```hcl
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = "tripo04os-prod"
  vpc_cidr           = "10.0.0.0/16"
  availability_zones    = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnet_cidrs  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
}
```

### EKS Module

Provisions Kubernetes cluster:

```hcl
module "eks" {
  source = "./modules/eks"

  cluster_name    = "tripo04os-cluster"
  cluster_version = "1.28"

  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  node_group_config = {
    min_size     = 3
    max_size     = 10
    desired_size = 3
    instance_types = ["t3.medium", "t3.large"]
  }
}
```

### Database Module

Provisions PostgreSQL database:

```hcl
module "database" {
  source = "./modules/database"

  name_prefix     = "tripo04os-prod"

  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.r6g.large"
  allocated_storage = 100
  username          = "tripo04os_admin"

  security_group_ids = [module.eks.cluster_security_group_id]
}
```

### Storage Module

Provisions S3 buckets:

```hcl
module "storage" {
  source = "./modules/storage"

  name_prefix = "tripo04os-prod"

  buckets = [
    { name = "app-assets", acl = "private", versioning = true },
    { name = "user-uploads", acl = "private", versioning = true },
    { name = "logs", acl = "log-delivery-write", versioning = false },
    { name = "backups", acl = "private", versioning = false },
  ]
}
```

### CDN Module

Provisions CloudFront CDN:

```hcl
module "cdn" {
  source = "./modules/cdn"

  name_prefix = "tripo04os-prod"
  domain_name = "tripo04os.com"

  subdomains = ["api", "web", "admin"]

  s3_buckets = module.storage.bucket_arns
  security_group_ids = [module.eks.cluster_security_group_id]

  enable_ssl = true
}
```

## Outputs

After successful deployment, Terraform outputs important values:

```bash
terraform output
```

Key outputs:
- `vpc_id`: VPC ID
- `vpc_cidr`: VPC CIDR block
- `private_subnet_ids`: Private subnet IDs
- `public_subnet_ids`: Public subnet IDs
- `eks_cluster_endpoint`: EKS API endpoint
- `eks_cluster_name`: Kubernetes cluster name
- `eks_cluster_ca_certificate`: Cluster CA certificate
- `rds_instance_endpoint`: Database endpoint
- `rds_instance_port`: Database port
- `s3_bucket_names`: S3 bucket names
- `cloudfront_distribution_id`: CloudFront distribution ID
- `cloudfront_domain_name`: CloudFront domain name

## Security

### IAM Roles

**EKS Cluster Role:**
- AmazonEKSClusterPolicy attached

**EKS Node Role:**
- AmazonEKSWorkerNodePolicy attached
- AmazonEC2ContainerRegistryReadOnly attached
- AmazonEKS_CNI_Policy attached

### Security Groups

**EKS Cluster Security Group:**
- Ingress: TCP 443 from 0.0.0.0/0
- Egress: All traffic

**EKS Nodes Security Group:**
- Ingress: TCP 1025-65535 from cluster SG
- Ingress: TCP 443 from 0.0.0.0/0
- Egress: All traffic

**RDS Security Group:**
- Ingress: TCP 5432 from EKS cluster SG
- Egress: All traffic

### Best Practices

1. **Least Privilege:** IAM roles have minimal required permissions
2. **Network Isolation:** Private subnets for database and nodes
3. **Encryption:** S3 buckets use AES256 encryption
4. **SSL/TLS:** All services use TLS certificates
5. **Access Control:** Security groups restrict network access

## Cost Estimation

**Estimated Monthly Costs (us-east-1):**

| Resource | Quantity | Unit Cost | Monthly |
|----------|----------|-----------|---------|
| EKS Cluster | 1 | $0.10/hour | $73 |
| EC2 Instances (t3.medium) | 3 | $0.0416/hour | $90 |
| EC2 Instances (t3.large) | 0 | $0.0832/hour | $0 |
| NAT Gateway | 1 | $0.045/hour | $33 |
| EIPs | 1 | $0.005/hour | $4 |
| RDS (db.r6g.large) | 2 | $0.529/hour | $769 |
| RDS Storage (100GB) | 1 | $0.115/GB | $12 |
| S3 Storage | 100GB | $0.023/GB | $2 |
| S3 Requests | 10M | $4.50/M | $45 |
| CloudFront | 1TB | $0.085/GB | $85 |
| Route53 | 1 zone | $0.50/hosted zone | $1 |

**Total Estimated: ~$1,114/month**

## Troubleshooting

### Terraform State Lock

If state is locked:

```bash
# List locks
aws dynamodb scan --table-name tripo04os-terraform-locks

# Remove lock manually (last resort)
aws dynamodb delete-item --table-name tripo04os-terraform-locks '{"LockID":{"S":"terraform-STATE"}}'
```

### EKS Cluster Not Creating

```bash
# Check CloudFormation stacks
aws cloudformation list-stacks --region us-east-1 | grep tripo04os

# Check stack events
aws cloudformation describe-stack-events \
  --stack-name eksctl-tripo04os-cluster-cluster \
  --region us-east-1
```

### DNS Not Propagating

```bash
# Check ACM certificate status
aws acm list-certificates --region us-east-1

# Check Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --start-record-name tripo04os.com \
  --start-type A
```

### S3 Bucket Access Issues

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket BUCKET_NAME

# Check bucket ACL
aws s3api get-bucket-acl --bucket BUCKET_NAME
```

## Maintenance

### Terraform State Management

```bash
# Pull latest state
terraform pull

# Push state
terraform push

# Refresh state
terraform refresh

# State migration
terraform state mv RESOURCE_ID NEW_RESOURCE_ID
```

### Backup Terraform State

```bash
# Backup S3 state
aws s3 sync s3://tripo04os-terraform-state ./terraform-backup
```

### Update Kubernetes Version

```bash
# Update variable
eks_cluster_version = "1.29"

# Apply changes
terraform apply

# Wait for cluster update
kubectl get nodes
```

## Best Practices

1. **Always Plan Before Apply**
   ```bash
   terraform plan -out=tfplan
   terraform apply tfplan
   ```

2. **Use Terraform Workspaces**
   ```bash
   terraform workspace new staging
   terraform workspace new production
   ```

3. **Version Control Terraform Files**
   ```bash
   git add .
   git commit -m "Infrastructure changes"
   git push
   ```

4. **Use Consistent Naming**
   - Prefix all resources with project name
   - Include environment in names
   - Use descriptive suffixes

5. **Tag All Resources**
   - Project name
   - Environment
   - Owner
   - Cost center

6. **State Management**
   - Use remote backend (S3 + DynamoDB)
   - Never commit state files
   - Use state locking in teams

7. **Security**
   - Rotate access keys regularly
   - Use MFA for AWS console
   - Enable CloudTrail logging

8. **Cost Optimization**
   - Use spot instances for workloads
   - Enable auto-scaling
   - Monitor and cleanup unused resources

## Monitoring

### CloudWatch Metrics

Key metrics to monitor:
- EKS Cluster CPU/Memory utilization
- RDS Database connections and CPU
- NAT Gateway data transfer
- S3 request rates and 4xx/5xx errors
- CloudFront cache hit ratio

### Alerts

Set up CloudWatch alarms:
- EKS node CPU > 80% for 5 minutes
- RDS CPU > 90% for 5 minutes
- RDS free storage < 20%
- API Gateway 5xx errors > 1% for 5 minutes
- ELB unhealthy hosts > 1

## Disaster Recovery

### Backup Strategy

1. **Terraform State:** Automated S3 versioning
2. **Database:** Daily automated backups (7-day retention)
3. **EKS Cluster:** EKS-managed control plane
4. **S3 Buckets:** Versioning enabled, cross-region replication

### Recovery Procedures

```bash
# Restore Terraform state
aws s3 cp s3://tripo04os-terraform-state/terraform.tfstate ./terraform.tfstate

# Restore RDS from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier tripo04os-prod-cluster \
  --db-snapshot-identifier SNAPSHOT_ID
```

## Contributing

When modifying infrastructure:

1. Update Terraform files in feature branch
2. Test in staging environment
3. Submit pull request
4. Get approval before merging to production

## Support

For infrastructure issues:
- Check Terraform logs
- Check AWS CloudFormation console
- Review CloudWatch metrics
- Consult AWS documentation

## License

Proprietary - Tripo04OS Internal Use Only

---

**End of Documentation**
