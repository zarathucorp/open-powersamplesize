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
    </footer>
  );
}
