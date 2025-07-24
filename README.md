# Open Power Samplesize

[![Deploy to GitHub Pages](https://github.com/zarathucorp/open-powersamplesize/actions/workflows/deploy.yml/badge.svg)](https://github.com/zarathucorp/open-powersamplesize/actions/workflows/deploy.yml)

<p align="left">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square" alt="shadcn/ui"/>
  <img src="https://img.shields.io/badge/Recharts-B42424?style=flat-square" alt="Recharts"/>
  <img src="https://img.shields.io/badge/jStat-3B82F6?style=flat-square" alt="jStat"/>
  <img src="https://img.shields.io/badge/ESLint-4B3263?style=flat-square&logo=eslint&logoColor=white" alt="ESLint"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
</p>

*Open Power Samplesize* is a free, open-source web application designed to help researchers and students perform power and sample size calculations for various statistical tests. Our goal is to provide an intuitive and accessible tool for study design.

This tool supports a wide range of scenarios, including tests for means, proportions, time-to-event data, and more. This project is built with [Next.js](https://nextjs.org).

[한글 README](./README.ko.md)

## Introduction

The website `powersandsamplesize.com`, frequently used by researchers for statistical power and sample size calculations, has recently become unavailable due to errors. Inspired by its commitment to providing a variety of functions and validated formulas freely to the public, we are proud to introduce Zarathu's open-source tool: `Open Power Samplesize`.

The goal of `Open Power Samplesize` is to provide **fast and accurate power and sample size calculations** essential for various research designs. Our calculation tools can be utilized across numerous scientific fields, including clinical trials, epidemiology, and psychology.

For full transparency, all source code and formulas are publicly available and can be reviewed on the Zarathu GitHub. Additionally, for researchers who wish to perform their analyses using R, all the same functionalities are available in the R package `Rashnu`.

Should you encounter any errors while using the site, please report them on our GitHub issues page.

## Getting Started

To run the development server in your local environment, follow these steps:

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Running with Docker

Alternatively, you can run the application using Docker:

1.  Build the Docker image:
    ```bash
    docker build -t open-powersamplesize .
    ```
2.  Run the Docker container:
    ```bash
    docker run -p 3000:3000 open-powersamplesize
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Deployment

This project is automatically deployed to GitHub Pages whenever a push is made to the `main` branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.

The site is currently available at:
`https://<your-github-username>.github.io/open-powersamplesize/`

### Using a Custom Domain

To use a custom domain for the deployed site, follow these steps:

1.  **Configure GitHub Repository Settings**:
    *   Go to your repository's **Settings** > **Pages**.
    *   In the "Custom domain" section, enter your purchased domain name (e.g., `www.your-domain.com`) and click **Save**.

2.  **Configure DNS**:
    *   Go to your domain registrar's website (e.g., GoDaddy, Namecheap).
    *   Create a `CNAME` or `A` record to point your domain to GitHub as instructed on the GitHub Pages settings page.

3.  **Modify Next.js Configuration**:
    *   When using a custom domain, the `basePath` is no longer needed. Modify your `next.config.ts` file as follows:

    ```typescript
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      output: "export",
    };

    export default nextConfig;
    ```

4.  **Deploy Changes**:
    *   Commit and push the modified `next.config.ts` file to the `main` branch. GitHub Actions will automatically rebuild and deploy the site with the new settings.
