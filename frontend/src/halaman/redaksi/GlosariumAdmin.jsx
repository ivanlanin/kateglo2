/**
 * @fileoverview Halaman admin glosarium — daftar, cari, tambah, sunting istilah
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDaftarGlosariumAdmin, useDetailGlosariumAdmin, useSimpanGlosarium, useHapusGlosarium } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariAdmin,
  TombolAksiAdmin,
  BadgeStatus,
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

const nilaiAwal = { indonesia: '', asing: '', bidang: '', bahasa: 'en', sumber: '', aktif: 1 };

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
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);
  const idEdit = Number.parseInt(idParam || '', 10);
  const idDariPath = Number.isInteger(idEdit) && idEdit > 0 ? idEdit : null;
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarGlosariumAdmin({ limit, offset, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailGlosariumAdmin(idDariPath);
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

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
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting(detail);
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

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
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/glosarium', { replace: true });
    }
  };

  const bukaTambah = () => {
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/glosarium', { replace: true });
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
    navigate(`/redaksi/glosarium/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.indonesia?.trim() || !panel.data.asing?.trim()) {
      setPesan({ error: 'Istilah Indonesia dan Asing wajib diisi', sukses: '' });
      return;
    }
    simpan.mutate(panel.data, {
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

  return (
    <TataLetakAdmin judul="Glosarium" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <KotakCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari istilah …"
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

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Glosarium' : 'Sunting Glosarium'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Indonesia" name="indonesia" value={panel.data.indonesia} onChange={panel.ubahField} required />
        <InputField label="Asing" name="asing" value={panel.data.asing} onChange={panel.ubahField} required />
        <InputField label="Bidang" name="bidang" value={panel.data.bidang} onChange={panel.ubahField} />
        <SelectField label="Bahasa" name="bahasa" value={panel.data.bahasa} onChange={panel.ubahField} options={opsiBahasa} />
        <InputField label="Sumber" name="sumber" value={panel.data.sumber} onChange={panel.ubahField} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default GlosariumAdmin;
