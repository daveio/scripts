#! env fish
for i in meta/conf/wireguard-ipv4-51820/*
  python mullvad wireguard $i -l (python mullvad portgen run) | tee -a script
end
