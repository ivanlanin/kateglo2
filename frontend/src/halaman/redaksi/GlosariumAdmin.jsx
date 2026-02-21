/**
 * @fileoverview Halaman admin glosarium — daftar, cari, tambah, sunting istilah
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarGlosariumAdmin,
  useDetailGlosariumAdmin,
  useSimpanGlosarium,
  useHapusGlosarium,
  useDaftarBidangGlosariumAdmin,
  useDaftarSumberGlosariumAdmin,
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
  SelectField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

const nilaiAwal = {
  indonesia: '',
  asing: '',
  bidang_id: '',
  bidang: '',
  bahasa: 'en',
  sumber_id: '',
  sumber: '',
  aktif: 1,
};

const opsiBahasa = [
  { value: 'en', label: 'Inggris' },
  { value: 'id', label: 'Indonesia' },
  { value: 'nl', label: 'Belanda' },
  { value: 'ar', label: 'Arab' },
  { value: 'ja', label: 'Jepang' },
  { value: 'de', label: 'Jerman' },
  { value: 'fr', label: 'Prancis' },
];

const kolom = [
  {
    key: 'indonesia',
    label: 'Indonesia',
    render: (item) => (
      <span className="font-medium text-gray-800 dark:text-gray-100">
        {item.indonesia}
      </span>
    ),
  },
  { key: 'asing', label: 'Asing' },
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
  const [filterBidangDraft, setFilterBidangDraft] = useState('');
  const [filterSumberDraft, setFilterSumberDraft] = useState('');
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
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
    sumberId: filterSumber,
    aktif: filterAktif,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailGlosariumAdmin(idDariPath);
  const { data: bidangResp } = useDaftarBidangGlosariumAdmin({ limit: 200, aktif: '1' });
  const { data: sumberResp } = useDaftarSumberGlosariumAdmin({ limit: 200, aktif: '1' });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const opsiBidang = (bidangResp?.data || []).map((item) => ({ value: String(item.id), label: item.nama }));
  const opsiSumber = (sumberResp?.data || []).map((item) => ({ value: String(item.id), label: item.nama }));

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
    if (!panel.data.indonesia?.trim() || !panel.data.asing?.trim()) {
      setPesan({ error: 'Istilah Indonesia dan Asing wajib diisi', sukses: '' });
      return;
    }
    if (!panel.data.bidang_id) {
      setPesan({ error: 'Bidang wajib dipilih', sukses: '' });
      return;
    }
    if (!panel.data.sumber_id) {
      setPesan({ error: 'Sumber wajib dipilih', sukses: '' });
      return;
    }

    const payload = {
      ...panel.data,
      bidang_id: Number(panel.data.bidang_id),
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
    setFilterSumber(filterSumberDraft);
    setFilterAktif(filterAktifDraft);
    kirimCari(cari);
  };

  return (
    <TataLetak mode="admin" judul="Glosarium" aksiJudul={bisaTambah ? <TombolAksiAdmin onClick={bukaTambah} /> : null}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={hapusCari}
        placeholder="Cari istilah …"
        filters={[
          {
            key: 'bidang',
            value: filterBidangDraft,
            onChange: setFilterBidangDraft,
            options: [{ value: '', label: '—Bidang—' }, ...opsiBidang],
            ariaLabel: 'Filter bidang glosarium',
          },
          {
            key: 'sumber',
            value: filterSumberDraft,
            onChange: setFilterSumberDraft,
            options: [{ value: '', label: '—Sumber—' }, ...opsiSumber],
            ariaLabel: 'Filter sumber glosarium',
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
          <InputField label="Indonesia" name="indonesia" value={panel.data.indonesia} onChange={panel.ubahField} required />
          <InputField label="Asing" name="asing" value={panel.data.asing} onChange={panel.ubahField} required />
          <SelectField
            label="Bidang"
            name="bidang_id"
            value={String(panel.data.bidang_id || '')}
            onChange={panel.ubahField}
            options={[{ value: '', label: '-- Pilih bidang --' }, ...opsiBidang]}
          />
          <SelectField label="Bahasa" name="bahasa" value={panel.data.bahasa} onChange={panel.ubahField} options={opsiBahasa} />
          <SelectField
            label="Sumber"
            name="sumber_id"
            value={String(panel.data.sumber_id || '')}
            onChange={panel.ubahField}
            options={[{ value: '', label: '-- Pilih sumber --' }, ...opsiSumber]}
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
