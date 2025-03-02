#!/bin/bash

if [ $UID != 0 ]; then
	sudo $0
	exit
fi

umount boot 2>/dev/null
umount fs 2>/dev/null
umount /mnt/boot/firmware
umount /mnt/fs

IMG="./data/spr.img"
LOOP=$(losetup -j $IMG | cut -d: -f1)

# shrink back img
e2fsck -f ${LOOP}p2
resize2fs ${LOOP}p2 7G

losetup -d $LOOP 2>/dev/null
truncate -s 8G $IMG
