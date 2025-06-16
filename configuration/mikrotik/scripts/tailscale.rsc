/container config
set registry-url=https://ghcr.io tmpdir=nvme1/container/tmp

/container mounts
add dst=/ts name=tailscale_state src=/nvme1/container/tailscale/mount

/container envs
add key=TS_AUTH_KEY name=tailscale value=tskey-auth-xxx
add key=TS_ROUTES name=tailscale value=10.0.0.0/24
add key=TS_ACCEPT_DNS name=tailscale value=true
add key=TS_EXTRA_ARGS name=tailscale value=--advertise-exit-node
add key=PATH name=tailscale value=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
add key=TS_AUTH_ONCE name=tailscale value=true
add key=TS_STATE_DIR name=tailscale value=/ts/
add key=TS_USERSPACE name=tailscale value=true

/container
add dns=8.8.4.4,8.8.8.8 envlist=tailscale hostname=mtts interface=veth1 logging=yes mounts=tailscale_state root-dir=nvme1/container/tailscale/root start-on-boot=yes remote-image=tailscale/tailscale:latest
