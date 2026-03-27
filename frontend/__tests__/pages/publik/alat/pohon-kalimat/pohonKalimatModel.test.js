import { describe, expect, it } from 'vitest';
import {
  CONTOH,
  buatKonstituen,
  buatKlausa,
  buatPohon,
  buatStateAwal,
  buatStateMajemuk,
} from '../../../../../src/pages/publik/alat/pohon-kalimat/pohonKalimatModel';

describe('pohonKalimatModel', () => {
  it('membuat state awal dengan satu klausa', () => {
    const awal = buatStateAwal();

    expect(awal.segmen).toHaveLength(1);
    expect(awal.segmen[0].tipe).toBe('klausa');
    expect(awal.segmen[0].konstituen).toHaveLength(2);
    expect(awal.segmen[0].konstituen[0].id).not.toBe(awal.segmen[0].konstituen[1].id);

    const majemuk = buatStateMajemuk();
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'klausa')).toHaveLength(2);
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'konjungsi')).toHaveLength(1);
  });

  it('single klausa renders flat like tunggal', () => {
    const state = {
      segmen: [
        {
          tipe: 'klausa', ...buatKlausa('Klausa'),
          konstituen: [
            buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' }),
            buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'berkembang' }),
          ],
        },
      ],
    };

    const root = buatPohon(state);
    expect(root.label).toBe('Kalimat');
    expect(root.anak).toHaveLength(2);
    expect(root.anak[0].label).toBe('S');
    expect(root.anak[0].anak[0].label).toBe('FN');
    expect(root.anak[0].anak[0].anak[0].label).toBe('Pancasila');
  });

  it('legacy tunggal format masih didukung', () => {
    const rootTunggal = buatPohon({
      jenis: 'tunggal',
      konstituen: [
        buatKonstituen({ peran: 'S', jenisFrasa: 'FN', teks: 'Pancasila' }),
        buatKonstituen({ peran: 'P', jenisFrasa: 'FV', teks: 'berkembang' }),
      ],
    });

    expect(rootTunggal.label).toBe('Kalimat');
    expect(rootTunggal.anak).toHaveLength(2);
    expect(rootTunggal.anak[0].label).toBe('S');
  });

  it('membentuk pohon majemuk dari contoh', () => {
    const rootMajemuk = buatPohon(CONTOH[1].state, false);
    expect(rootMajemuk.label).toBe('Kalimat');
    expect(rootMajemuk.anak).toHaveLength(3);
    expect(rootMajemuk.anak[0].label).toBe('Klausa Utama');
    expect(rootMajemuk.anak[1].label).toBe('Konj');
    expect(rootMajemuk.anak[1].anak[0].anak[0].anak[0].label).toBe('dan');
    expect(rootMajemuk.anak[2].label).toBe('Klausa Utama');
  });
});
