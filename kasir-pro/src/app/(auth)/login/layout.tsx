import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Akun Toko | KADAI",
  description: "Masuk ke portal kasir dan dashboard operasional KADAI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
