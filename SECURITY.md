# Security Policy

The `plan-parse` team takes the security of our software and the privacy of our users seriously. This document outlines our security policies, supported versions, and the process for reporting vulnerabilities.

---

## Supported Versions

Security updates and patches are actively provided for the following versions:

| Version | Supported          |
| :--- | :--- |
| `main` (latest development) | :white_check_mark: |
| Latest release (`v0.1.x`+)  | :white_check_mark: |
| Older releases (< `v0.1.0`) | :x: |

We recommend always running the latest official release or container image to ensure you have the latest security fixes and dependency updates.

---

## Reporting a Vulnerability

> [!CAUTION]
> **Please do not report security vulnerabilities through public GitHub issues, pull requests, or public forums.**

If you believe you have found a security vulnerability in `plan-parse`, please report it responsibly using one of the following methods:

### Method 1: GitHub Security Advisory (Recommended)
Submit a private report through GitHub's Security tab:
1. Navigate to [AatirNadim/plan-parse Security](https://github.com/AatirNadim/plan-parse/security).
2. Click **"Report a vulnerability"** to open a private draft advisory.
3. Provide details and proof-of-concept steps.

### Method 2: Direct Email
Send an encrypted or plain email to the maintainer:
- **Email**: [aatir.nadim@gmail.com](mailto:aatir.nadim@gmail.com)
- **Subject**: `[SECURITY VULNERABILITY] plan-parse: <Brief Summary>`

---

## What to Include in Your Report

To help us triage and resolve the issue quickly, please provide:
* **Description**: Detailed explanation of the vulnerability and its potential security impact.
* **Component**: Which component is affected (`pkg/core`, `pkg/runner`, `pkg/server`, `ui`, Docker image).
* **Reproduction Steps**: Step-by-step instructions or a minimal Proof of Concept (PoC).
* **Environment**: Version of `plan-parse`, OS, Go version, and Terraform version.
* **Suggested Fix / Mitigation**: If you have identified a fix or workaround, please include it.

---

## Response & Disclosure Process

1. **Initial Acknowledgment**: A maintainer will acknowledge receipt of your vulnerability report within **48 hours**.
2. **Investigation & Assessment**: We will assess the severity and impact, verifying the vulnerability in an isolated environment.
3. **Remediation & Patch**: A fix will be developed in a private security fork.
4. **Coordinated Disclosure**: Once a fix is prepared and verified, an updated release and a security advisory (CVE if applicable) will be published with credit given to the reporter (unless anonymity is requested).

---

## Security Best Practices for Users

* **Sanitize Terraform Plans**: Never run `plan-parse` on untrusted networks without authentication or reverse proxy protections when using `-addr 0.0.0.0`.
* **Credential Hygiene**: Ensure that Terraform plan exports do not contain unencrypted long-lived secrets or tokens before sharing them.
* **Container Security**: Run Docker containers with least privilege (non-root user).
