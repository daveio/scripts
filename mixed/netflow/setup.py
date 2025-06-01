#!/usr/bin/env python3
"""
ntopng + netflow2ng Docker Setup and Management Tool
A slightly sarcastic but helpful network monitoring assistant
"""

import json
import os
import shutil
import socket

# trunk-ignore(bandit/B404)
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Try to import rich for pretty UI, fall back to basic if not available
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.prompt import Confirm, Prompt
    from rich.syntax import Syntax
    from rich.table import Table

    RICH_AVAILABLE = True
    console = Console()
except ImportError:
    RICH_AVAILABLE = False
    print("📦 'rich' library not found. Install with: pip install rich")
    print("   Falling back to basic UI...\n")

# Configuration paths
SCRIPT_DIR = Path(__file__).parent.absolute()
DOCKER_COMPOSE_FILE = SCRIPT_DIR / "docker-compose.yml"
NTOPNG_CONF_FILE = SCRIPT_DIR / "ntopng.conf"
BACKUP_DIR = SCRIPT_DIR / "backups"

# Docker compose template
DOCKER_COMPOSE_TEMPLATE = """version: '3.8'

services:
  redis:
    image: redis:alpine
    container_name: ntopng-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - ntopng-network

  netflow2ng:
    image: synfinatic/netflow2ng:latest
    container_name: netflow2ng
    restart: unless-stopped
    command: [
      "--zmq-output=tcp://ntopng:5556",
      "--netflow-port=2055",
      "--metrics-addr=:9100",
      "--log-level=info"
    ]
    ports:
      - "2055:2055/udp"
      - "9100:9100"
    networks:
      - ntopng-network
    depends_on:
      - ntopng

  ntopng:
    image: ntop/ntopng:stable
    container_name: ntopng
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - ntopng_data:/var/lib/ntopng
      - ./ntopng.conf:/etc/ntopng/ntopng.conf:ro
    environment:
      - REDIS_SERVER=redis
    command: [
      "--community",
      "-i", "tcp://127.0.0.1:5556",
      "-r", "redis"
    ]
    depends_on:
      - redis

volumes:
  ntopng_data:
  redis_data:

networks:
  ntopng-network:
    driver: bridge
"""

NTOPNG_CONF_TEMPLATE = """# ntopng configuration
-G=/var/lib/ntopng/ntopng.pid
--community
--disable-autologout
--disable-login=1

# Interface settings
-i=tcp://127.0.0.1:5556

# Redis settings
--redis=redis

# Web interface
--http-port=3000

# Data retention
--max-num-flows=200000
--max-num-hosts=100000
"""

MIKROTIK_CLI_COMMANDS = """# Configure Traffic Flow
/ip traffic-flow
set enabled=yes interfaces=all cache-entries=4k \\
    active-flow-timeout=1m inactive-flow-timeout=15s

# Add the NetFlow target
/ip traffic-flow target
add dst-address={docker_host_ip} port=2055 version=9 \\
    v9-template-refresh=20 v9-template-timeout=30

# Verify your configuration
/ip traffic-flow print
/ip traffic-flow target print
"""


class SimpleUI:
    """Fallback UI when rich is not available"""

    @staticmethod
    def print(text, style=""):
        print(text)

    @staticmethod
    def print_panel(text, title=""):
        print(f"\n{'='*60}")
        if title:
            print(f" {title} ".center(60, "="))
        print(f"{'='*60}")
        print(text)
        print(f"{'='*60}\n")

    @staticmethod
    def input(prompt):
        return input(f"{prompt}: ")

    @staticmethod
    def confirm(prompt):
        response = input(f"{prompt} (y/n): ").lower()
        return response in ["y", "yes"]


class NtopngManager:
    def __init__(self):
        self.console = console if RICH_AVAILABLE else SimpleUI()
        self.setup_complete = self.check_setup_status()

    def run_command(
        self, command: List[str], capture_output: bool = True
    ) -> Tuple[int, str, str]:
        """Run a shell command and return exit code, stdout, stderr"""
        try:
            result = subprocess.run(  # trunk-ignore(bandit/B603)
                command, capture_output=capture_output, text=True, check=False
            )
            return result.returncode, result.stdout, result.stderr
        except Exception as e:
            return 1, "", str(e)

    def check_prerequisites(self) -> Dict[str, bool]:
        """Check if all prerequisites are installed"""
        checks = {
            "Docker": self.check_docker(),
            "Docker Compose": self.check_docker_compose(),
            "Port 3000": self.check_port_available(3000),
            "Port 2055": self.check_port_available(2055),
        }
        return checks

    def check_docker(self) -> bool:
        """Check if Docker is installed and running"""
        code, _, _ = self.run_command(["docker", "version"])
        return code == 0

    def check_docker_compose(self) -> bool:
        """Check if Docker Compose is installed"""
        # Try docker compose (v2)
        code, _, _ = self.run_command(["docker", "compose", "version"])
        if code == 0:
            return True
        # Try docker-compose (v1)
        code, _, _ = self.run_command(["docker-compose", "version"])
        return code == 0

    def check_port_available(self, port: int) -> bool:
        """Check if a port is available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("", port))
                return True
        except socket.error:
            return False

    def check_setup_status(self) -> bool:
        """Check if setup has been completed"""
        return DOCKER_COMPOSE_FILE.exists() and NTOPNG_CONF_FILE.exists()

    def get_docker_compose_command(self) -> List[str]:
        """Get the appropriate docker compose command"""
        # Try docker compose (v2) first
        code, _, _ = self.run_command(["docker", "compose", "version"])
        if code == 0:
            return ["docker", "compose"]
        return ["docker-compose"]

    def create_configuration_files(self):
        """Create the configuration files"""
        self.console.print(
            "\n🔧 Creating configuration files...",
            style="bold blue" if RICH_AVAILABLE else "",
        )

        # Create docker-compose.yml
        with open(DOCKER_COMPOSE_FILE, "w") as f:
            f.write(DOCKER_COMPOSE_TEMPLATE)
        self.console.print(
            "✅ Created docker-compose.yml", style="green" if RICH_AVAILABLE else ""
        )

        # Create ntopng.conf
        with open(NTOPNG_CONF_FILE, "w") as f:
            f.write(NTOPNG_CONF_TEMPLATE)
        self.console.print(
            "✅ Created ntopng.conf", style="green" if RICH_AVAILABLE else ""
        )

        # Create backup directory
        BACKUP_DIR.mkdir(exist_ok=True)
        self.console.print(
            "✅ Created backup directory", style="green" if RICH_AVAILABLE else ""
        )

    def get_container_status(self) -> Dict[str, Dict]:
        """Get status of all containers"""
        compose_cmd = self.get_docker_compose_command()
        code, stdout, _ = self.run_command(compose_cmd + ["ps", "--format", "json"])

        if code != 0:
            return {}

        try:
            # Parse JSON output
            containers = json.loads(stdout)
            return {c["Service"]: c for c in containers}
        except json.JSONDecodeError:
            # Fallback to parsing text output
            return self._parse_compose_ps_text()

    def _parse_compose_ps_text(self) -> Dict[str, Dict]:
        """Parse docker-compose ps text output (fallback)"""
        compose_cmd = self.get_docker_compose_command()
        code, stdout, _ = self.run_command(compose_cmd + ["ps"])

        if code != 0:
            return {}

        containers = {}
        lines = stdout.strip().split("\n")[1:]  # Skip header

        for line in lines:
            if line.strip():
                parts = line.split()
                if len(parts) >= 2:
                    name = parts[0]
                    status = "running" if "Up" in line else "stopped"
                    containers[name] = {"State": status}

        return containers

    def start_services(self):
        """Start Docker services"""
        compose_cmd = self.get_docker_compose_command()

        if RICH_AVAILABLE:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                task = progress.add_task("Starting services...", total=None)
                code, stdout, stderr = self.run_command(compose_cmd + ["up", "-d"])
                progress.update(task, completed=True)
        else:
            print("Starting services...")
            code, stdout, stderr = self.run_command(compose_cmd + ["up", "-d"])

        if code == 0:
            self.console.print(
                "\n✅ Services started successfully!",
                style="bold green" if RICH_AVAILABLE else "",
            )
            self.console.print(
                "\n📊 ntopng web interface: http://localhost:3000",
                style="cyan" if RICH_AVAILABLE else "",
            )
        else:
            self.console.print(
                f"\n❌ Failed to start services: {stderr}",
                style="bold red" if RICH_AVAILABLE else "",
            )

    def stop_services(self):
        """Stop Docker services"""
        compose_cmd = self.get_docker_compose_command()

        if RICH_AVAILABLE:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                task = progress.add_task("Stopping services...", total=None)
                code, stdout, stderr = self.run_command(compose_cmd + ["down"])
                progress.update(task, completed=True)
        else:
            print("Stopping services...")
            code, stdout, stderr = self.run_command(compose_cmd + ["down"])

        if code == 0:
            self.console.print(
                "\n✅ Services stopped successfully!",
                style="bold green" if RICH_AVAILABLE else "",
            )
        else:
            self.console.print(
                f"\n❌ Failed to stop services: {stderr}",
                style="bold red" if RICH_AVAILABLE else "",
            )

    def view_logs(self, service: Optional[str] = None, lines: int = 50):
        """View logs from services"""
        compose_cmd = self.get_docker_compose_command()

        cmd = compose_cmd + ["logs", "--tail", str(lines)]
        if service:
            cmd.append(service)

        code, stdout, stderr = self.run_command(cmd)

        if code == 0:
            if RICH_AVAILABLE:
                self.console.print(
                    Panel(
                        stdout,
                        title=f"Logs {f'({service})' if service else '(all services)'}",
                        expand=False,
                    )
                )
            else:
                self.console.print_panel(
                    stdout, f"Logs {f'({service})' if service else '(all services)'}"
                )
        else:
            self.console.print(
                f"❌ Failed to get logs: {stderr}",
                style="bold red" if RICH_AVAILABLE else "",
            )

    def check_netflow_traffic(self):
        """Check if NetFlow traffic is being received"""
        self.console.print(
            "\n🔍 Checking NetFlow traffic...",
            style="bold blue" if RICH_AVAILABLE else "",
        )

        # Check netflow2ng logs for received packets
        code, stdout, _ = self.run_command(
            ["docker", "logs", "--tail", "20", "netflow2ng"]
        )

        if code == 0:
            if "Received" in stdout or "netflow" in stdout.lower():
                self.console.print(
                    "✅ NetFlow packets are being received!",
                    style="green" if RICH_AVAILABLE else "",
                )
            else:
                self.console.print(
                    "⚠️  No NetFlow packets detected yet",
                    style="yellow" if RICH_AVAILABLE else "",
                )

            if RICH_AVAILABLE:
                self.console.print(
                    Panel(stdout, title="Recent netflow2ng logs", expand=False)
                )
            else:
                self.console.print_panel(stdout, "Recent netflow2ng logs")
        else:
            self.console.print(
                "❌ Could not check netflow2ng logs",
                style="red" if RICH_AVAILABLE else "",
            )

    def backup_data(self):
        """Backup ntopng and Redis data"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = BACKUP_DIR / f"ntopng_backup_{timestamp}.tar.gz"

        self.console.print(
            f"\n📦 Creating backup: {backup_file.name}",
            style="bold blue" if RICH_AVAILABLE else "",
        )

        cmd = [
            "docker",
            "run",
            "--rm",
            "-v",
            "ntopng_data:/ntopng_data",
            "-v",
            "redis_data:/redis_data",
            "-v",
            f"{BACKUP_DIR}:/backup",
            "alpine",
            "tar",
            "czf",
            f"/backup/{backup_file.name}",
            "/ntopng_data",
            "/redis_data",
        ]

        code, _, stderr = self.run_command(cmd)

        if code == 0:
            size = backup_file.stat().st_size / 1024 / 1024  # MB
            self.console.print(
                f"✅ Backup created successfully ({size:.1f} MB)",
                style="green" if RICH_AVAILABLE else "",
            )
        else:
            self.console.print(
                f"❌ Backup failed: {stderr}", style="red" if RICH_AVAILABLE else ""
            )

    def show_mikrotik_config(self):
        """Show Mikrotik configuration instructions"""
        # Get local IP
        hostname = socket.gethostname()
        try:
            local_ip = socket.gethostbyname(hostname)
        except socket.error:
            local_ip = "YOUR-DOCKER-HOST-IP"

        config = MIKROTIK_CLI_COMMANDS.format(docker_host_ip=local_ip)

        if RICH_AVAILABLE:
            self.console.print(
                "\n📋 Mikrotik RouterOS Configuration", style="bold blue"
            )
            self.console.print(
                Panel(
                    Syntax(config, "bash", theme="monokai"),
                    title="CLI Commands",
                    expand=False,
                )
            )

            self.console.print("\n🖱️  Or use Winbox/WebFig:", style="bold blue")
            gui_steps = """
1. Go to: IP → Traffic Flow
2. Settings tab:
   - ✅ Enabled
   - Interfaces: all
   - Cache Entries: 4k
   - Active Flow Timeout: 00:01:00
   - Inactive Flow Timeout: 00:00:15

3. Targets tab → Add:
   - Address: {ip}
   - Port: 2055
   - Version: 9
   - v9 Template Refresh: 20
   - v9 Template Timeout: 30
""".format(
                ip=local_ip
            )
            self.console.print(Panel(gui_steps, title="GUI Steps", expand=False))
        else:
            self.console.print_panel(config, "Mikrotik CLI Commands")
            self.console.print(f"\nDocker Host IP: {local_ip}")
            self.console.print("Configure via IP → Traffic Flow in Winbox/WebFig")

    def troubleshoot_connectivity(self):
        """Run connectivity diagnostics"""
        self.console.print(
            "\n🔍 Running connectivity diagnostics...",
            style="bold blue" if RICH_AVAILABLE else "",
        )

        checks = []

        # Check if containers are running
        status = self.get_container_status()
        for service in ["ntopng", "netflow2ng", "redis"]:
            running = service in status and status[service].get("State") == "running"
            checks.append(
                (f"{service} container", "✅ Running" if running else "❌ Not running")
            )

        # Check port 2055 (NetFlow)
        netflow_listening = not self.check_port_available(2055)
        checks.append(
            (
                "Port 2055 (NetFlow)",
                "✅ Listening" if netflow_listening else "❌ Not listening",
            )
        )

        # Check port 3000 (ntopng web)
        web_listening = not self.check_port_available(3000)
        checks.append(
            (
                "Port 3000 (Web UI)",
                "✅ Listening" if web_listening else "❌ Not listening",
            )
        )

        # Check ZMQ connection
        code, stdout, _ = self.run_command(
            ["docker", "exec", "ntopng", "netstat", "-an"]
        )
        zmq_connected = "5556" in stdout if code == 0 else False
        checks.append(
            ("ZMQ connection", "✅ Connected" if zmq_connected else "❌ Not connected")
        )

        if RICH_AVAILABLE:
            table = Table(title="Connectivity Status")
            table.add_column("Component", style="cyan")
            table.add_column("Status")

            for component, status in checks:
                table.add_row(component, status)

            self.console.print(table)
        else:
            self.console.print("\nConnectivity Status:")
            for component, status in checks:
                self.console.print(f"  {component}: {status}")

    def show_performance_stats(self):
        """Show performance statistics"""
        self.console.print(
            "\n📊 Performance Statistics", style="bold blue" if RICH_AVAILABLE else ""
        )

        # Get container stats
        code, stdout, _ = self.run_command(
            ["docker", "stats", "--no-stream", "--format", "json"]
        )

        if code == 0:
            try:
                stats = [
                    json.loads(line) for line in stdout.strip().split("\n") if line
                ]

                if RICH_AVAILABLE:
                    table = Table(title="Container Resource Usage")
                    table.add_column("Container", style="cyan")
                    table.add_column("CPU %")
                    table.add_column("Memory")
                    table.add_column("Net I/O")

                    for stat in stats:
                        if stat.get("Name", "").startswith(
                            ("ntopng", "netflow2ng", "redis")
                        ):
                            table.add_row(
                                stat.get("Name", "N/A"),
                                stat.get("CPUPerc", "N/A"),
                                stat.get("MemUsage", "N/A"),
                                stat.get("NetIO", "N/A"),
                            )

                    self.console.print(table)
                else:
                    self.console.print("\nContainer Resource Usage:")
                    for stat in stats:
                        if stat.get("Name", "").startswith(
                            ("ntopng", "netflow2ng", "redis")
                        ):
                            self.console.print(f"\n  {stat.get('Name', 'N/A')}:")
                            self.console.print(f"    CPU: {stat.get('CPUPerc', 'N/A')}")
                            self.console.print(
                                f"    Memory: {stat.get('MemUsage', 'N/A')}"
                            )
                            self.console.print(
                                f"    Network: {stat.get('NetIO', 'N/A')}"
                            )
            except (json.JSONDecodeError, ValueError):
                self.console.print(
                    "Failed to parse stats", style="red" if RICH_AVAILABLE else ""
                )

    def main_menu(self):
        """Display main menu"""
        while True:
            if RICH_AVAILABLE:
                self.console.print("\n" + "=" * 60, style="blue")
                self.console.print(
                    "🌐 ntopng + netflow2ng Manager",
                    style="bold blue",
                    justify="center",
                )
                self.console.print("=" * 60, style="blue")
            else:
                self.console.print_panel("ntopng + netflow2ng Manager", "Main Menu")

            # Check current status
            status = self.get_container_status()
            running = any(s.get("State") == "running" for s in status.values())

            if running:
                self.console.print(
                    "✅ Services are running", style="green" if RICH_AVAILABLE else ""
                )
                self.console.print(
                    "🌐 Web UI: http://localhost:3000\n",
                    style="cyan" if RICH_AVAILABLE else "",
                )
            else:
                self.console.print(
                    "⚠️  Services are not running\n",
                    style="yellow" if RICH_AVAILABLE else "",
                )

            options = [
                "1. Initial Setup / Create Config Files",
                "2. Start Services",
                "3. Stop Services",
                "4. View Service Status",
                "5. View Logs",
                "6. Check NetFlow Traffic",
                "7. Troubleshoot Connectivity",
                "8. Show Mikrotik Configuration",
                "9. Performance Statistics",
                "10. Backup Data",
                "11. Advanced Options",
                "0. Exit",
            ]

            for option in options:
                self.console.print(option)

            if RICH_AVAILABLE:
                choice = Prompt.ask(
                    "\nSelect an option", choices=[str(i) for i in range(12)]
                )
            else:
                choice = self.console.input("\nSelect an option")

            if choice == "0":
                self.console.print(
                    "\n👋 Goodbye! May your packets flow smoothly.",
                    style="bold green" if RICH_AVAILABLE else "",
                )
                break
            elif choice == "1":
                self.setup_wizard()
            elif choice == "2":
                self.start_services()
            elif choice == "3":
                self.stop_services()
            elif choice == "4":
                self.show_status()
            elif choice == "5":
                self.logs_menu()
            elif choice == "6":
                self.check_netflow_traffic()
            elif choice == "7":
                self.troubleshoot_connectivity()
            elif choice == "8":
                self.show_mikrotik_config()
            elif choice == "9":
                self.show_performance_stats()
            elif choice == "10":
                self.backup_data()
            elif choice == "11":
                self.advanced_menu()

            if RICH_AVAILABLE:
                Prompt.ask("\nPress Enter to continue")
            else:
                input("\nPress Enter to continue...")

    def setup_wizard(self):
        """Run the setup wizard"""
        self.console.print(
            "\n🚀 Setup Wizard", style="bold blue" if RICH_AVAILABLE else ""
        )

        # Check prerequisites
        self.console.print(
            "\n📋 Checking prerequisites...", style="blue" if RICH_AVAILABLE else ""
        )
        prereqs = self.check_prerequisites()

        all_good = True
        for item, status in prereqs.items():
            emoji = "✅" if status else "❌"
            self.console.print(
                f"  {emoji} {item}",
                style="green" if status else "red" if RICH_AVAILABLE else "",
            )
            if not status:
                all_good = False

        if not all_good:
            self.console.print(
                "\n⚠️  Some prerequisites are missing!",
                style="bold yellow" if RICH_AVAILABLE else "",
            )
            if RICH_AVAILABLE:
                if not Confirm.ask("Continue anyway?"):
                    return
            else:
                if not self.console.confirm("Continue anyway?"):
                    return

        # Create configuration files
        if DOCKER_COMPOSE_FILE.exists():
            self.console.print(
                "\n⚠️  Configuration files already exist!",
                style="yellow" if RICH_AVAILABLE else "",
            )
            if RICH_AVAILABLE:
                if not Confirm.ask("Overwrite existing files?"):
                    return
            else:
                if not self.console.confirm("Overwrite existing files?"):
                    return

        self.create_configuration_files()

        self.console.print(
            "\n✅ Setup complete!", style="bold green" if RICH_AVAILABLE else ""
        )
        self.console.print("\n📝 Next steps:", style="blue" if RICH_AVAILABLE else "")
        self.console.print("  1. Start services (option 2)")
        self.console.print("  2. Configure your Mikrotik router (option 8)")
        self.console.print("  3. Check NetFlow traffic (option 6)")

    def show_status(self):
        """Show detailed status of all services"""
        status = self.get_container_status()

        if RICH_AVAILABLE:
            table = Table(title="Service Status")
            table.add_column("Service", style="cyan")
            table.add_column("Status")
            table.add_column("Container")

            for service in ["ntopng", "netflow2ng", "redis"]:
                if service in status:
                    state = status[service].get("State", "unknown")
                    emoji = "✅" if state == "running" else "❌"
                    table.add_row(
                        service, f"{emoji} {state}", status[service].get("Name", "N/A")
                    )
                else:
                    table.add_row(service, "❌ Not found", "N/A")

            self.console.print(table)
        else:
            self.console.print("\nService Status:")
            for service in ["ntopng", "netflow2ng", "redis"]:
                if service in status:
                    state = status[service].get("State", "unknown")
                    emoji = "✅" if state == "running" else "❌"
                    self.console.print(f"  {service}: {emoji} {state}")
                else:
                    self.console.print(f"  {service}: ❌ Not found")

    def logs_menu(self):
        """Logs submenu"""
        while True:
            self.console.print(
                "\n📜 Logs Menu", style="bold blue" if RICH_AVAILABLE else ""
            )
            options = [
                "1. View all logs (last 50 lines)",
                "2. View ntopng logs",
                "3. View netflow2ng logs",
                "4. View Redis logs",
                "5. Follow logs (real-time)",
                "0. Back to main menu",
            ]

            for option in options:
                self.console.print(option)

            if RICH_AVAILABLE:
                choice = Prompt.ask(
                    "\nSelect an option", choices=["0", "1", "2", "3", "4", "5"]
                )
            else:
                choice = self.console.input("\nSelect an option")

            if choice == "0":
                break
            elif choice == "1":
                self.view_logs()
            elif choice == "2":
                self.view_logs("ntopng")
            elif choice == "3":
                self.view_logs("netflow2ng")
            elif choice == "4":
                self.view_logs("redis")
            elif choice == "5":
                self.follow_logs()

            if choice != "5":  # Don't prompt after following logs
                if RICH_AVAILABLE:
                    Prompt.ask("\nPress Enter to continue")
                else:
                    input("\nPress Enter to continue...")

    def follow_logs(self):
        """Follow logs in real-time"""
        self.console.print(
            "\n📡 Following logs (Ctrl+C to stop)...",
            style="bold blue" if RICH_AVAILABLE else "",
        )
        compose_cmd = self.get_docker_compose_command()

        try:
            # trunk-ignore(bandit/B603)
            subprocess.run(compose_cmd + ["logs", "-f"])
        except KeyboardInterrupt:
            self.console.print(
                "\n✋ Stopped following logs", style="yellow" if RICH_AVAILABLE else ""
            )

    def advanced_menu(self):
        """Advanced options menu"""
        while True:
            self.console.print(
                "\n⚙️  Advanced Options", style="bold blue" if RICH_AVAILABLE else ""
            )
            options = [
                "1. Edit docker-compose.yml",
                "2. Edit ntopng.conf",
                "3. Pull latest images",
                "4. Reset all data (danger!)",
                "5. Export flows to ElasticSearch (setup)",
                "6. Enable authentication",
                "0. Back to main menu",
            ]

            for option in options:
                self.console.print(option)

            if RICH_AVAILABLE:
                choice = Prompt.ask(
                    "\nSelect an option", choices=["0", "1", "2", "3", "4", "5", "6"]
                )
            else:
                choice = self.console.input("\nSelect an option")

            if choice == "0":
                break
            elif choice == "1":
                self.edit_file(DOCKER_COMPOSE_FILE)
            elif choice == "2":
                self.edit_file(NTOPNG_CONF_FILE)
            elif choice == "3":
                self.pull_images()
            elif choice == "4":
                self.reset_data()
            elif choice == "5":
                self.setup_elasticsearch()
            elif choice == "6":
                self.enable_authentication()

    def edit_file(self, filepath: Path):
        """Edit a configuration file"""
        editor = os.environ.get("EDITOR", "nano")

        if shutil.which(editor):
            # trunk-ignore(bandit/B603)
            subprocess.run([editor, str(filepath)])
        else:
            self.console.print(
                f"❌ Editor '{editor}' not found. Set EDITOR environment variable.",
                style="red" if RICH_AVAILABLE else "",
            )
            self.console.print(f"📄 File location: {filepath}")

    def pull_images(self):
        """Pull latest Docker images"""
        compose_cmd = self.get_docker_compose_command()

        self.console.print(
            "\n🔄 Pulling latest images...", style="bold blue" if RICH_AVAILABLE else ""
        )
        code, stdout, stderr = self.run_command(
            compose_cmd + ["pull"], capture_output=False
        )

        if code == 0:
            self.console.print(
                "\n✅ Images updated successfully!",
                style="green" if RICH_AVAILABLE else "",
            )
            self.console.print(
                "ℹ️  Restart services to use new images",
                style="yellow" if RICH_AVAILABLE else "",
            )
        else:
            self.console.print(
                "\n❌ Failed to pull images", style="red" if RICH_AVAILABLE else ""
            )

    def reset_data(self):
        """Reset all data (dangerous!)"""
        self.console.print(
            "\n⚠️  WARNING: This will delete all data!",
            style="bold red" if RICH_AVAILABLE else "",
        )

        if RICH_AVAILABLE:
            if not Confirm.ask("Are you absolutely sure?", default=False):
                return
            if not Confirm.ask("Really sure? This cannot be undone!", default=False):
                return
        else:
            if not self.console.confirm("Are you absolutely sure?"):
                return
            if not self.console.confirm("Really sure? This cannot be undone!"):
                return

        compose_cmd = self.get_docker_compose_command()

        # Stop and remove everything
        self.run_command(compose_cmd + ["down", "-v"])

        self.console.print(
            "✅ All data has been reset", style="green" if RICH_AVAILABLE else ""
        )

    def setup_elasticsearch(self):
        """Setup ElasticSearch export"""
        self.console.print(
            "\n📊 ElasticSearch Setup", style="bold blue" if RICH_AVAILABLE else ""
        )

        if RICH_AVAILABLE:
            es_host = Prompt.ask("ElasticSearch host", default="localhost")
            es_port = Prompt.ask("ElasticSearch port", default="9200")
        else:
            es_host = (
                self.console.input("ElasticSearch host (default: localhost)")
                or "localhost"
            )
            es_port = self.console.input("ElasticSearch port (default: 9200)") or "9200"

        es_config = f'-F="es;ntopng;ntopng-%Y.%m.%d;http://{es_host}:{es_port}/_bulk"'

        self.console.print(
            "\n📝 Add this to your ntopng.conf or docker-compose.yml command:"
        )
        if RICH_AVAILABLE:
            self.console.print(Panel(es_config, expand=False))
        else:
            self.console.print(es_config)

    def enable_authentication(self):
        """Enable authentication guide"""
        self.console.print(
            "\n🔐 Enable Authentication", style="bold blue" if RICH_AVAILABLE else ""
        )

        steps = """
1. Remove '--disable-login=1' from ntopng.conf
2. Restart services
3. Default credentials: admin/admin
4. Change password immediately after first login
5. Consider adding HTTPS with certificates
"""

        if RICH_AVAILABLE:
            self.console.print(
                Panel(steps, title="Steps to enable authentication", expand=False)
            )
        else:
            self.console.print_panel(steps, "Steps to enable authentication")


def main():
    """Main entry point"""
    try:
        # Change to script directory
        os.chdir(SCRIPT_DIR)

        # Create and run manager
        manager = NtopngManager()
        manager.main_menu()
    except KeyboardInterrupt:
        if RICH_AVAILABLE:
            console.print("\n\n👋 Interrupted! Goodbye.", style="bold yellow")
        else:
            print("\n\n👋 Interrupted! Goodbye.")
    except Exception as e:
        if RICH_AVAILABLE:
            console.print(f"\n❌ Error: {e}", style="bold red")
        else:
            print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
