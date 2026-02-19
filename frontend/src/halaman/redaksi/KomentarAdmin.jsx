/**
 * @fileoverview Halaman admin komentar kamus — daftar, cari, dan moderasi aktif
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDaftarKomentarAdmin, useDetailKomentarAdmin, useSimpanKomentarAdmin } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariAdmin,
  InfoTotal,
  TabelAdmin,
  BadgeStatus,
  getApiErrorMessage,
  usePencarianAdmin,
  potongTeks,
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
import { formatTanggalKomentar } from '../../utils/formatTanggalKomentar';

const nilaiAwal = {
  id: null,
  indeks: '',
  pengguna_nama: '',
  pengguna_surel: '',
  komentar: '',
  aktif: 0,
};

const kolom = [
  {
    key: 'tanggal',
    label: 'Tanggal',
    render: (item) => formatTanggalKomentar(item.updated_at || item.created_at),
  },
  { key: 'indeks', label: 'Indeks' },
  {
    key: 'komentar',
    label: 'Komentar',
    render: (item) => <span className="whitespace-pre-line">{potongTeks(item.komentar, 120)}</span>,
  },
  { key: 'pengguna_nama', label: 'Pengguna' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function KomentarAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(50);
  const idEdit = Number.parseInt(idParam || '', 10);
  const idDariPath = Number.isInteger(idEdit) && idEdit > 0 ? idEdit : null;
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const { data: resp, isLoading, isError } = useDaftarKomentarAdmin({ limit, offset, q });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailKomentarAdmin(idDariPath);
  const simpan = useSimpanKomentarAdmin();
  const panel = useFormPanel(nilaiAwal);
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID komentar tidak valid.', sukses: '' });
    navigate('/redaksi/komentar', { replace: true });
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
    setPesan({ error: 'Komentar tidak ditemukan.', sukses: '' });
    navigate('/redaksi/komentar', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/komentar', { replace: true });
    }
  };

  const bukaSuntingDariDaftar = (item) => {
    if (!item?.id) {
      panel.bukaUntukSunting(item);
      return;
    }
    panel.bukaUntukSunting(item);
    if (panel.buka) return;
    navigate(`/redaksi/komentar/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [{ name: 'komentar', label: 'Komentar' }]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Komentar berhasil diperbarui' });
        setTimeout(() => tutupPanel(), 500);
      },
      onError: (err) => {
        setPesan({
          error: getApiErrorMessage(err, 'Gagal menyimpan komentar'),
          sukses: '',
        });
      },
    });
  };

  return (
    <TataLetakAdmin judul="Komentar">
      <KotakCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari indeks, komentar, atau pengguna …"
      />

      <InfoTotal q={q} total={total} label="komentar" />

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

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul="Sunting Komentar">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Indeks" name="indeks" value={panel.data.indeks} onChange={panel.ubahField} disabled={true} />
        <InputField label="Nama" name="pengguna_nama" value={panel.data.pengguna_nama} onChange={panel.ubahField} disabled={true} />
        <InputField label="Surel" name="pengguna_surel" value={panel.data.pengguna_surel} onChange={panel.ubahField} disabled={true} />
        <TextareaField label="Komentar" name="komentar" value={panel.data.komentar} onChange={panel.ubahField} rows={8} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          isPending={simpan.isPending}
          modeTambah={false}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default KomentarAdmin;
