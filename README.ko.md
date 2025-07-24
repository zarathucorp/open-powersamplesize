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

*Open Power Samplesize*는 연구자와 학생들이 다양한 통계 검정에 대한 검정력 및 표본 크기 계산을 수행할 수 있도록 설계된 무료 오픈소스 웹 애플리케이션입니다. 저희 목표는 연구 설계를 위한 직관적이고 접근하기 쉬운 도구를 제공하는 것입니다.

이 도구는 평균, 비율, 생존 시간 데이터 등에 대한 검정을 포함한 광범위한 시나리오를 지원합니다. 이 프로젝트는 [Next.js](https://nextjs.org)로 구축되었습니다.

## 소개

 연구자들에게 사랑 받던 샘플 수 계산웹 `powersandsamplesize.com` 이 서비스 중단되어, 해당 웹의 기능을 재현한  [Open Power Samplesize](https://zarathucorp.github.io/open-powersamplsize/)를 만들었습니다.

`Open Power Samplesize` 에서 기존웹과 동일하게 Power 와 Sample size를 계산할 수 있으며, 
**비열등성 검정을 지원하는 것이 가장 큰 특징입니다**.  소스코드는 오픈소스로 공개하여  [Zarathu GitHub](https://github.com/zarathucorp)에서 확인할 수 있습니다. R 이용자분들은  [Rashnu](https://zarathucorp.github.io/rashnu/)  패키지에서 동일한 모든 기능을 제공하니 참고 부탁드리고, Rashnu 는 생존분석 log-rank test 기반의 샘플 수 계산(비열등성 검정 포함) 도 제공합니다. 감사합니다.

## 시작하기

로컬 환경에서 개발 서버를 실행하려면 다음 단계를 따르세요.

1.  저장소를 복제합니다.
2.  의존성을 설치합니다:
    ```bash
    npm install
    ```
3.  개발 서버를 실행합니다:
    ```bash
    npm run dev
    ```
4.  브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인합니다.

### Docker로 실행하기

또는 Docker를 사용하여 애플리케이션을 실행할 수 있습니다.

1.  Docker 이미지를 빌드합니다.
    ```bash
    docker build -t open-powersamplesize .
    ```
2.  Docker 컨테이너를 실행합니다.
    ```bash
    docker run -p 3000:3000 open-powersamplesize
    ```
3.  브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인합니다.

## 배포

이 프로젝트는 `main` 브랜치에 푸시될 때마다 GitHub Pages에 자동으로 배포됩니다. 배포 워크플로우는 `.github/workflows/deploy.yml`에 정의되어 있습니다.

현재 사이트는 다음 주소에서 확인할 수 있습니다:
`https://<GitHub-사용자명>.github.io/open-powersamplesize/`

### 사용자 정의 도메인 사용하기

배포된 사이트에 사용자 정의 도메인을 사용하려면 다음 단계를 따르세요.

1.  **GitHub 저장소 설정**:
    *   저장소의 **Settings** > **Pages**로 이동합니다.
    *   "Custom domain" 섹션에 구매한 도메인 이름(예: `www.your-domain.com`)을 입력하고 **Save**를 클릭합니다.

2.  **DNS 설정**:
    *   도메인 등록기관(예: GoDaddy, 가비아 등) 웹사이트로 이동합니다.
    *   GitHub Pages 설정 페이지의 안내에 따라 도메인이 GitHub를 가리키도록 `CNAME` 또는 `A` 레코드를 생성합니다.

3.  **Next.js 설정 수정**:
    *   사용자 정의 도메인을 사용하면 더 이상 `basePath`가 필요하지 않습니다. `next.config.ts` 파일을 다음과 같이 수정하세요.

    ```typescript
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      output: "export",
    };

    export default nextConfig;
    ```

4.  **변경사항 배포**:
    *   수정된 `next.config.ts` 파일을 `main` 브랜치에 커밋하고 푸시합니다. GitHub Actions가 자동으로 새 설정으로 사이트를 다시 빌드하고 배포합니다.
