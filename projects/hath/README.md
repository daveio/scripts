# ghcr.io/daveio/hath

![GitHub release (latest by date)](https://img.shields.io/github/v/release/daveio/hath)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/daveio/hath/container.yaml?branch=main&label=build)
![GitHub license](https://img.shields.io/github/license/daveio/hath)

## Usage

```bash
docker run \
  --name hath \
  --user 1000:1000 \
  -v hathCache:/hath/cache \
  -v hathData:/hath/data \
  -v hathDownload:/hath/download \
  -v hathLog:/hath/log \
  -v hathTmp:/hath/tmp \
  -e HATH_CLIENT_ID=YOUR_HATH_CLIENT_ID \
  -e HATH_CLIENT_KEY=YOUR_HATH_CLIENT_KEY \
  -e UMASK=000 \
  -e TZ=Europe/London \
  -p 443/tcp \
  ghcr.io/daveio/hath:latest
```

(Check the release badge above for the latest version-specific tag if you prefer not to use `:latest`.)

### Volume Mounts Explained

The `-v` flags in the `docker run` command map directories from your host machine into the container. This is crucial for persistent data storage and configuration:

-  `hathCache:/hath/cache`: Stores cached data for Hentai@Home.
-  `hathData:/hath/data`: Contains essential data files for the application.
-  `hathDownload:/hath/download`: Used for downloaded content.
-  `hathLog:/hath/log`: Stores application logs.
-  `hathTmp:/hath/tmp`: Used for temporary files.

You can replace `hathCache`, `hathData`, etc., with specific paths on your host system if you prefer named volumes over Docker-managed volumes (e.g., `/path/on/your/host/cache:/hath/cache`).

### Client Credentials

-  `HATH_CLIENT_ID`: Your personal Hentai@Home client ID.
-  `HATH_CLIENT_KEY`: Your personal Hentai@Home client key.

These credentials are required for the application to connect to the Hentai@Home network. You should obtain these from your Hentai@Home account/settings.

If bridge neteworking doesn't work on your Docker host for some reason, try `--net host`.

## Configuration

The Hentai@Home Docker image uses several environment variables to customize its operation. These are passed using the `-e` flag in the `docker run` command.

-  `HATH_CLIENT_ID=YOUR_HATH_CLIENT_ID`
   -  **Purpose:** Your personal Hentai@Home client ID.
   -  **Required:** Yes.
   -  **Details:** Obtain this from your Hentai@Home account settings.

-  `HATH_CLIENT_KEY=YOUR_HATH_CLIENT_KEY`
   -  **Purpose:** Your personal Hentai@Home client key.
   -  **Required:** Yes.
   -  **Details:** Obtain this from your Hentai@Home account settings.

-  `UMASK=000`
   -  **Purpose:** Sets the umask for files created by the application within the container. A value of `000` is permissive; adjust as needed for your security requirements (e.g., `022`).
   -  **Default:** The example shows `000`. The application's default might vary if not set.

-  `TZ=Europe/London`
   -  **Purpose:** Sets the timezone for the container.
   -  **Default:** The example shows `Europe/London`.
   -  **Details:** Use a valid TZ database name (e.g., `America/New_York`, `Etc/UTC`).

## Building from Source

If you prefer to build the Docker image yourself, you can do so using the provided Dockerfile.

1.  **Clone the repository (if you haven't already):**

    ```bash
    git clone https://github.com/daveio/hath.git
    cd hath
    ```

2.  **Build the image:**

    ```bash
    docker build . -t ghcr.io/daveio/hath:custom
    ```

    You can replace `ghcr.io/daveio/hath:custom` with any tag you prefer. The `HATH_VERSION` build argument is defined in the Dockerfile and can be overridden during the build if needed:

    ```bash
    docker build . --build-arg HATH_VERSION=vx.y.z -t ghcr.io/daveio/hath:vx.y.z
    ```

    (Note: The workflow now uses the Git tag for `HATH_VERSION` when building for releases.)

For more details on the build process, see the [Dockerfile](Dockerfile).

## Provenance and Security

This project aims to provide secure and verifiable Docker images.

-  **GHCR Publishing:** Images are published to the GitHub Container Registry (GHCR) at `ghcr.io/daveio/hath`.
-  **Automated Builds:** Images are built automatically via GitHub Actions. You can inspect the [build workflow](.github/workflows/container.yaml).
-  **SLSA Provenance and SBOM:** The build process generates SLSA Level 3 provenance attestations and SBOM (Software Bill of Materials) attestations. These provide verifiable information about the build process and the components included in the image, enhancing supply chain security. These attestations are attached to the images pushed to GHCR.
