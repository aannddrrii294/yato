# YATO Platform
### Unified Infrastructure Operations & Asset Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18%20%7C%20v20-green?style=for-the-badge&logo=node.js&logoColor=white" alt="Node Version" />
  <img src="https://img.shields.io/badge/NestJS-v10-red?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/Next.js-v14-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js Version" />
  <img src="https://img.shields.io/badge/PostgreSQL-v15-blue?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Version" />
  <img src="https://img.shields.io/badge/Redis-v7-red?style=for-the-badge&logo=redis&logoColor=white" alt="Redis Version" />
  <img src="https://img.shields.io/badge/Docker-Supported-blue?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Supported" />
  <img src="https://img.shields.io/badge/License-Apache%202.0-yellowgreen?style=for-the-badge" alt="Apache 2.0 License" />
</p>

---

## 🚀 Overview

**YATO** is an enterprise-grade, highly secure, and unified IT Operations and Asset Management platform designed to streamline infrastructure provisioning, support ticket orchestration, credential vaults, and multi-layered physical/digital asset registries. Built from the ground up for modern system administrators, DevOps, and infrastructure teams.

By combining real-time VM provisioning, multi-tenant capable credential protection, nested support discussion threads, and a rich, interactive network/physical rack asset registry, YATO eliminates the operational gaps between dev teams and infrastructure operations.

---

## ✨ Core Feature Set

### 💻 1. Virtual Machine & Service Provisioning Engine
* **Structured Approval Lifecycles:** Dynamic state machines governing VM and custom service requests (`PENDING` ➔ `APPROVED` ➔ `PROVISIONING` ➔ `COMPLETED` / `FAILED`).
* **Automated SSH Orchestration:** Binds to secure SSH credentials to execute remote provisioning scripts, producing real-time logs and output.
* **Queued Execution (BullMQ):** Highly scalable background task processors backed by Redis to manage hypervisor operations (Proxmox, VMware, or cloud APIs) without blocking the main gateway thread.
* **Service Inventory & Endpoint Tracker:** Dynamically registers running endpoints, custom service configurations (JSON), ports, and active addresses.

### 🔐 2. Hardened Encrypted Credential Vault
* **AES-256 Envelope Cryptography:** Sensitive passwords, API tokens, and SSH keys are encrypted using dynamic Data Encryption Keys (DEKs) wrapped by a Master Key Encrypting Key (KEK).
* **On-the-Fly Key Rotation:** Single-click key rotation API that generates new active DEKs, updates the historical keyring, and securely re-encrypts all database records with zero downtime.
* **Granular Audit Logging:** Every vault lookup creates an immutable `ACCESS_CREDENTIAL` event containing user context, timestamp, IP address, and browser User-Agent.

### 📊 3. Enterprise Asset Registry & Rack Tracing
* **Physical & Digital Inventory:** Tracks everything from Servers, VMs, Switches, and Routers to physical user hardware (e.g., Laptops) with custom dynamic metadata fields.
* **Datacenter Rack Mapping:** Pinpoints exact server locations inside rack cabinets (Rack Name, Datacenter Zone, and vertical unit position `uPosition`).
* **Asset Relationship Graph:** Defines parent-child and network link dependencies (e.g., `VM_TO_HYPERVISOR`, `SERVER_TO_RACK`, `SWITCH_TO_DATACENTER`).
* **QR-Code Rapid Scan:** Generates inline high-fidelity QR codes to simplify physical device audits.
* **Lifecycle Movement Audits:** Automatically tracks ownership transfers, physical moves, repairs, or disposals.

### 🎫 4. Helpdesk Tickets & Nested Comment Threads
* **Interactive Helpdesk:** Structured ticketing categorizes queries (`GENERAL`, `INFRASTRUCTURE`, `BILLING`, etc.) and scales priority configurations.
* **Threaded Comment Matrix:** Enables deep, hierarchical communication on tickets with file attachments and nested reply support.
* **Real-time Notifications:** Dispatches transactional updates across a modular gateway supporting Email, WhatsApp, and Telegram.

### 🛡️ 5. Identity, Access, & Security Operations
* **Two-Factor Authentication (MFA/2FA):** Integrated dynamic Time-based One-Time Passwords (TOTP) using standard authenticator apps (Google Authenticator, Authy, etc.).
* **Role-Based Access Control (RBAC):** Hierarchical permissions (`ADMIN`, `TICKETING_ADMIN`, etc.) applied systematically via NestJS Guards.
* **Brute-Force & Lockout Guard:** Tracks failed login attempts and locks out targeted profiles dynamically using expiration windows.

---

## 🛠️ Complete Technology Stack

| Tier | Component | Technology / Library | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Framework | Next.js 14 (App Router) | High-performance React portal with optimized SEO and dynamic layout controls |
| | CSS | Tailwind CSS | Sleek, modern, and highly-responsive user interface styling |
| | State & Query | React Query (TanStack) | Declarative fetching, local caching, and synchronization |
| **Backend** | Framework | NestJS (Node.js) & TypeScript | Strongly-typed, modular REST API architecture |
| | ORM | Prisma ORM | Type-safe schema generator, database query builder, and migrations |
| | Task Queue | BullMQ (via `@nestjs/bullmq`) | Background asynchronous jobs, queue management, and task concurrency |
| | Sockets | Socket.IO (via `@nestjs/websockets`) | Real-time WebSocket terminal server and bi-directional communications |
| | SSH Client | `ssh2` package | Dynamic virtual connection client for execution of VM provisioning pipelines |
| **Database** | Primary | PostgreSQL 15 | Structured transactional storage, relational integrity, and indexation |
| | Cache & Queue | Redis 7 | High-performance in-memory cache, session store, and BullMQ backend |
| **Proxy** | Web Server | Nginx | Reverse proxy, secure SSL termination, and static assets server |
| **Runtime** | Deployment | Docker / Docker Compose | Containerization and environment isolation |

---

## ⚙️ System Specifications & Requirements

YATO can be deployed modularly on different systems depending on the production requirements.

### 🖥️ 1. Minimum System Specifications (Development & Lite Testing)
> [!NOTE]
> Best for local developer sandboxes, staging environments, or small administrative networks (up to 10 active administrators).

* **CPU:** Dual-Core (2 vCPUs)
* **System RAM:** 4 GB (8 GB is highly recommended if running backend, frontend, PostgreSQL, and Redis concurrently in Docker)
* **Available Disk Storage:** 20 GB SSD/NVMe
* **Supported OS:** Ubuntu Server 20.04/22.04 LTS, Debian 11/12, Rocky Linux 8/9, macOS (Intel/Silicon), or Windows 10/11 with WSL2.
* **Docker Engines:** Docker Engine v24.0+ and Docker Compose v2.20+

### 🚀 2. Recommended Specifications (Enterprise Production Scale)
> [!IMPORTANT]
> Required for large-scale operations involving simultaneous SSH gateway tunnels, heavy background provisioning queues, and extensive asset-movement exports.

* **CPU:** Quad-Core (4 vCPUs or more)
* **System RAM:** 8 GB - 16 GB DDR4/DDR5
* **Available Disk Storage:** 50+ GB Enterprise NVMe SSD
* **Network:** Gigabit Ethernet with fixed IP address / secure VPN routing.

### 📦 3. Software Dependencies (For Local Development Setup)
If running directly on host machines without Docker orchestration, you must fulfill these installations:
* **Node.js:** v18.x LTS or v20.x LTS (Recommended)
* **Package Manager:** npm v9.x+ or yarn v1.22+
* **Database:** PostgreSQL v15+
* **Cache Key-Store:** Redis v7.x+

---

## 💻 Step-by-Step Installation Guides

YATO offers modular deployment pipelines. First, clone the repository from GitHub, then select your desired installation method below.

### 📥 Step 1: Clone the Repository
First, download the source code from GitHub to your target machine:

```bash
# Clone the repository via HTTPS
git clone https://github.com/aannddrrii294/yato.git

# Enter the repository directory
cd yato
```

---

### 🚀 Step 2: Choose Deployment Option

Choose one of the following methods to install and launch YATO:

### Option A: Standard Full-Stack Docker Deployment (Recommended)
This pipeline deploys isolated containers for Next.js, NestJS, PostgreSQL, Redis, and Nginx.

1. **Make scripts executable:**
   ```bash
   chmod +x installer.sh update.sh uninstall.sh
   ```

2. **Run the Interactive Installer:**
   ```bash
   ./installer.sh
   ```
   *The installer automatically generates secure random values for JWT keys, database access parameters, and Master KEK passwords, saving them to `.env`.*

3. **Verify running containers:**
   ```bash
   docker compose ps
   ```

---

### Option B: Local Developer Workspace Setup (Without Docker Compose)
If you want to run YATO locally in watch/debug mode with standard live reloads:

#### 1. Setup the Database & Cache
Ensure PostgreSQL and Redis are running locally on your default ports.

#### 2. Configure Backend Environment
Navigate to `backend` and set up the environmental parameters:
```bash
cd backend
cp .env.example .env
```
Open `.env` and configure your database string, redis host, and cryptographic KEK:
```env
DATABASE_URL="postgresql://yato:yato@localhost:5432/yato?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
ENCRYPTION_KEY="replace-with-a-secure-32-char-key"
JWT_SECRET="replace-with-a-secure-jwt-secret"
```

#### 3. Install Backend Dependencies & Run Migrations
```bash
# Install NPM modules
npm install

# Generate Prisma Client and apply migrations
npx prisma generate
npx prisma migrate dev

# Seed database with default admin accounts, roles, and configuration templates
npx prisma db seed

# Launch NestJS in local developer watch mode
npm run start:dev
```

#### 4. Configure Frontend Environment
In a new terminal window, configure and launch the Next.js portal:
```bash
cd frontend
cp .env.example .env.local
```
Configure backend routing proxy inside `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

#### 5. Install Frontend Dependencies & Launch Development Server
```bash
# Install modules
npm install

# Run dev server
npm run dev
```
Open browser at [http://localhost:3000](http://localhost:3000).

---

## 🚀 Post-Installation Network Access Details

Once the platform is bootstrapped, use the target routing endpoints below:

### 🌐 Network Routing
* **Frontend Web Portal:** [http://localhost:4001](http://localhost:4001) (Direct Node Port) or [http://localhost:9090](http://localhost:9090) (Nginx Gateway Router)
* **Backend API Gateway:** [http://localhost:4000](http://localhost:4000)
* **Interactive OpenAPI/Swagger Documentation:** [http://localhost:4000/docs](http://localhost:4000/docs)

### 🔐 Default Administrator Login
> [!WARNING]
> Change the default administrator passwords and credentials immediately in the **Profile settings** panel after your first successful authorization!

* **Username/Email:** `admin@yato.local`
* **Password:** `admin123`

---

## 🔄 Operations & Maintenance

### How to Upgrade YATO (Git Updates & Migrations)
To pulling updates from upstream repository, rebuild container configurations, and hot-reload database migrations:
```bash
./update.sh
```

### Checking Real-time System Logs
```bash
# Check all container logs
docker compose logs -f

# Check only backend controller outputs
docker compose logs -f backend

# Check only background provisioning workers
docker compose logs -f backend | grep -i "VmProvisionWorker"
```

### Uninstalling the Platform
To cleanly stop, destroy, and permanently remove database persistent volumes:
```bash
./uninstall.sh
```

## 🗄️ Database Architecture (Schema Topology)

YATO utilizes a highly relational PostgreSQL schema to link identities, access controls, provisioning requests, and encrypted credentials. Below is the simplified core topology:

```mermaid
erDiagram
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : assigned_to
    User ||--o{ Credential : owns
    User ||--o{ VMRequest : requests
    User ||--o{ SupportTicket : creates
    User ||--o{ Asset : manages

    VMRequest {
        String id PK
        String ticketId UK
        String status "PENDING, APPROVED, PROVISIONING, COMPLETED"
        Int cpu
        Int ram
        Int disk
        String environment
        String requestedBy FK
    }

    Credential {
        String id PK
        String name
        String encryptedData
        String iv
        String authTag
        String ownerId FK
    }

    Asset {
        String id PK
        String name
        String type "SERVER, VM, ROUTER, SWITCH"
        String status
        String ownerId FK
    }
    
    SupportTicket {
        String id PK
        String subject
        String status "OPEN, PENDING, RESOLVED, CLOSED"
        String priority
    }

    User {
        String id PK
        String email UK
        String password
        Boolean isMfaEnabled
        DateTime lastLogin
    }
```

---

## 📂 Project Architecture Tree

```text
YATO/
├── backend/                     # NestJS REST Gateway
│   ├── prisma/                  # Relational database models, seeders, and configurations
│   ├── src/
│   │   ├── app.module.ts        # Global imports (Throttling, Caches, EventEmitters)
│   │   ├── main.ts              # System entrypoint (Swagger and CORS initialization)
│   │   ├── common/              # Global security filters and custom deciphers
│   │   └── modules/             # High-cohesion modular features (Auth, VM Requests, Storage)
│   ├── package.json             # Dev and Production NPM script configs
│   └── tsconfig.json            # Compiler configurations
│
├── frontend/                    # Next.js 14 Frontend Portal
│   ├── public/                  # Static assets and portal graphics
│   ├── src/
│   │   ├── app/                 # Next.js App Router folders and routes
│   │   ├── components/          # Shared components (Buttons, Modals, Forms)
│   │   └── lib/                 # Communication layers, API, and XLSX exporters
│   ├── tailwind.config.ts       # Visual configuration system for Tailwind CSS
│   └── tsconfig.json            # Compiler configurations
│
├── nginx/                       # Config definitions for SSL/Reverse proxy routing
├── installer.sh                 # Modular multi-tier shell installer script
├── update.sh                    # Database migration & git pull automation script
└── uninstall.sh                 # Persistent volume cleaner script
```

---

## ⚖️ License

Distributed under the Apache License Version 2.0. See the [LICENSE](LICENSE) file for more information.
