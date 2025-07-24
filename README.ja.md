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

*Open Power Samplesize*は、研究者や学生がさまざまな統計的検定の検出力とサンプルサイズの計算を行えるように設計された、無料のオープンソースウェブアプリケーションです。私たちの目標は、研究計画のための直感的でアクセスしやすいツールを提供することです。

このツールは、平均、比率、生存時間データなどの検定を含む、幅広いシナリオをサポートしています。このプロジェクトは[Next.js](https://nextjs.org)で構築されています。

## 紹介

研究者に愛用されていたサンプルサイズ計算ウェブサイト `powersandsamplesize.com` がサービスを停止したため、その機能を再現した[Open Power Samplesize](https://zarathucorp.github.io/open-powersamplsize/)を作成しました。

`Open Power Samplesize`では、従来のウェブサイトと同様に検出力とサンプルサイズを計算でき、**非劣性検定をサポートしていることが最大の特徴です**。ソースコードはオープンソースとして公開されており、[Zarathu GitHub](https://github.com/zarathucorp)で確認できます。Rユーザーの方は、[Rashnu](https://zarathucorp.github.io/rashnu/)パッケージで同じ機能をすべて提供していますので、ご参照ください。Rashnuは、生存時間分析のログランク検定に基づくサンプルサイズ計算（非劣性検定を含む）も提供しています。ありがとうございます。

## はじめに

ローカル環境で開発サーバーを実行するには、次の手順に従ってください。

1.  リポジトリをクローンします。
2.  依存関係をインストールします:
    ```bash
    npm install
    ```
3.  開発サーバーを実行します:
    ```bash
    npm run dev
    ```
4.  ブラウザで[http://localhost:3000](http://localhost:3000)を開き、結果を確認します。

### Dockerで実行する

または、Dockerを使用してアプリケーションを実行することもできます。

1.  Dockerイメージをビルドします。
    ```bash
    docker build -t open-powersamplesize .
    ```
2.  Dockerコンテナを実行します。
    ```bash
    docker run -p 3000:3000 open-powersamplesize
    ```
3.  ブラウザで[http://localhost:3000](http://localhost:3000)を開き、結果を確認します。

## デプロイ

このプロジェクトは、`main`ブランチにプッシュされるたびにGitHub Pagesに自動的にデプロイされます。デプロイワークフローは`.github/workflows/deploy.yml`に定義されています。

現在のサイトは、次のアドレスで確認できます:
`https://<GitHub-ユーザー名>.github.io/open-powersamplesize/`

### カスタムドメインの使用

デプロイされたサイトにカスタムドメインを使用するには、次の手順に従ってください。

1.  **GitHubリポジトリの設定**:
    *   リポジトリの**Settings** > **Pages**に移動します。
    *   「Custom domain」セクションに購入したドメイン名（例: `www.your-domain.com`）を入力し、**Save**をクリックします。

2.  **DNS設定**:
    *   ドメイン登録機関（例: GoDaddy、お名前.comなど）のウェブサイトに移動します。
    *   GitHub Pagesの設定ページの案内に従って、ドメインがGitHubを指すように`CNAME`または`A`レコードを作成します。

3.  **Next.js設定の変更**:
    *   カスタムドメインを使用する場合、`basePath`は不要になります。`next.config.ts`ファイルを次のように変更してください。

    ```typescript
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      output: "export",
    };

    export default nextConfig;
    ```

4.  **変更のデプロイ**:
    *   変更した`next.config.ts`ファイルを`main`ブランチにコミットしてプッシュします。GitHub Actionsが自動的に新しい設定でサイトを再ビルドしてデプロイします。
