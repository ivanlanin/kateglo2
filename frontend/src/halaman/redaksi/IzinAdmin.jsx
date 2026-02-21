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
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';
import KotakCentang from '../../komponen/redaksi/KotakCentang';
import { useSelectableIds } from '../../hooks/redaksi/useSelectableIds';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

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
    key: 'peran_nama',
    label: 'Daftar Peran',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">
        {potongTeks((item.peran_nama || []).join(', '), 70)}
      </span>
    ),
  },
];

function IzinAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarIzinKelolaAdmin({ limit, cursor, direction, lastPage, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailIzinAdmin(idDariPath);
  const { data: peranResp, isLoading: isPeranLoading } = useDaftarPeranUntukIzinAdmin();

  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const daftarPeran = useMemo(() => peranResp?.data || [], [peranResp]);

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanIzinAdmin();
  const { selectedIds: peranIdsTerpilih, hasId: hasPeran, toggleId: togglePeran } = useSelectableIds(
    panel.data.peran_ids,
    (nextIds) => panel.ubahField('peran_ids', nextIds)
  );
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
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/izin', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/izin', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    item?.id && navigate(`/redaksi/izin/${item.id}`);
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
      peran_ids: panel.data.peran_ids.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0),
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
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Izin' : 'Sunting Izin'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <InputField label="Kelompok" name="kelompok" value={panel.data.kelompok} onChange={panel.ubahField} />

        <KotakCentang
          label="Peran"
          isLoading={isPeranLoading}
          loadingText="Memuat daftar peran …"
          items={daftarPeran}
          hasSelected={hasPeran}
          onToggle={togglePeran}
          selectedIds={peranIdsTerpilih}
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

export default IzinAdmin;
