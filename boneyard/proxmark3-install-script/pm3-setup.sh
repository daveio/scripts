#!/bin/bash
# Proxmark3 setup script
# https://attacksurface.io/go/pm3
# Report bugs at https://github.com/daveio/attacksurface/issues

if grep -q "Ubuntu 14.04" /etc/issue; then
  echo "Ubuntu 14.04 detected, continuing"
else
  echo "This script is only tested on Ubuntu 14.04, aborting"
  exit 1
fi

if [[ -d "${HOME}"/src/proxmark3-iceman ]]; then
  echo "~/src/proxmark3-iceman already exists, aborting"
  exit 1
else
  echo "~/src/proxmark3-iceman does not exist, continuing"
fi

echo "Installing requirements with sudo"

sudo apt-get -y install build-essential ubuntu-restricted-extras ubuntu-restricted-addons \
  p7zip git libreadline5 libreadline-dev libusb-0.1-4 libusb-dev \
  libqt4-dev perl pkg-config wget xz-utils

if [[ -d /opt/devkitpro/devkitARM ]]; then
  echo "Existing ARM development kit installation detected, skipping installation"
else
  echo "Fetching and installing ARM development kit"
  sudo mkdir -p /opt/devkitpro
  BITTINESS=$(getconf LONG_BIT)
  DLFN=$(mktemp)

  if [[ ${BITTINESS} == "64" ]]; then
    DLURL=https://attacksurface.io/f/pm3/devkitARM_r41-x86_64-linux.tar.xz
  else
    DLURL=https://attacksurface.io/f/pm3/devkitARM_r41-i686-linux.tar.xz
  fi
  wget "${DLURL}" -O "${DLFN}"
  cd /opt/devkitpro || exit
  sudo tar xf "${DLFN}"
  rm -f "${DLFN}"
  export PATH=${PATH}:/opt/devkitpro/devkitARM/bin/
  echo 'PATH=${PATH}:/opt/devkitpro/devkitARM/bin/ ' >>~/.bashrc
fi

echo "Creating ~/src if it doesn't exist"

mkdir -p "${HOME}"/src

echo "Checking out iceman1001/proxmark3 from GitHub to ~/src/proxmark3-iceman"

cd "${HOME}"/src || exit
git clone https://github.com/iceman1001/proxmark3.git proxmark3-iceman

echo "Building proxmark3 code"

cd "${HOME}"/src/proxmark3-iceman || exit
make UBUNTU_1404_QT4=1

echo "Adding ${USER} to dialout group"

sudo adduser "${USER}" dialout

echo "Excluding Proxmark from modem-manager"

TMPUDEV=$(mktemp)

echo 'ATTRS{idVendor}=="2d2d" ATTRS{idProduct}=="504d", ENV{ID_MM_DEVICE_IGNORE}="1"' >"${TMPUDEV}"
sudo mv "${TMPUDEV}" /etc/udev/rules.d/77-mm-proxmark-blacklist.rules
sudo udevadm control --reload-rules

echo "Installation complete."
echo "You may need to log out and back in so that your group membership to dialout is updated."
echo "You should also disconnect and reconnect your Proxmark if it is already connected."
echo "Check dmesg after connecting a Proxmark for the device path, probably /dev/ttyACM0"
echo "To run the client for a Proxmark connected on /dev/ttyACM0:"
echo "    cd ${HOME}/src/proxmark3-iceman/client"
echo "    ./proxmark3 /dev/ttyACM0"
echo

exit 0
