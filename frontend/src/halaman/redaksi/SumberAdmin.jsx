/**
 * @fileoverview Halaman admin master sumber
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarSumberAdmin,
  useDetailSumberAdmin,
  useSimpanSumber,
  useHapusSumber,
} from '../../api/apiAdmin';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  TabelAdmin,
  getApiErrorMessage,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  TextareaField,
  CheckboxField,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

const nilaiAwal = { kode: '', nama: '', keterangan: '', glosarium: false, kamus: false, tesaurus: false, etimologi: false };

function renderKonteks(item) {
  const flags = [
    item.glosarium && 'Glosarium',
    item.kamus && 'Kamus',
    item.tesaurus && 'Tesaurus',
    item.etimologi && 'Etimologi',
  ].filter(Boolean);
  return flags.length ? flags.join(', ') : '—';
}

const kolom = [
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'jumlah_entri', label: 'Jumlah Entri' },
  { key: 'konteks', label: 'Konteks', render: renderKonteks },
];

function SumberAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarSumberAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailSumberAdmin(idDariPath);
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanSumber();
  const hapus = useHapusSumber();
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID sumber tidak valid.', sukses: '' });
    navigate('/redaksi/sumber', { replace: true });
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
    setPesan({ error: 'Sumber tidak ditemukan.', sukses: '' });
    navigate('/redaksi/sumber', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/sumber', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/sumber', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    if (!item?.id) return;
    setPesan({ error: '', sukses: '' });
    navigate(`/redaksi/sumber/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kode', label: 'Kode' },
      { name: 'nama', label: 'Nama' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus sumber ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' }),
    });
  };

  const handleCari = () => {
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    hapusCari();
  };

  return (
    <TataLetak mode="admin" judul="Sumber" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari sumber …"
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

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Sumber' : 'Sunting Sumber'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <div className="form-admin-group">
          <label className="form-admin-label">Konteks</label>
          <div className="flex flex-col gap-2">
            <CheckboxField label="Glosarium" name="glosarium" value={panel.data.glosarium} onChange={panel.ubahField} />
            <CheckboxField label="Kamus" name="kamus" value={panel.data.kamus} onChange={panel.ubahField} />
            <CheckboxField label="Tesaurus" name="tesaurus" value={panel.data.tesaurus} onChange={panel.ubahField} />
            <CheckboxField label="Etimologi" name="etimologi" value={panel.data.etimologi} onChange={panel.ubahField} />
          </div>
        </div>
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </TataLetak>
  );
}

export default SumberAdmin;
