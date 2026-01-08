# Infrastructure Setup - Provision Cloud Accounts

## Document Information

| Field | Value |
|-------|-------|
| **Document Title** | Infrastructure Setup - Provision Cloud Accounts |
| **Version** | 1.0 |
| **Date** | 2026-01-06 |
| **Status** | Draft |
| **Author** | Kilo Code |
| **Project** | Tripo04OS Phase 1 Implementation |
| **Cloud Provider** | AWS (Amazon Web Services) |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [AWS Account Setup](#aws-account-setup)
4. [IAM Configuration](#iam-configuration)
5. [VPC and Networking](#vpc-and-networking)
6. [S3 Buckets](#s3-buckets)
7. [ECR Repositories](#ecr-repositories)
8. [Validation](#validation)

---

## 1. Overview

### 1.1 Purpose

This document provides step-by-step instructions for provisioning AWS cloud accounts for the Tripo04OS platform, including:

- AWS account setup and configuration
- IAM (Identity and Access Management) setup
- VPC (Virtual Private Cloud) and networking configuration
- S3 (Simple Storage Service) bucket creation
- ECR (Elastic Container Registry) repository setup

### 1.2 Scope

This guide covers provisioning for the following services:

- AI Support Service
- Premium Driver Matching Service
- Profit Optimization Engine
- Dashboard API
- PostgreSQL Database
- Redis Cache
- Elasticsearch
- Prometheus
- Grafana

### 1.3 Security Considerations

- All resources will be deployed in a dedicated VPC
- IAM roles will follow least privilege principle
- All data will be encrypted at rest and in transit
- Audit logging will be enabled for all resources
- Security groups will restrict access to minimum required

---

## 2. Prerequisites

### 2.1 Required Accounts and Access

- **AWS Account**: Active AWS account with root access
- **AWS CLI**: Installed and configured (version 2.x+)
- **Terraform**: Installed (version 1.5+)
- **kubectl**: Installed (version 1.27+)
- **git**: Installed and configured

### 2.2 Required Information

- **AWS Account ID**: 12-digit AWS account ID
- **AWS Region**: Primary region for deployment (e.g., us-east-1)
- **Domain Name**: Registered domain for the platform
- **SSL Certificates**: SSL certificates for domain (or use ACM)

### 2.3 Installation Verification

```bash
# Verify AWS CLI
aws --version

# Verify Terraform
terraform --version

# Verify kubectl
kubectl version --client

# Verify git
git --version
```

---

## 3. AWS Account Setup

### 3.1 Create AWS Organization Structure

#### 3.1.1 Create Management Account

```bash
# Create management account (if not already exists)
# This is done through AWS Organizations console

# Verify organization
aws organizations describe-organization
```

#### 3.1.2 Create Production Account

```bash
# Create production account
aws organizations create-account \
  --email prod@tripo04os.com \
  --account-name "Tripo04OS Production" \
  --iam-user-access-to-billing ALLOWED
```

#### 3.1.3 Create Staging Account

```bash
# Create staging account
aws organizations create-account \
  --email staging@tripo04os.com \
  --account-name "Tripo04OS Staging" \
  --iam-user-access-to-billing ALLOWED
```

#### 3.1.4 Create Development Account

```bash
# Create development account
aws organizations create-account \
  --email dev@tripo04os.com \
  --account-name "Tripo04OS Development" \
  --iam-user-access-to-billing ALLOWED
```

### 3.2 Configure Organizational Units (OUs)

```bash
# Create OUs
aws organizations create-organizational-unit \
  --parent-id <root-id> \
  --name "Production"

aws organizations create-organizational-unit \
  --parent-id <root-id> \
  --name "Non-Production"

# Move accounts to OUs
aws organizations move-account \
  --account-id <prod-account-id> \
  --source-parent-id <root-id> \
  --destination-parent-id <prod-ou-id>

aws organizations move-account \
  --account-id <staging-account-id> \
  --source-parent-id <root-id> \
  --destination-parent-id <non-prod-ou-id>

aws organizations move-account \
  --account-id <dev-account-id> \
  --source-parent-id <root-id> \
  --destination-parent-id <non-prod-ou-id>
```

### 3.3 Enable AWS Services

#### 3.3.1 Enable CloudTrail

```bash
# Create CloudTrail
aws cloudtrail create-trail \
  --name tripo04os-cloudtrail \
  --s3-bucket-name tripo04os-cloudtrail-logs \
  --include-global-service-events \
  --is-multi-region-trail

# Enable logging
aws cloudtrail start-logging \
  --name tripo04os-cloudtrail
```

#### 3.3.2 Enable Config

```bash
# Create Config recorder
aws configservice put-configuration-recorder \
  --configuration-recorder '{"name":"tripo04os-config-recorder","roleARN":"arn:aws:iam::<account-id>:role/ConfigRecorderRole"}'

# Create delivery channel
aws configservice put-delivery-channel \
  --delivery-channel '{"name":"tripo04os-delivery-channel","s3BucketName":"tripo04os-config-logs"}'
```

#### 3.3.3 Enable GuardDuty

```bash
# Enable GuardDuty
aws guardduty create-detector \
  --enable

# Create CloudWatch alarms for GuardDuty findings
aws cloudwatch put-metric-alarm \
  --alarm-name guardduty-findings \
  --metric-name Finding \
  --namespace AWS/GuardDuty \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold
```

### 3.4 Configure Billing

```bash
# Enable detailed billing
aws billing put-detailed-billing-preferences \
  --detailed-billing-preferences DetailedBillingEnabled=true

# Enable cost allocation tags
aws billing put-cost-allocation-tag \
  --tag-key Environment \
  --tag-key Service \
  --tag-key Owner

# Set up billing alarms
aws cloudwatch put-metric-alarm \
  --alarm-name billing-alarm \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold
```

---

## 4. IAM Configuration

### 4.1 Create IAM Roles

#### 4.1.1 Create EKS Cluster Role

```bash
# Create trust policy
cat > eks-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name tripo04os-eks-cluster-role \
  --assume-role-policy-document file://eks-trust-policy.json

# Attach AmazonEKSClusterPolicy
aws iam attach-role-policy \
  --role-name tripo04os-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

# Attach AmazonEKSVPCResourceController
aws iam attach-role-policy \
  --role-name tripo04os-eks-cluster-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSVPCResourceController
```

#### 4.1.2 Create EKS Node Role

```bash
# Create trust policy
cat > node-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name tripo04os-eks-node-role \
  --assume-role-policy-document file://node-trust-policy.json

# Attach AmazonEKSWorkerNodePolicy
aws iam attach-role-policy \
  --role-name tripo04os-eks-node-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

# Attach AmazonEC2ContainerRegistryReadOnly
aws iam attach-role-policy \
  --role-name tripo04os-eks-node-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Attach AmazonEKS_CNI_Policy
aws iam attach-role-policy \
  --role-name tripo04os-eks-node-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
```

#### 4.1.3 Create Service Roles

```bash
# Create AI Support service role
cat > ai-support-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name tripo04os-ai-support-role \
  --assume-role-policy-document file://ai-support-trust-policy.json

# Attach basic execution role
aws iam attach-role-policy \
  --role-name tripo04os-ai-support-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### 4.2 Create IAM Policies

#### 4.2.1 Create Database Access Policy

```bash
cat > database-access-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:Describe*",
        "rds:Connect"
      ],
      "Resource": "arn:aws:rds:<region>:<account-id>:db:*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name tripo04os-database-access \
  --policy-document file://database-access-policy.json
```

#### 4.2.2 Create S3 Access Policy

```bash
cat > s3-access-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::tripo04os-*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name tripo04os-s3-access \
  --policy-document file://s3-access-policy.json
```

### 4.3 Create IAM Users

#### 4.3.1 Create Admin User

```bash
# Create user
aws iam create-user --user-name tripo04os-admin

# Create access key
aws iam create-access-key --user-name tripo04os-admin

# Attach admin policy
aws iam attach-user-policy \
  --user-name tripo04os-admin \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Enable MFA
aws iam enable-mfa-device \
  --user-name tripo04os-admin \
  --serial-number <mfa-serial> \
  --authentication-code-1 <code-1> \
  --authentication-code-2 <code-2>
```

#### 4.3.2 Create Service Account User

```bash
# Create user for CI/CD
aws iam create-user --user-name tripo04os-cicd

# Create access key
aws iam create-access-key --user-name tripo04os-cicd

# Attach service policies
aws iam attach-user-policy \
  --user-name tripo04os-cicd \
  --policy-arn arn:aws:iam::<account-id>:policy/tripo04os-database-access

aws iam attach-user-policy \
  --user-name tripo04os-cicd \
  --policy-arn arn:aws:iam::<account-id>:policy/tripo04os-s3-access
```

---

## 5. VPC and Networking

### 5.1 Create VPC

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=tripo04os-vpc},{Key=Environment,Value=production}]' \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"
```

### 5.2 Create Subnets

#### 5.2.1 Create Public Subnets

```bash
# Create public subnet in us-east-1a
PUBLIC_SUBNET_1A=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tripo04os-public-1a},{Key=Type,Value=public}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Create public subnet in us-east-1b
PUBLIC_SUBNET_1B=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tripo04os-public-1b},{Key=Type,Value=public}]' \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Public Subnet 1A: $PUBLIC_SUBNET_1A"
echo "Public Subnet 1B: $PUBLIC_SUBNET_1B"
```

#### 5.2.2 Create Private Subnets

```bash
# Create private subnet in us-east-1a
PRIVATE_SUBNET_1A=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tripo04os-private-1a},{Key=Type,Value=private}]' \
  --query 'Subnet.SubnetId' \
  --output text)

# Create private subnet in us-east-1b
PRIVATE_SUBNET_1B=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.4.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=tripo04os-private-1b},{Key=Type,Value=private}]' \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Private Subnet 1A: $PRIVATE_SUBNET_1A"
echo "Private Subnet 1B: $PRIVATE_SUBNET_1B"
```

### 5.3 Create Internet Gateway

```bash
# Create internet gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=tripo04os-igw}]' \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID

echo "Internet Gateway ID: $IGW_ID"
```

### 5.4 Create NAT Gateway

```bash
# Allocate Elastic IP
EIP_ID=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'AllocationId' \
  --output text)

# Create NAT gateway
NAT_ID=$(aws ec2 create-nat-gateway \
  --subnet-id $PUBLIC_SUBNET_1A \
  --allocation-id $EIP_ID \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=tripo04os-nat}]' \
  --query 'NatGateway.NatGatewayId' \
  --output text)

echo "NAT Gateway ID: $NAT_ID"
```

### 5.5 Create Route Tables

#### 5.5.1 Create Public Route Table

```bash
# Create public route table
PUBLIC_RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=tripo04os-public-rt},{Key=Type,Value=public}]' \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to internet gateway
aws ec2 create-route \
  --route-table-id $PUBLIC_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate with public subnets
aws ec2 associate-route-table \
  --route-table-id $PUBLIC_RT_ID \
  --subnet-id $PUBLIC_SUBNET_1A

aws ec2 associate-route-table \
  --route-table-id $PUBLIC_RT_ID \
  --subnet-id $PUBLIC_SUBNET_1B

echo "Public Route Table ID: $PUBLIC_RT_ID"
```

#### 5.5.2 Create Private Route Table

```bash
# Create private route table
PRIVATE_RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=tripo04os-private-rt},{Key=Type,Value=private}]' \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to NAT gateway
aws ec2 create-route \
  --route-table-id $PRIVATE_RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id $NAT_ID

# Associate with private subnets
aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_ID \
  --subnet-id $PRIVATE_SUBNET_1A

aws ec2 associate-route-table \
  --route-table-id $PRIVATE_RT_ID \
  --subnet-id $PRIVATE_SUBNET_1B

echo "Private Route Table ID: $PRIVATE_RT_ID"
```

### 5.6 Create Security Groups

#### 5.6.1 Create Application Security Group

```bash
# Create application security group
APP_SG_ID=$(aws ec2 create-security-group \
  --group-name tripo04os-app-sg \
  --description "Security group for application servers" \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=tripo04os-app-sg},{Key=Type,Value=application}]' \
  --query 'GroupId' \
  --output text)

# Allow HTTP from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $APP_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $APP_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow all outbound traffic
aws ec2 authorize-security-group-egress \
  --group-id $APP_SG_ID \
  --protocol -1 \
  --port -1 \
  --cidr 0.0.0.0/0

echo "Application Security Group ID: $APP_SG_ID"
```

#### 5.6.2 Create Database Security Group

```bash
# Create database security group
DB_SG_ID=$(aws ec2 create-security-group \
  --group-name tripo04os-db-sg \
  --description "Security group for database servers" \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=security-group,Tags=[{Key=Name,Value=tripo04os-db-sg},{Key=Type,Value=database}]' \
  --query 'GroupId' \
  --output text)

# Allow PostgreSQL from application security group
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-group $APP_SG_ID

# Allow Redis from application security group
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 6379 \
  --source-group $APP_SG_ID

# Allow Elasticsearch from application security group
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 9200 \
  --source-group $APP_SG_ID

echo "Database Security Group ID: $DB_SG_ID"
```

---

## 6. S3 Buckets

### 6.1 Create Application Logs Bucket

```bash
# Create logs bucket
aws s3api create-bucket \
  --bucket tripo04os-logs \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket tripo04os-logs \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket tripo04os-logs \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Set lifecycle policy
cat > logs-lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldLogs",
      "Status": "Enabled",
      "Expiration": {"Days": 90}
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket tripo04os-logs \
  --lifecycle-configuration file://logs-lifecycle.json
```

### 6.2 Create CloudTrail Logs Bucket

```bash
# Create CloudTrail bucket
aws s3api create-bucket \
  --bucket tripo04os-cloudtrail-logs \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket tripo04os-cloudtrail-logs \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket tripo04os-cloudtrail-logs \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Set bucket policy for CloudTrail
cat > cloudtrail-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AWSCloudTrailAclCheck",
      "Effect": "Allow",
      "Principal": {"Service": ["cloudtrail.amazonaws.com"]},
      "Action": "s3:GetBucketAcl",
      "Resource": "arn:aws:s3:::tripo04os-cloudtrail-logs"
    },
    {
      "Sid": "AWSCloudTrailWrite",
      "Effect": "Allow",
      "Principal": {"Service": ["cloudtrail.amazonaws.com"]},
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::tripo04os-cloudtrail-logs/AWSLogs/<account-id>/CloudTrail/*",
      "Condition": {"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}}
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket tripo04os-cloudtrail-logs \
  --policy file://cloudtrail-bucket-policy.json
```

### 6.3 Create Config Logs Bucket

```bash
# Create Config bucket
aws s3api create-bucket \
  --bucket tripo04os-config-logs \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket tripo04os-config-logs \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket tripo04os-config-logs \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### 6.4 Create Models Bucket

```bash
# Create models bucket
aws s3api create-bucket \
  --bucket tripo04os-models \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket tripo04os-models \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket tripo04os-models \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Block public access
aws s3api put-public-access-block \
  --bucket tripo04os-models \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

---

## 7. ECR Repositories

### 7.1 Create AI Support Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name tripo04os-ai-support \
  --image-tag-mutability MUTABLE \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
ECR_URI=$(aws ecr describe-repositories \
  --repository-names tripo04os-ai-support \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "AI Support ECR URI: $ECR_URI"
```

### 7.2 Create Premium Driver Matching Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name tripo04os-premium-driver-matching \
  --image-tag-mutability MUTABLE \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
ECR_URI=$(aws ecr describe-repositories \
  --repository-names tripo04os-premium-driver-matching \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "Premium Driver Matching ECR URI: $ECR_URI"
```

### 7.3 Create Profit Optimization Engine Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name tripo04os-profit-optimization-engine \
  --image-tag-mutability MUTABLE \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
ECR_URI=$(aws ecr describe-repositories \
  --repository-names tripo04os-profit-optimization-engine \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "Profit Optimization Engine ECR URI: $ECR_URI"
```

### 7.4 Create Dashboard API Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name tripo04os-dashboard-api \
  --image-tag-mutability MUTABLE \
  --image-scanning-configuration scanOnPush=true

# Get repository URI
ECR_URI=$(aws ecr describe-repositories \
  --repository-names tripo04os-dashboard-api \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "Dashboard API ECR URI: $ECR_URI"
```

---

## 8. Validation

### 8.1 Validate VPC and Networking

```bash
# List VPCs
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=tripo04os-vpc"

# List subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID"

# List route tables
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID"

# List security groups
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID"
```

### 8.2 Validate IAM Roles and Policies

```bash
# List IAM roles
aws iam list-roles --query 'Roles[?contains(RoleName, `tripo04os`)].RoleName'

# List IAM policies
aws iam list-policies --scope Local --query 'Policies[?contains(PolicyName, `tripo04os`)].PolicyName'

# List IAM users
aws iam list-users --query 'Users[?contains(UserName, `tripo04os`)].UserName'
```

### 8.3 Validate S3 Buckets

```bash
# List S3 buckets
aws s3 ls | grep tripo04os

# Check bucket versioning
aws s3api get-bucket-versioning --bucket tripo04os-logs

# Check bucket encryption
aws s3api get-bucket-encryption --bucket tripo04os-logs
```

### 8.4 Validate ECR Repositories

```bash
# List ECR repositories
aws ecr describe-repositories --query 'repositories[?contains(repositoryName, `tripo04os`)].repositoryName'

# Get repository details
aws ecr describe-repositories --repository-names tripo04os-ai-support
```

### 8.5 Validate CloudTrail

```bash
# Check CloudTrail status
aws cloudtrail get-trail-status --name tripo04os-cloudtrail

# Check CloudTrail logs
aws s3 ls s3://tripo04os-cloudtrail-logs/AWSLogs/<account-id>/CloudTrail/
```

### 8.6 Validate Config

```bash
# Check Config recorder status
aws configservice describe-configuration-recorder-status --configuration-recorder-name tripo04os-config-recorder

# Check Config delivery channel status
aws configservice describe-delivery-channel-status --delivery-channel-name tripo04os-delivery-channel
```

---

## Appendix A: Environment Variables

```bash
# AWS Configuration
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=<your-account-id>
export VPC_ID=<your-vpc-id>
export PUBLIC_SUBNET_1A=<your-public-subnet-1a>
export PUBLIC_SUBNET_1B=<your-public-subnet-1b>
export PRIVATE_SUBNET_1A=<your-private-subnet-1a>
export PRIVATE_SUBNET_1B=<your-private-subnet-1b>
export APP_SG_ID=<your-app-sg-id>
export DB_SG_ID=<your-db-sg-id>

# ECR Configuration
export ECR_REGISTRY=<account-id>.dkr.ecr.<region>.amazonaws.com
export AI_SUPPORT_REPO=tripo04os-ai-support
export PREMIUM_DRIVER_REPO=tripo04os-premium-driver-matching
export PROFIT_OPTIMIZATION_REPO=tripo04os-profit-optimization-engine
export DASHBOARD_API_REPO=tripo04os-dashboard-api

# S3 Configuration
export LOGS_BUCKET=tripo04os-logs
export CLOUDTRAIL_BUCKET=tripo04os-cloudtrail-logs
export CONFIG_BUCKET=tripo04os-config-logs
export MODELS_BUCKET=tripo04os-models
```

---

## Appendix B: Troubleshooting

### Common Issues and Solutions

#### Issue: VPC Creation Fails

**Solution**: Verify CIDR block doesn't overlap with existing VPCs
```bash
aws ec2 describe-vpcs --query 'Vpcs[].CidrBlock'
```

#### Issue: IAM Role Creation Fails

**Solution**: Verify trust policy JSON is valid
```bash
cat eks-trust-policy.json | jq .
```

#### Issue: Subnet Creation Fails

**Solution**: Verify CIDR block is within VPC CIDR
```bash
# VPC CIDR: 10.0.0.0/16
# Valid subnet CIDRs: 10.0.0.0/24, 10.0.1.0/24, etc.
```

#### Issue: Security Group Rule Fails

**Solution**: Verify CIDR block and port are valid
```bash
# Valid CIDR: 0.0.0.0/0 (anywhere)
# Valid ports: 1-65535
```

---

**Document End**
