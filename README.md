# Open Power Samplesize

[![Deploy to GitHub Pages](https://github.com/zarathucorp/open-powersamplesize/actions/workflows/deploy.yml/badge.svg)](https://github.com/zarathucorp/open-powersamplesize/actions/workflows/deploy.yml)

*Open Power Samplesize* is a free, open-source web application designed to help researchers and students perform power and sample size calculations for various statistical tests. Our goal is to provide an intuitive and accessible tool for study design.

This tool supports a wide range of scenarios, including tests for means, proportions, time-to-event data, and more. This project is built with [Next.js](https://nextjs.org).

[한국어 README](./README.ko.md)

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
