"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function TestBucketsPage() {
  const [buckets, setBuckets] = useState<Array<{ id: string; name: string; public: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listBuckets = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        setError(error.message);
      } else {
        setBuckets(data || []);
      }
    };
    listBuckets();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Buckets</h1>
      {error && <p className="text-red-500">Error: {error}</p>}
      <ul className="list-disc pl-5">
        {buckets.map((bucket) => (
          <li key={bucket.id}>
            <strong>{bucket.name}</strong> (Public: {bucket.public ? "Yes" : "No"})
          </li>
        ))}
      </ul>
    </div>
  );
}
