<p align="center">
  <img src="frontend/public/Union.png" width="700">
</p>

ManageInSync is a multi-tenant agency management platform designed to help digital agencies manage projects, clients, and internal teams from a single centralized workspace.

The system implements secure authentication, role-based access control (Owner, Admin, Member, Client), and tenant-level data isolation to ensure that each agency operates within its own protected environment.

It supports invite-based onboarding, allowing owners and admins to securely invite members and clients into the workspace.

The platform provides project management capabilities including project creation, member/client assignment, status tracking, and soft deletion.

A live dashboard displays operational metrics such as total projects, active projects, users, and clients.

Audit logging tracks critical actions like project creation, deletion, and client assignments to maintain transparency and accountability.

The backend is built with **Node.js, Express, MongoDB, and JWT authentication**, while the frontend uses **React, Vite, Axios, and Tailwind CSS**.

ManageInSync demonstrates a production-style SaaS architecture with modular backend services, secure middleware pipelines, and role-aware frontend routing.
