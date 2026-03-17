/**
 * @fileoverview Dasbor admin Kateglo — ringkasan statistik dan navigasi cepat
 */

import { Link } from 'react-router-dom';
import { useStatistikAdmin } from '../../api/apiAdmin';
import { useAuth } from '../../context/authContext';
import HalamanAdmin from '../../components/tampilan/HalamanAdmin';
import { filterKelompokMenuRedaksi } from '../../constants/menuRedaksi';

function KartuMenuRedaksi({ item, jumlah, bisaLihatStatistik, isLoading }) {
  const statistik = item.statistik;
  const tampilkanStatistik = bisaLihatStatistik && Boolean(statistik);
  const label = item.dashboardLabel || item.label;
  const nilaiTampil = isLoading ? '…' : (jumlah == null ? '—' : jumlah.toLocaleString('id-ID'));

  return (
    <Link
      to={item.path}
      className="redaksi-dashboard-card"
    >
      <p className="redaksi-dashboard-card-label">{label}</p>
      {tampilkanStatistik ? (
        <p className={`redaksi-dashboard-card-value ${statistik.warna}`}>
          {nilaiTampil}
        </p>
      ) : null}
    </Link>
  );
}

function Dasbor() {
  const { punyaIzin, user } = useAuth();
  const izinPengguna = Array.isArray(user?.izin) ? user.izin : [];
  const hasIzin = (izin) => {
    if (typeof punyaIzin === 'function') return punyaIzin(izin);
    return izinPengguna.includes(izin);
  };
  const bisaLihatStatistik = hasIzin('lihat_statistik');
  const { data: statsResp, isLoading } = useStatistikAdmin({ enabled: bisaLihatStatistik });
  const stats = statsResp?.data;
  const kelompokTampil = filterKelompokMenuRedaksi(hasIzin);

  return (
    <HalamanAdmin judul="Dasbor">
      <div className="redaksi-dashboard-sections">
        {kelompokTampil.map((kelompok) => (
          <section key={kelompok.judul} className="redaksi-dashboard-section">
            <h3 className="redaksi-dashboard-section-title">{kelompok.judul}</h3>

            <div className="redaksi-dashboard-grid">
              {kelompok.items.map((item) => (
                <KartuMenuRedaksi
                  key={item.path}
                  item={item}
                  jumlah={item.statistik ? stats?.[item.statistik.key] : null}
                  bisaLihatStatistik={bisaLihatStatistik}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </HalamanAdmin>
  );
}

export default Dasbor;
