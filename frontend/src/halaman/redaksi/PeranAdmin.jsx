/**
 * @fileoverview Halaman admin peran — daftar, cari, tambah, sunting peran dan izin
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarPeranAdmin,
  useDetailPeranAdmin,
  useDaftarIzinAdmin,
  useSimpanPeranAdmin,
} from '../../api/apiAdmin';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  BadgeStatus,
  TabelAdmin,
  getApiErrorMessage,
  potongTeks,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  TextareaField,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';
import KotakCentang from '../../komponen/redaksi/KotakCentang';
import { useSelectableIds } from '../../hooks/redaksi/useSelectableIds';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

const nilaiAwal = { kode: '', nama: '', keterangan: '', akses_redaksi: false, izin_ids: [] };

const kolom = [
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  {
    key: 'jumlah_pengguna',
    label: 'Pengguna',
    render: (item) => item.jumlah_pengguna ?? 0,
  },
  {
    key: 'jumlah_izin',
    label: 'Izin',
    render: (item) => item.jumlah_izin ?? 0,
  },
  {
    key: 'akses_redaksi',
    label: 'Redaksi',
    render: (item) => <BadgeStatus aktif={item.akses_redaksi} />,
  },
  {
    key: 'izin_nama',
    label: 'Daftar Izin',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">
        {potongTeks((item.izin_nama || []).join(', '), 70)}
      </span>
    ),
  },
];

function kelompokIzinLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Lainnya';
  return raw;
}

function PeranAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarPeranAdmin({ limit, cursor, direction, lastPage, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailPeranAdmin(idDariPath);
  const { data: izinResp, isLoading: isIzinLoading } = useDaftarIzinAdmin();

  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const daftarIzin = useMemo(() => izinResp?.data || [], [izinResp]);

  const kelompokIzin = useMemo(() => {
    const grouped = daftarIzin.reduce((acc, izin) => {
      const key = kelompokIzinLabel(izin.kelompok);
      if (!acc[key]) acc[key] = [];
      acc[key].push(izin);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'id'));
  }, [daftarIzin]);

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanPeranAdmin();
  const { selectedIds: izinIdsTerpilih, hasId: hasIzin, toggleId: toggleIzin } = useSelectableIds(
    panel.data.izin_ids,
    (nextIds) => panel.ubahField('izin_ids', nextIds)
  );
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID peran tidak valid.', sukses: '' });
    navigate('/redaksi/peran', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting({ ...detail, izin_ids: detail.izin_ids || [] });
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Peran tidak ditemukan.', sukses: '' });
    navigate('/redaksi/peran', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/peran', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/peran', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    item?.id && navigate(`/redaksi/peran/${item.id}`);
  };

  const toggleAksesRedaksi = () => {
    panel.ubahField('akses_redaksi', !panel.data.akses_redaksi);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kode', label: 'Kode peran' },
      { name: 'nama', label: 'Nama peran' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    const payload = {
      ...panel.data,
      akses_redaksi: panel.data.akses_redaksi,
      izin_ids: panel.data.izin_ids.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0),
    };

    simpan.mutate(payload, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' });
      },
    });
  };

  return (
    <TataLetak mode="admin" judul="Peran" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari kode atau nama peran …"
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Peran' : 'Sunting Peran'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />

        <div className="form-admin-group">
          <label className="form-admin-label">Redaksi</label>
          <button
            type="button"
            onClick={toggleAksesRedaksi}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              panel.data.akses_redaksi ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                panel.data.akses_redaksi ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {panel.data.akses_redaksi ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <KotakCentang
          label="Izin"
          isLoading={isIzinLoading}
          loadingText="Memuat daftar izin …"
          groups={kelompokIzin.map(([kelompok, items]) => ({
            key: kelompok,
            title: kelompok,
            items,
          }))}
          hasSelected={hasIzin}
          onToggle={toggleIzin}
          selectedIds={izinIdsTerpilih}
        />

        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          isPending={simpan.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </TataLetak>
  );
}

export default PeranAdmin;
