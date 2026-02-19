/**
 * @fileoverview Halaman kelola pengguna (admin)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDaftarPengguna, useDetailPengguna, useDaftarPeran, useSimpanPengguna } from '../../api/apiAdmin';
import { formatLocalDateTime } from '../../utils/formatTanggalLokal';
import { parsePositiveIntegerParam } from '../../utils/routeParam';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  BarisFilterCariAdmin,
  TabelAdmin,
  BadgeStatus,
  getApiErrorMessage,
  opsiFilterStatusAktif,
  usePencarianAdmin,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

function formatTanggal(dateStr) {
  return formatLocalDateTime(dateStr, { fallback: '—', separator: ', ' });
}

function PenggunaAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(20);
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: penggunaResp, isLoading, isError } = useDaftarPengguna({
    limit,
    offset,
    q,
    aktif: filterAktif,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailPengguna(idDariPath);
  const { data: peranResp } = useDaftarPeran();
  const simpanPengguna = useSimpanPengguna();

  const daftarPengguna = penggunaResp?.data || [];
  const total = penggunaResp?.total || 0;
  const daftarPeran = useMemo(() => peranResp?.data || [], [peranResp]);

  const panel = useFormPanel({ nama: '', aktif: 1, peran_id: '' });
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const mapPenggunaUntukPanel = useCallback((item) => {
    const peranId = item?.peran_id || daftarPeran.find((r) => r.kode === item?.peran_kode)?.id || '';
    return { ...item, peran_id: peranId };
  }, [daftarPeran]);

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID pengguna tidak valid.', sukses: '' });
    navigate('/redaksi/pengguna', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting(mapPenggunaUntukPanel(detail));
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, mapPenggunaUntukPanel, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Pengguna tidak ditemukan.', sukses: '' });
    navigate('/redaksi/pengguna', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/pengguna', { replace: true });
    }
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    simpanPengguna.mutate(panel.data, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => tutupPanel(), 600); },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleBukaSunting = (item) => {
    if (!item?.id) {
      panel.bukaUntukSunting(mapPenggunaUntukPanel(item));
      return;
    }
    panel.bukaUntukSunting(mapPenggunaUntukPanel(item));
    if (panel.buka) return;
    navigate(`/redaksi/pengguna/${item.id}`);
  };

  const handleCari = () => {
    setFilterAktif(filterAktifDraft);
    kirimCari(cari);
  };

  const opsiPeran = [
    { value: '', label: '— Pilih peran —' },
    ...daftarPeran.map((r) => ({ value: r.id, label: r.nama })),
  ];

  const kolom = [
    {
      key: 'nama',
      label: 'Pengguna',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.foto ? (
            <img
              src={p.foto}
              alt={p.nama}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {p.nama?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-white">{p.nama}</span>
        </div>
      ),
    },
    { key: 'surel', label: 'Surel' },
    {
      key: 'peran_kode',
      label: 'Peran',
      render: (p) => p.peran_nama || p.peran_kode || '—',
    },
    {
      key: 'aktif',
      label: 'Status',
      render: (p) => <BadgeStatus aktif={p.aktif} />,
    },
    {
      key: 'login_terakhir',
      label: 'Masuk Terakhir',
      render: (p) => formatTanggal(p.login_terakhir),
    },
  ];

  return (
    <TataLetakAdmin judul="Pengguna">
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={hapusCari}
        placeholder="Cari pengguna, surel, atau peran …"
        filters={[
          {
            key: 'aktif',
            value: filterAktifDraft,
            onChange: setFilterAktifDraft,
            options: opsiFilterStatusAktif,
            ariaLabel: 'Filter status pengguna',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftarPengguna}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        onOffset={setOffset}
        onKlikBaris={handleBukaSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul="Sunting Pengguna">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <div className="form-admin-group">
          <label className="form-admin-label">Surel</label>
          <p className="text-sm text-gray-700 dark:text-gray-300">{panel.data.surel || '—'}</p>
        </div>
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} />
        <SelectField label="Peran" name="peran_id" value={panel.data.peran_id} onChange={panel.ubahField} options={opsiPeran} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          isPending={simpanPengguna.isPending}
          modeTambah={false}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default PenggunaAdmin;
