/**
 * @fileoverview Halaman admin tesaurus — daftar, cari, tambah, sunting entri tesaurus
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDaftarTesaurusAdmin, useDetailTesaurusAdmin, useSimpanTesaurus, useHapusTesaurus } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariTambahAdmin,
  InfoTotal,
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
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

const nilaiAwal = { lema: '', sinonim: '', antonim: '', aktif: 1 };

const kolom = [
  {
    key: 'lema',
    label: 'Lema',
    render: (item) => (
      <span className="font-medium text-gray-800 dark:text-gray-100">
        {item.lema}
      </span>
    ),
  },
  {
    key: 'sinonim',
    label: 'Sinonim',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.sinonim, 60)}</span>
    ),
  },
  {
    key: 'antonim',
    label: 'Antonim',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.antonim, 60)}</span>
    ),
  },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function TesaurusAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);
  const idEdit = Number.parseInt(idParam || '', 10);
  const idDariPath = Number.isInteger(idEdit) && idEdit > 0 ? idEdit : null;
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarTesaurusAdmin({ limit, offset, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailTesaurusAdmin(idDariPath);
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanTesaurus();
  const hapus = useHapusTesaurus();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID entri tidak valid.', sukses: '' });
    navigate('/redaksi/tesaurus', { replace: true });
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
    setPesan({ error: 'Entri tidak ditemukan.', sukses: '' });
    navigate('/redaksi/tesaurus', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/tesaurus', { replace: true });
    }
  };

  const bukaTambah = () => {
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/tesaurus', { replace: true });
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
    navigate(`/redaksi/tesaurus/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [{ name: 'lema', label: 'Lema' }]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }
    simpan.mutate(panel.data, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => tutupPanel(), 600); },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus entri tesaurus ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' }),
    });
  };

  return (
    <TataLetakAdmin judul="Tesaurus">
      <KotakCariTambahAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari tesaurus …"
        onTambah={bukaTambah}
      />
      <InfoTotal q={q} total={total} label="entri" />
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

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Tesaurus' : 'Sunting Tesaurus'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Lema" name="lema" value={panel.data.lema} onChange={panel.ubahField} required />
        <TextareaField label="Sinonim" name="sinonim" value={panel.data.sinonim} onChange={panel.ubahField} placeholder="Pisahkan dengan titik koma (;)" />
        <TextareaField label="Antonim" name="antonim" value={panel.data.antonim} onChange={panel.ubahField} placeholder="Pisahkan dengan titik koma (;)" />
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

export default TesaurusAdmin;
