# First source the env file
source .env

scp root@$MACHINE_IP:$DEPLOY_PATH/$SQLITE_PATH{,-wal} ./