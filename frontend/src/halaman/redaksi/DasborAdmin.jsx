/**
 * @fileoverview Dasbor admin Kateglo — ringkasan statistik dan navigasi cepat
 */

import { Link } from 'react-router-dom';
import { useStatistikAdmin } from '../../api/apiAdmin';
import { useAuth } from '../../context/authContext';
import TataLetak from '../../komponen/bersama/TataLetak';

const kartuData = [
  { key: 'entri', label: 'Entri Kamus', warna: 'text-blue-600', link: '/redaksi/kamus', izin: 'lihat_entri' },
  { key: 'tesaurus', label: 'Entri Tesaurus', warna: 'text-emerald-600', link: '/redaksi/tesaurus', izin: 'lihat_tesaurus' },
  { key: 'glosarium', label: 'Entri Glosarium', warna: 'text-amber-600', link: '/redaksi/glosarium', izin: 'lihat_glosarium' },
  { key: 'etimologi', label: 'Entri Etimologi', warna: 'text-indigo-600', link: '/redaksi/etimologi', izin: 'kelola_etimologi' },
  { key: 'susunKataHarian', label: 'Susun Kata Harian', warna: 'text-lime-600', link: '/redaksi/susun-kata-harian', izin: 'kelola_susun_kata' },
  { key: 'susunKataBebas', label: 'Susun Kata Bebas', warna: 'text-green-600', link: '/redaksi/susun-kata-bebas', izin: 'kelola_susun_kata' },
  { key: 'komentar', label: 'Komentar', warna: 'text-rose-600', link: '/redaksi/komentar', izin: 'kelola_komentar' },
  { key: 'pencarian', label: 'Pencarian', warna: 'text-orange-600', link: '/redaksi/pencarian', izin: 'lihat_pencarian' },
  { key: 'auditMakna', label: 'Audit Makna', warna: 'text-fuchsia-600', link: '/redaksi/audit-makna', izin: 'audit_makna' },
  { key: 'auditTagar', label: 'Audit Tagar', warna: 'text-violet-600', link: '/redaksi/audit-tagar', izin: 'audit_tagar' },
  { key: 'tagar', label: 'Tagar', warna: 'text-pink-600', link: '/redaksi/tagar', izin: 'kelola_tagar' },
  { key: 'label', label: 'Label', warna: 'text-cyan-600', link: '/redaksi/label', izin: 'kelola_label' },
  { key: 'bidang', label: 'Bidang', warna: 'text-sky-600', link: '/redaksi/bidang', izin: 'kelola_bidang' },
  { key: 'sumber', label: 'Sumber', warna: 'text-teal-600', link: '/redaksi/sumber', izin: 'kelola_sumber' },
  { key: 'pengguna', label: 'Pengguna', warna: 'text-purple-600', link: '/redaksi/pengguna', izin: 'kelola_pengguna' },
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
  const { punyaIzin, user } = useAuth();
  const stats = statsResp?.data;
  const izinPengguna = Array.isArray(user?.izin) ? user.izin : [];
  const hasIzin = (izin) => {
    if (typeof punyaIzin === 'function') return punyaIzin(izin);
    return izinPengguna.includes(izin);
  };
  const kartuTampil = kartuData.filter((k) => hasIzin(k.izin));

  return (
    <TataLetak mode="admin" judul="Dasbor">
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
    </TataLetak>
  );
}

export default DasborAdmin;
