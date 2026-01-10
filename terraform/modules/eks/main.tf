data "aws_iam_policy_document" "eks_cluster_policy" {
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Effect = "Allow"
      }
    ]
  })
}

resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = data.aws_iam_policy_document.eks_cluster_policy.json

  tags = var.cluster_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids = concat(var.private_subnet_ids, var.public_subnet_ids)
    security_group_ids = [
      aws_security_group.eks_cluster.id
    ]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster
  ]

  tags = var.cluster_tags
}

resource "aws_security_group" "eks_cluster" {
  name        = "${var.cluster_name}-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = var.vpc_id

  tags = var.cluster_tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_iam_policy_document" "eks_node_policy" {
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Effect = "Allow"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceTypes"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role" "eks_nodes" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = data.aws_iam_policy_document.eks_node_policy.json

  tags = var.node_group_tags
}

resource "aws_iam_role_policy_attachment" "eks_nodes_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_nodes_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_nodes_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.node_group_config.desired_size
    max_size     = var.node_group_config.max_size
    min_size     = var.node_group_config.min_size
  }

  instance_types = var.node_group_config.instance_types

  labels = merge(var.node_group_tags, {
    role = "worker"
  })

  taint {
    key    = "workload"
    value  = "general"
    effect = "NO_SCHEDULE"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_nodes_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks_nodes_AmazonEC2ContainerRegistryReadOnly,
    aws_iam_role_policy_attachment.eks_nodes_AmazonEKS_CNI_Policy
  ]

  tags = var.node_group_tags
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = aws_eks_cluster.this.name
}

output "cluster_ca_certificate" {
  description     = "Base64 encoded certificate data required to communicate with cluster"
  value          = aws_eks_cluster.this.certificate_authority[0].data
  sensitive       = true
}

output "cluster_security_group_id" {
  description = "Security group ID attached to EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "node_role_arn" {
  description = "IAM role ARN for nodes"
  value       = aws_iam_role.eks_nodes.arn
}

output "node_group_id" {
  description = "Node group ID"
  value       = aws_eks_node_group.this.id
}
