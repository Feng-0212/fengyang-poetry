// ============================================================
// 四时墨苑 - 墨韵阁（主页 /）
// ============================================================
"use client";

import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollectionGrid from "@/components/collections/CollectionGrid";
import HeroSection from "@/components/collections/HeroSection";
import { useCollections } from "@/hooks/useCollection";

export default function HomePage() {
  const { collections, loading } = useCollections();

  return (
    <div className="paper-texture min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 page-container">
        <HeroSection />
        <CollectionGrid collections={collections} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}
