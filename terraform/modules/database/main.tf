resource "aws_db_subnet_group" "this" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "database" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rds-sg"
    }
  )

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "ingress_from_eks" {
  for_each             = var.security_group_ids
  security_group_id    = aws_security_group.database.id
  type                 = "ingress"
  from_port            = 5432
  to_port              = 5432
  protocol             = "tcp"
  source_security_group_id = aws_security_group_rule.ingress_from_eks.each.value
}

resource "aws_rds_cluster" "this" {
  cluster_identifier      = "${var.name_prefix}-cluster"
  engine                  = var.engine
  engine_version          = var.engine_version
  database_name           = "tripo04os"
  master_username         = var.username
  port                    = 5432

  db_cluster_instance_class = var.instance_class

  allocated_storage       = var.allocated_storage
  storage_type            = "gp3"
  iops                    = 3000
  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"

  final_snapshot_identifier = false
  skip_final_snapshot       = true
  deletion_protection      = true

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids   = [aws_security_group.database.id]

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-cluster"
    }
  )

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      skip_final_snapshot
    ]
  }

  depends_on = [
    aws_security_group_rule.ingress_from_eks
  ]
}

resource "aws_rds_cluster_instance" "this" {
  count              = 2
  identifier         = "${var.name_prefix}-${count.index}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = var.instance_class
  publicly_accessible = false

  performance_insights_enabled = true
  monitoring_interval         = 60

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${count.index}"
    }
  )
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_rds_cluster.this.endpoint
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = aws_rds_cluster.this.port
}

output "rds_cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.this.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.database.id
}
