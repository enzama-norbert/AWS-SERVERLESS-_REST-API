# AWS-SERVERLESS-REST-API

This project implements a fully serverless REST API on AWS to manage a simple to-do list (or customer records). It uses **Amazon API Gateway**, **AWS Lambda**, and **Amazon DynamoDB** for the backend, with a static **frontend hosted on S3**. The API supports full CRUD operations.

---

## 🧱 Architecture Overview

- **Amazon API Gateway** – Exposes REST endpoints
- **AWS Lambda** – Stateless function for handling CRUD operations
- **Amazon DynamoDB** – NoSQL table to store to-do items
- **Amazon S3** – Hosts the static frontend (HTML/JS)
- **AWS IAM** – Secure role-based access for Lambda and API Gateway
- **Amazon CloudWatch** – Logs and metrics for monitoring

![Architecture Diagram]
![Serverless REST API with DynamoDB and API Gateway](https://github.com/user-attachments/assets/774f22c7-2de2-436c-8c0f-d39bbe192cb8)
) <!-- Replace or remove -->

---

## 🚀 Features

- Create, Read, Update, Delete (CRUD) operations
- Stateless, serverless, event-driven execution
- Fully managed and scalable infrastructure
- Frontend integration with REST API
- Easily deployable with **Terraform** or **CloudFormation**

---

## 📁 Project Structure
