import Link from "next/link";
import { Competition } from "@prisma/client";

interface Props { competitions: Competition[] }

export default function AdminCompetitionList({ competitions }: Props) {
  return (
    <div className="space-y-4">
      {competitions.map(c => (
        <div key={c.id} className="border p-4 rounded flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">{c.title}</h2>
            <p>Ends: {new Date(c.endDate).toLocaleString()}</p>
          </div>
          <Link href={`/admin/competition/${c.id}`} className="bg-gradient-primary text-white font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
            Manage
          </Link>
        </div>
      ))}
    </div>
  );
}
