# YATO Platform

> Premium, secure, and modern IT Operations and Asset Management platform designed to streamline infrastructure provisioning, support tickets, physical/digital asset registries, and credentials orchestration.

---

## 🚀 Key Features

* **Ticket Management & VM Provisioning**: Full lifecycle VM/Service approval workflow with real-time input validation, SSH credentials binding, and automated deployment logs.
* **Asset Registry**: Digital and physical assets tracking with modern spreadsheet tools, including a native multi-sheet Excel exporter grouped dynamically by asset type.
* **Credential Vault**: Highly-secured storage for sensitive credentials, keys, and tokens with access auditing.
* **System Status & Monitor**: Real-time monitoring metrics and micro-indicators for infrastructure health.
* **Premium UX/UI Layout**: Fully responsive dashboard layouts featuring elegant glassmorphism accents, smooth animations, dark-slate color harmony, and robust form validation.

## 🛠️ Technology Stack

* **Frontend**: Next.js 14, React 18, Vanilla CSS, Axios, React Query.
* **Backend**: NestJS, Prisma ORM, BullMQ, Redis, Node-SSH2, PostgreSQL.
* **Infrastructure**: Docker, Nginx Reverse Proxy, SSL Offloading.

## 📦 Getting Started

### Prerequisites

* Docker and Docker Compose (V2 plugin or standalone V1)
* Git

### Deployment Quickstart

To install or update the platform:

```bash
# Clone the repository
git clone https://github.com/honet-ops/yato.git
cd yato

# Build and start services using Docker Compose
docker compose up -d --build
```

To easily sync and update the platform on staging or production:

```bash
chmod +x update.sh
./update.sh
```

---

## 📂 Project Structure

```text
YATO/
├── backend/                  # NestJS backend application
│   ├── src/                  # NestJS API controllers, services, gateway
│   └── prisma/               # Database schemas & migrations
├── frontend/                 # Next.js frontend application
│   ├── src/app/              # Next.js App Router pages
│   ├── src/components/       # UI/UX elements
│   └── src/lib/              # Utility helpers (CSV/Excel Exporters)
├── nginx/                    # Reverse Proxy configurations
├── LICENSE                   # Apache 2.0 License Terms
├── NOTICE                    # Copyright notices
├── CONTRIBUTING.md           # Developer contribution guidelines
├── SECURITY.md               # Security vulnerability report procedures
└── README.md                 # System overview and manual
```

---

## ⚖️ License

Distributed under the Apache License Version 2.0. See the [LICENSE](LICENSE) file for more information.
