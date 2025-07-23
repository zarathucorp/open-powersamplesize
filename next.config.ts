import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const repo = "open-powersamplesize";

const nextConfig: NextConfig = {
	output: "export",
	...(isProd && {
		assetPrefix: `/${repo}/`,
		basePath: `/${repo}`,
	}),
};

export default nextConfig;
