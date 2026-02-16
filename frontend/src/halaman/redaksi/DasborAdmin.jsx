/**
 * @fileoverview Dasbor admin Kateglo — ringkasan statistik dan navigasi cepat
 */

import { Link } from 'react-router-dom';
import { useStatistikAdmin } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/admin/TataLetakAdmin';

const kartuData = [
  { key: 'lema', label: 'Lema', warna: 'text-blue-600', link: '/admin/kamus' },
  { key: 'tesaurus', label: 'Tesaurus', warna: 'text-emerald-600', link: '/admin/tesaurus' },
  { key: 'glosarium', label: 'Glosarium', warna: 'text-amber-600', link: '/admin/glosarium' },
  { key: 'pengguna', label: 'Pengguna', warna: 'text-purple-600', link: '/admin/pengguna' },
];

function KartuStatistik({ label, jumlah, warna, link, isLoading }) {
  return (
    <Link
      to={link}
      className="bg-white dark:bg-dark-bg-elevated p-6 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </h3>
      <p className={`text-3xl font-bold ${warna}`}>
        {isLoading ? '…' : (jumlah?.toLocaleString('id-ID') ?? '—')}
      </p>
    </Link>
  );
}

function DasborAdmin() {
  const { data: statsResp, isLoading } = useStatistikAdmin();
  const stats = statsResp?.data;

  return (
    <TataLetakAdmin judul="Dasbor">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kartuData.map((k) => (
          <KartuStatistik
            key={k.key}
            label={k.label}
            jumlah={stats?.[k.key]}
            warna={k.warna}
            link={k.link}
            isLoading={isLoading}
          />
        ))}
      </div>
    </TataLetakAdmin>
  );
}

export default DasborAdmin;
