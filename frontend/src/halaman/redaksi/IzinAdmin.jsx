/**
 * @fileoverview Halaman admin izin — daftar, cari, tambah, sunting izin dan peran
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarIzinKelolaAdmin,
  useDetailIzinAdmin,
  useDaftarPeranUntukIzinAdmin,
  useSimpanIzinAdmin,
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

const nilaiAwal = { kode: '', nama: '', kelompok: '', peran_ids: [] };

const kolom = [
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  {
    key: 'kelompok',
    label: 'Kelompok',
    render: (item) => item.kelompok || '—',
  },
  {
    key: 'jumlah_peran',
    label: 'Peran',
    render: (item) => item.jumlah_peran ?? 0,
  },
  {
    key: 'peran_kode',
    label: 'Daftar Peran',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">
        {potongTeks((item.peran_kode || []).join(', '), 70)}
      </span>
    ),
  },
];

function IzinAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarIzinKelolaAdmin({ limit, offset, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailIzinAdmin(idDariPath);
  const { data: peranResp, isLoading: isPeranLoading } = useDaftarPeranUntukIzinAdmin();

  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const daftarPeran = useMemo(() => peranResp?.data || [], [peranResp]);

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanIzinAdmin();
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID izin tidak valid.', sukses: '' });
    navigate('/redaksi/izin', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting({ ...detail, peran_ids: detail.peran_ids || [] });
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Izin tidak ditemukan.', sukses: '' });
    navigate('/redaksi/izin', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/izin', { replace: true });
    }
  };

  const bukaTambah = () => {
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/izin', { replace: true });
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
    navigate(`/redaksi/izin/${item.id}`);
  };

  const togglePeran = (peranId) => {
    const id = Number(peranId);
    const peranIdsSekarang = Array.isArray(panel.data.peran_ids) ? panel.data.peran_ids.map((x) => Number(x)) : [];

    if (peranIdsSekarang.includes(id)) {
      panel.ubahField('peran_ids', peranIdsSekarang.filter((item) => item !== id));
      return;
    }

    panel.ubahField('peran_ids', [...peranIdsSekarang, id]);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kode', label: 'Kode izin' },
      { name: 'nama', label: 'Nama izin' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    const payload = {
      ...panel.data,
      peran_ids: Array.isArray(panel.data.peran_ids)
        ? panel.data.peran_ids.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
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
    <TataLetak mode="admin" judul="Izin" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari kode atau nama izin …"
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

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Izin' : 'Sunting Izin'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <TextareaField label="Kelompok" name="kelompok" value={panel.data.kelompok} onChange={panel.ubahField} rows={2} />

        <div className="form-admin-group">
          <label className="form-admin-label">Peran</label>
          {isPeranLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat daftar peran …</p>
          ) : (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              {daftarPeran.map((peran) => {
                const selected = (panel.data.peran_ids || []).map((id) => Number(id)).includes(Number(peran.id));
                return (
                  <label
                    key={peran.id}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePeran(peran.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <span className="font-medium">{peran.nama}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{peran.kode}</span>
                    </span>
                  </label>
                );
              })}
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

export default IzinAdmin;
