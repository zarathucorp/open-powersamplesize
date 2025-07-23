import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t p-4 text-center text-sm">
      <p>
        Copyright © 2025{" "}
        <Link
          href="https://zarathu.com"
          target="_blank"
          className="underline"
        >
          Zarathu Co., Ltd.
        </Link>
        {" "}All rights reserved.
      </p>
      <p className="text-xs text-gray-500">
        Released under the{" "}
        <Link
          href="https://github.com/zarathucorp/open-powersamplesize/blob/main/LICENSE"
          target="_blank"
          className="underline"
        >
          MIT License
        </Link>
        .
      </p>
    </footer>
  );
}
