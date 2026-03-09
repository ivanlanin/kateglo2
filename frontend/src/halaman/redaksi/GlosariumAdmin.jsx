/**
 * @fileoverview Halaman admin glosarium — daftar, cari, tambah, sunting istilah
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarGlosariumAdmin,
  useDetailGlosariumAdmin,
  useSimpanGlosarium,
  useHapusGlosarium,
  useOpsiBidangAdmin,
  useOpsiBahasaGlosariumAdmin,
  useOpsiSumberAdmin,
} from '../../api/apiAdmin';
import TataLetak from '../../komponen/bersama/TataLetak';
import { useAuth } from '../../context/authContext';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  BadgeStatus,
  opsiFilterStatusAktif,
  TabelAdmin,
  getApiErrorMessage,
  usePencarianAdmin,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SearchableSelectField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormulirAdmin';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';
import { ambilDaftarLookup, mapOpsiIdNama } from '../../utils/opsiUtils';

const nilaiAwal = {
  indonesia: '',
  asing: '',
  bidang_id: '',
  bidang: '',
  bahasa_id: '',
  sumber_id: '',
  sumber: '',
  aktif: 1,
};

const kolom = [
  {
    key: 'asing',
    label: 'Asing',
    render: (item) => {
      const asing = String(item.asing || '').trim();
      if (!asing) return '—';

      return (
        <Link
          to={`/glosarium/detail/${encodeURIComponent(asing)}`}
          onClick={(event) => event.stopPropagation()}
          className="font-medium italic text-blue-700 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          {asing}
        </Link>
      );
    },
  },
  { key: 'indonesia', label: 'Indonesia' },
  { key: 'bidang', label: 'Bidang' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function GlosariumAdmin() {
  const { punyaIzin } = useAuth();
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } =
    usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const defaultBahasaSudahDiisi = useRef(false);
  const [filterBidangDraft, setFilterBidangDraft] = useState('');
  const [filterBahasaDraft, setFilterBahasaDraft] = useState('');
  const [filterSumberDraft, setFilterSumberDraft] = useState('');
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterBahasa, setFilterBahasa] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const bisaTambah = punyaIzin('tambah_glosarium');
  const bisaEdit = punyaIzin('edit_glosarium');
  const bisaHapus = punyaIzin('hapus_glosarium');

  const { data: resp, isLoading, isError } = useDaftarGlosariumAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    bidangId: filterBidang,
    bahasaId: filterBahasa,
    sumberId: filterSumber,
    aktif: filterAktif,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailGlosariumAdmin(idDariPath);
  const { data: bidangResp } = useOpsiBidangAdmin();
  const { data: bahasaResp } = useOpsiBahasaGlosariumAdmin();
  const { data: sumberResp } = useOpsiSumberAdmin({ glosarium: '1' });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const daftarBidang = ambilDaftarLookup(bidangResp);
  const daftarBahasa = ambilDaftarLookup(bahasaResp);
  const daftarSumber = ambilDaftarLookup(sumberResp);
  const opsiBidang = mapOpsiIdNama(daftarBidang);
  const opsiBahasa = mapOpsiIdNama(daftarBahasa);
  const opsiSumber = mapOpsiIdNama(daftarSumber);

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanGlosarium();
  const hapus = useHapusGlosarium();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID istilah tidak valid.', sukses: '' });
    navigate('/redaksi/glosarium', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (!bisaEdit) return;
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting(detail);
    idEditTerbuka.current = detail.id;
  }, [bisaEdit, detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (!idDariPath || bisaEdit) return;
    navigate('/redaksi/glosarium', { replace: true });
  }, [bisaEdit, idDariPath, navigate]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Istilah tidak ditemukan.', sukses: '' });
    navigate('/redaksi/glosarium', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  useEffect(() => {
    if (!panel.buka) {
      defaultBahasaSudahDiisi.current = false;
      return;
    }
    if (!panel.modeTambah || panel.data.bahasa_id || defaultBahasaSudahDiisi.current) return;
    const defaultBahasa = daftarBahasa.find((item) => item.iso2 === 'en' || item.kode === 'Ing');
    if (defaultBahasa?.id) {
      panel.ubahField('bahasa_id', String(defaultBahasa.id));
      defaultBahasaSudahDiisi.current = true;
    }
  }, [daftarBahasa, panel]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/glosarium', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/glosarium', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/glosarium/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.asing?.trim() || !panel.data.indonesia?.trim()) {
      setPesan({ error: 'Istilah Asing dan Indonesia wajib diisi', sukses: '' });
      return;
    }
    if (!panel.data.bidang_id) {
      setPesan({ error: 'Bidang wajib dipilih', sukses: '' });
      return;
    }
    if (!panel.data.bahasa_id) {
      setPesan({ error: 'Bahasa wajib dipilih', sukses: '' });
      return;
    }
    if (!panel.data.sumber_id) {
      setPesan({ error: 'Sumber wajib dipilih', sukses: '' });
      return;
    }

    const payload = {
      ...panel.data,
      bidang_id: Number(panel.data.bidang_id),
      bahasa_id: Number(panel.data.bahasa_id),
      sumber_id: Number(panel.data.sumber_id),
    };

    simpan.mutate(payload, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => tutupPanel(), 600); },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus istilah ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' }),
    });
  };

  const handleCari = () => {
    setFilterBidang(filterBidangDraft);
    setFilterBahasa(filterBahasaDraft);
    setFilterSumber(filterSumberDraft);
    setFilterAktif(filterAktifDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterBidangDraft('');
    setFilterBahasaDraft('');
    setFilterSumberDraft('');
    setFilterAktifDraft('');
    setFilterBidang('');
    setFilterBahasa('');
    setFilterSumber('');
    setFilterAktif('');
    hapusCari();
  };

  return (
    <TataLetak mode="admin" judul="Glosarium" aksiJudul={bisaTambah ? <TombolAksiAdmin onClick={bukaTambah} /> : null}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari istilah …"
        filters={[
          {
            key: 'bidang',
            value: filterBidangDraft,
            onChange: setFilterBidangDraft,
            options: [{ value: '', label: '—Bidang—' }, ...opsiBidang],
            ariaLabel: 'Filter bidang glosarium',
            searchable: true,
            placeholder: '—Bidang—',
            searchPlaceholder: 'Cari bidang…',
          },
          {
            key: 'bahasa',
            value: filterBahasaDraft,
            onChange: setFilterBahasaDraft,
            options: [{ value: '', label: '—Bahasa—' }, ...opsiBahasa],
            ariaLabel: 'Filter bahasa glosarium',
            searchable: true,
            placeholder: '—Bahasa—',
            searchPlaceholder: 'Cari bahasa…',
          },
          {
            key: 'sumber',
            value: filterSumberDraft,
            onChange: setFilterSumberDraft,
            options: [{ value: '', label: '—Sumber—' }, ...opsiSumber],
            ariaLabel: 'Filter sumber glosarium',
            searchable: true,
            placeholder: '—Sumber—',
            searchPlaceholder: 'Cari sumber…',
          },
          {
            key: 'aktif',
            value: filterAktifDraft,
            onChange: setFilterAktifDraft,
            options: [
              { value: '', label: '—Status—' },
              ...opsiFilterStatusAktif.filter((item) => item.value !== ''),
            ],
            ariaLabel: 'Filter status glosarium',
          },
        ]}
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
        onKlikBaris={bisaEdit ? bukaSuntingDariDaftar : undefined}
      />

      {bisaEdit && (
        <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Glosarium' : 'Sunting Glosarium'}>
          <PesanForm error={pesan.error} sukses={pesan.sukses} />
          <InputField label="Asing" name="asing" value={panel.data.asing} onChange={panel.ubahField} required />
          <InputField label="Indonesia" name="indonesia" value={panel.data.indonesia} onChange={panel.ubahField} required />
          <SearchableSelectField
            label="Bidang"
            name="bidang_id"
            value={String(panel.data.bidang_id || '')}
            onChange={panel.ubahField}
            options={[{ value: '', label: '-- Pilih bidang --' }, ...opsiBidang]}
            required
            placeholder="-- Pilih bidang --"
            searchPlaceholder="Cari bidang…"
          />
          <SearchableSelectField
            label="Bahasa"
            name="bahasa_id"
            value={String(panel.data.bahasa_id || '')}
            onChange={panel.ubahField}
            options={[{ value: '', label: '-- Pilih bahasa --' }, ...opsiBahasa]}
            required
            placeholder="-- Pilih bahasa --"
            searchPlaceholder="Cari bahasa…"
          />
          <SearchableSelectField
            label="Sumber"
            name="sumber_id"
            value={String(panel.data.sumber_id || '')}
            onChange={panel.ubahField}
            options={[{ value: '', label: '-- Pilih sumber --' }, ...opsiSumber]}
            required
            placeholder="-- Pilih sumber --"
            searchPlaceholder="Cari sumber…"
          />
          <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
          <FormFooter
            onSimpan={handleSimpan}
            onBatal={tutupPanel}
            onHapus={bisaHapus ? handleHapus : undefined}
            isPending={simpan.isPending || hapus.isPending}
            modeTambah={panel.modeTambah}
          />
        </PanelGeser>
      )}
    </TataLetak>
  );
}

export default GlosariumAdmin;
