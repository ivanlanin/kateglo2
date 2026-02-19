/**
 * @fileoverview Dasbor admin Kateglo — ringkasan statistik dan navigasi cepat
 */

import { Link } from 'react-router-dom';
import { useStatistikAdmin } from '../../api/apiAdmin';
import { useAuth } from '../../context/authContext';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';

const kartuData = [
  { key: 'entri', label: 'Entri Kamus', warna: 'text-blue-600', link: '/redaksi/kamus' },
  { key: 'tesaurus', label: 'Entri Tesaurus', warna: 'text-emerald-600', link: '/redaksi/tesaurus' },
  { key: 'glosarium', label: 'Entri Glosarium', warna: 'text-amber-600', link: '/redaksi/glosarium' },
  { key: 'komentar', label: 'Komentar', warna: 'text-rose-600', link: '/redaksi/komentar' },
  { key: 'label', label: 'Label', warna: 'text-cyan-600', link: '/redaksi/label', adminSaja: true },
  { key: 'pengguna', label: 'Pengguna', warna: 'text-purple-600', link: '/redaksi/pengguna', adminSaja: true },
];

function KartuStatistik({ label, jumlah, warna, link, isLoading }) {
  return (
    <Link
      to={link}
      className="beranda-feature-card p-6"
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
  const { adalahAdmin } = useAuth();
  const stats = statsResp?.data;
  const kartuTampil = kartuData.filter((k) => !k.adminSaja || adalahAdmin);

  return (
    <TataLetakAdmin judul="Dasbor">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {kartuTampil.map((k) => (
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
