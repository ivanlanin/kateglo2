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
import { parsePositiveIntegerParam } from '../../utils/routeParam';

const nilaiAwal = { kode: '', nama: '', keterangan: '', izin_ids: [] };

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
    key: 'izin_kode',
    label: 'Daftar Izin',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">
        {potongTeks((item.izin_kode || []).join(', '), 70)}
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
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarPeranAdmin({ limit, offset, q });
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
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/peran', { replace: true });
    }
  };

  const bukaTambah = () => {
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/peran', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    if (!item?.id) {
      panel.bukaUntukSunting(item);
      return;
    }
    panel.bukaUntukSunting(item);
    if (panel.buka) return;
    navigate(`/redaksi/peran/${item.id}`);
  };

  const toggleIzin = (izinId) => {
    const id = Number(izinId);
    const izinIdsSekarang = Array.isArray(panel.data.izin_ids) ? panel.data.izin_ids.map((x) => Number(x)) : [];

    if (izinIdsSekarang.includes(id)) {
      panel.ubahField('izin_ids', izinIdsSekarang.filter((item) => item !== id));
      return;
    }

    panel.ubahField('izin_ids', [...izinIdsSekarang, id]);
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
      izin_ids: Array.isArray(panel.data.izin_ids)
        ? panel.data.izin_ids.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
        : [],
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
        onOffset={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Peran' : 'Sunting Peran'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />

        <div className="form-admin-group">
          <label className="form-admin-label">Izin</label>
          {isIzinLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat daftar izin …</p>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {kelompokIzin.map(([kelompok, items]) => (
                <div key={kelompok} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{kelompok}</p>
                  <div className="mt-2 space-y-2">
                    {items.map((izin) => {
                      const selected = (panel.data.izin_ids || []).map((id) => Number(id)).includes(Number(izin.id));
                      return (
                        <label
                          key={izin.id}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleIzin(izin.id)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <span className="font-medium">{izin.nama}</span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">{izin.kode}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
