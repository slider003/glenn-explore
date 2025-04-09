#!/bin/bash
set -e


# Source and validate environment variables
source .env
ssh root@$MACHINE_IP