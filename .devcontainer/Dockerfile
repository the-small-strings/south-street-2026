FROM mcr.microsoft.com/devcontainers/python:2-3.13-bookworm

# Temp: GPG error: https://dl.yarnpkg.com/debian stable InRelease: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 62D54FD4003F6525
RUN rm -f /etc/apt/sources.list.d/yarn.list
