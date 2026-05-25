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

## 🚀 Overview & Name Origin

### ⛩️ Why YATO?
The platform's name **YATO** is inspired by **Yato (夜ト)**, the stray god from the popular anime series ***Noragami***. In the anime, Yato is a minor, self-proclaimed deity who does odd jobs, resolves human troubles, and works tirelessly for a mere **5-yen coin** to build his grand shrine and earn devotees. 

True to its namesake, the **YATO Platform** acts as the ultimate, dedicated "helper god" for IT Support, Project Management, and Infrastructure Operations. It works quietly and tirelessly behind the scenes—managing support tickets, tracking assets, resolving tasks, and securing your enterprise credentials with absolute reliability.

**YATO** is a unified, highly secure IT Operations, Task Management, and Asset Registry platform built from the ground up to streamline communications and bridge the gap between development teams, helpdesk support, and system administrators.

---

## ✨ Core Feature Set

### 🎫 1. Helpdesk Tickets & Nested Comment Threads
* **Interactive Ticketing Portal:** Easily classify support tickets by categories (`GENERAL`, `INFRASTRUCTURE`, `BILLING`, etc.) and set SLA priorities.
* **Threaded Comment Collaboration:** Interactive conversation feeds within tickets supporting deep nesting, file uploads, and `@mentions`.
* **Multi-Gateway Notifications:** Automated real-time alerts via Email, WhatsApp, and Telegram keeping support agents and users instantly updated.

### 📋 2. Comprehensive Task & Project Management
* **Agile Task Tracking:** Track daily maintenance schedules, troubleshoot operations, and backup workflows across different priorities.
* **Granular Checklists:** Break down tasks into interactive subtask checklists with live state synchronization.
* **Interactive Comment Streams:** Hold dedicated discussions directly inside specific task cards, complete with multi-file attachment uploads.

### 🔐 3. Hardened Encrypted Credential Vault
* **AES-256 Envelope Cryptography:** Sensitive passwords, database connections, and SSH keys are encrypted via dynamic Data Encryption Keys (DEKs) wrapped by a Master Key Encrypting Key (KEK).
* **On-the-Fly Key Rotation:** Dynamic key rotation utility that generates new DEKs and transparently re-encrypts all database credentials with zero downtime.
* **Granular Audit Logging:** Every credential query generates an immutable access log tracking user, timestamp, IP address, and browser metadata.

### 📊 4. Enterprise Asset Registry & Rack Tracing
* **Physical & Digital Inventories:** Catalog datacenters, servers, switches, routers, and company laptops with dynamic, custom metadata schemas.
* **Datacenter Rack cabinet Mapping:** Model servers precisely inside physical rack layouts with vertical unit positions (`uPosition`) and rack zones.
* **Asset Dependencies Graph:** Establish logical relations (e.g., `SERVER_TO_RACK`, `SWITCH_TO_DATACENTER`) to trace infrastructure topologies.
* **Rapid Scan QR Codes:** Inline high-fidelity QR code generation for rapid physical audits and updates.

### 🛡️ 5. Identity, Access, & Security Operations
* **Two-Factor Authentication (MFA/2FA):** Seamless dynamic Time-based One-Time Passwords (TOTP) utilizing authenticator apps (Google Authenticator, Authy, etc.).
* **Role-Based Access Control (RBAC):** Strict NestJS controller guards implementing multi-tier permissions (`ADMIN`, `SUPPORT_AGENT`, etc.).
* **Brute-Force & Lockout Guard:** Automated monitoring of failed login attempts that locks out compromised accounts after consecutive validation errors.

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

## 📐 Technical Architecture & Design Specifications

### 🖥️ 1. System Architecture Design
The YATO Platform uses a highly resilient, isolated, and proxy-secured multi-tier architecture to deliver instant support feeds, secure enterprise credentials, and map critical datacenter assets:

```mermaid
graph TD
    %% Clients
    User([👤 Administrator / Support Agent]) -->|Accesses Portal: Port 9090| Nginx[🔒 Nginx Gateway Proxy]

    %% Routing
    subgraph "DMZ & Gateway Router"
        Nginx -->|Routes static pages & UI| Frontend[🌐 Next.js Portal - Port 4001]
        Nginx -->|Routes REST API & Websockets| Backend[🚀 NestJS Backend API - Port 4000]
    end

    %% Application Tier
    subgraph "Application Logic & Middleware Services"
        Backend -->|Access Control| Guards[🛡️ RBAC / MFA Guards]
        Backend -->|Crypto Vault| Envelope[🔐 Envelope Cryptography Engine]
        Backend -->|Audit Logs| Audit[📋 Immutable Audit Logger]
        Backend -->|Task Scheduler| Queue[📦 BullMQ Job Queue]
    end

    %% Infrastructure Tier
    subgraph "Infrastructure & Cache State"
        Database[(🗄️ PostgreSQL 15 - DB Store)]
        Redis[(⚡ Redis 7 - Session & Queue Store)]
    end

    %% Database integrations
    Backend -->|Type-safe queries| Database
    Queue <-->|Job tracking| Redis
    Backend <-->|Cache / Queue triggers| Redis

    %% External Gateways
    subgraph "Integrations & Connectors"
        WAHA[💬 WhatsApp WAHA Gateway]
        SMTP[📧 SMTP Mail Server]
        Telegram[✈️ Telegram API Bot]
    end

    Backend -->|Notification dispatch| WAHA
    Backend -->|System alerts / transactional mail| SMTP
    Backend -->|Instant alert alerts| Telegram
```

---

### 🗄️ 2. Database Design & Security Specifications
To protect sensitive credentials and maintain transaction logs, YATO implements strict database design rules:

#### A. AES-256 Envelope Cryptography (Vault Security)
All credentials (passwords, tokens, SSH keys) inside the `Credential` table are never stored in raw text. They are protected using dynamic **Envelope Encryption**:
1. **Master KEK:** A secure 32-character key generated during installation (`ENCRYPTION_KEY` in `.env`) acts as the Master Key Encrypting Key.
2. **Dynamic DEKs:** Every time a credential is created, a unique, random Data Encryption Key (DEK) is generated. The credential data is encrypted using this DEK (AES-256-GCM).
3. **Double wrapping:** The DEK itself is encrypted using the Master KEK and stored alongside the encrypted payload in the database.
4. **Key Rotation:** Running the KEK rotation updates the keyring, decrypts all DEKs with the old KEK, and re-wraps them with the new KEK seamlessly.

#### B. Immutable Audit Trail & Lockouts
* **`AuditLog`:** Logs every state mutation, authentication check, and credential access. Once created, these records are never updated or deleted by the application (enforced by NestJS interceptors).
* **`LoginHistory`:** Captures successful and unsuccessful authentication events, mapping IP Addresses and client User-Agent headers.
* **Lockout Mechanics:** When standard login validation fails continuously (limit of 5 consecutive times), the `failedLoginAttempts` counter increment triggers an automated lockout timestamp (`lockoutUntil`), blocking further requests for 15 minutes to defeat brute-force attempts.

---

### 🎨 3. Visual & UI Design Specifications
YATO follows a premium, high-contrast, modern UI specification designed for optimal usability and legibility:

* **Typography System:** Leverages the **Inter** font family (Google Fonts) for structure and tabular data, using varying font weights (`font-bold`, `font-semibold`) and clear sizes (`text-sm`, `text-[11px]`) to establish deep hierarchy.
* **Color Contrast Standard (WCAG 2.1 Compliant):**
  * **White Backgrounds:** Sub-text and table headers leverage `text-slate-600` and secondary tags use `text-slate-500` to guarantee a readability ratio exceeding `4.5:1` against white backgrounds (`bg-white` / `bg-slate-50`).
  * **Accents:** Highlights and active navigation links use rich Cobalt Blue (`bg-blue-600` / `text-blue-600`) and Deep Purple (`text-indigo-600`).
  * **Alerts & States:** Success states use Emerald green (`bg-emerald-50` / `text-emerald-600`), and pending or warned alerts use Amber orange (`bg-amber-50` / `text-amber-600`).
* **Glassmorphism Panels:** Core dashboard panels utilize soft borders (`border-slate-100`), backing shadows (`shadow-sm`), and translucent gradients to deliver a lightweight, high-end visual workspace.

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

### 🔑 Multi-Factor Authentication (MFA) Troubleshooting & Time Synchronization

If a user or administrator is locked out because their Time-based One-Time Password (TOTP) is rejected (due to timezone drift or clock desynchronization between their mobile device and the VPS host):

#### 1. 🚨 Emergency MFA Bypass Token
YATO features a secure, built-in emergency bypass code. If an account has MFA enabled and is completely locked out:
* In the MFA validation screen, input **`000000`** as the 6-digit OTP code.
* This will immediately bypass verification, allowing access to the dashboard where you can disable or re-key the user's MFA settings.
> [!NOTE]
> Emergency bypass logins are strictly tracked and generate an `[EMERGENCY] MFA bypassed` warning log in the system logs.

#### 2. 👥 Disabling MFA via Administrator Panel
If another Administrator is active:
* Navigate to **Admin ➔ User Management**.
* Click the **Edit** icon next to the locked-out user.
* Toggle off **MFA Secure**, save, or let the user re-enroll.

#### 3. 🕒 Verifying VPS & Container Time Synchronization
Docker containers derive their clocks directly from the host system. If the host clock drifts, MFA codes will immediately fail:
* **Verify Host Time:** Run `date` or `timedatectl` on your VPS host to check if the time is correct.
* **Synchronize Host Clock:** If the host clock is incorrect, sync it using NTP:
  ```bash
  # Force immediate NTP clock synchronization
  sudo systemctl restart systemd-timesyncd
  # Or if using chrony:
  sudo chronyd -q 'server pool.ntp.org iburst'
  ```
* **Verify Container Clocks:** Check if containers are in perfect sync with the host timezone:
  ```bash
  docker compose exec backend date
  ```

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

YATO utilizes a highly relational PostgreSQL schema to link identities, access controls, provisioning requests, physical assets, and encrypted credentials. Below is the comprehensive topological map of the platform's core entities:

```mermaid
erDiagram
    %% Core Identity & Access Management (IAM)
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : assigned_to
    User ||--o{ Credential : owns
    User ||--o{ ApiToken : issues
    User ||--o{ LoginHistory : logs
    User ||--o{ AuditLog : performs

    %% Provisioning & Orchestration Engine
    User ||--o{ VMRequest : requests
    User ||--o{ ServiceRequest : requests
    VMRequest ||--o| VMInventory : tracks_state
    ServiceRequest ||--o| ServiceInventory : tracks_state
    
    %% Asset & Infrastructure Registry
    User ||--o{ Asset : manages
    Asset ||--o{ AssetMovement : movement_log
    Asset ||--o{ AssetRelationship : source_of
    Asset ||--o{ AssetRelationship : target_of
    
    %% Support Ticketing & Task Management
    User ||--o{ SupportTicket : opens
    User ||--o{ Task : creates
    Task ||--o{ TaskComment : has
    SupportTicket ||--o{ TicketComment : has
    VMRequest ||--o{ TicketComment : discussions
    ServiceRequest ||--o{ TicketComment : discussions

    %% Platform Integrations
    Integration {
        String id PK
        String name
        String type "PROVISIONING, MONITORING, NOTIFICATION"
        String connectorKey UK "proxmox-ve, vmware-vsphere, grafana"
        Boolean isActive
    }

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

    VMInventory {
        String id PK
        String requestId FK
        String ipAddress
        String sshUser
        String status
    }

    Asset {
        String id PK
        String assetCode UK "HMS-SRV-000001"
        String assetType "SERVER, VM, ROUTER, SWITCH"
        String status
        String rack
        Int uPosition
    }

    AssetRelationship {
        String id PK
        String sourceId FK
        String targetId FK
        String type "VM_TO_HYPERVISOR, SERVER_TO_RACK"
    }

    Credential {
        String id PK
        String name
        String type "SSH, DB, API_KEY"
        String password "AES-256 Encrypted DEK"
        String ownerId FK
    }

    Task {
        String id PK
        String title
        String status "NOT_STARTED, IN_PROGRESS, BLOCKED, DONE"
        String priority
    }

    User {
        String id PK
        String email UK
        String password "Bcrypt Hashed"
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
