#!/usr/bin/env bash
set -e
set -u

DISTRIBUTION=E3V8T5P3TP365Y
BUCKET=demo-agent.identity.com
STAGE=dev

deploy-aws-s3-cloudfront --non-interactive --react --bucket ${BUCKET} --destination ${STAGE} --distribution ${DISTRIBUTION}

