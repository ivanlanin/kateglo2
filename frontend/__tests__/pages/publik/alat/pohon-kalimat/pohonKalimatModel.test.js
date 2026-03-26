import { describe, expect, it } from 'vitest';
import {
  CONTOH,
  buatKonstituen,
  buatPohon,
  buatStateMajemuk,
  buatStateTunggal,
} from '../../../../../src/pages/publik/alat/pohon-kalimat/pohonKalimatModel';

describe('pohonKalimatModel', () => {
  it('membuat state awal tunggal dan majemuk dengan struktur dasar yang valid', () => {
    const tunggal = buatStateTunggal();
    const majemuk = buatStateMajemuk();

    expect(tunggal.jenis).toBe('tunggal');
    expect(tunggal.konstituen).toHaveLength(2);
    expect(tunggal.konstituen[0].id).not.toBe(tunggal.konstituen[1].id);

    expect(majemuk.jenis).toBe('majemuk');
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'klausa')).toHaveLength(2);
    expect(majemuk.segmen.filter((segmen) => segmen.tipe === 'konjungsi')).toHaveLength(1);
  });

  it('membentuk pohon tunggal dan majemuk dari state', () => {
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
    expect(rootTunggal.anak[0].anak[0].label).toBe('FN');
    expect(rootTunggal.anak[0].anak[0].anak[0].label).toBe('Pancasila');

    const rootMajemuk = buatPohon(CONTOH[3].state, false);
    expect(rootMajemuk.label).toBe('Kalimat');
    expect(rootMajemuk.anak).toHaveLength(3);
    expect(rootMajemuk.anak[0].label).toBe('Kl₁');
    expect(rootMajemuk.anak[1].label).toBe('Konj');
    expect(rootMajemuk.anak[1].anak[0].label).toBe('dan');
    expect(rootMajemuk.anak[2].anak.some((anak) => anak.label === 'Konj')).toBe(true);
  });
});
